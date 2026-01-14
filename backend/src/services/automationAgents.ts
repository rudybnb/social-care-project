import cron from 'node-cron';
import { db } from '../db.js';
import { shifts, staff } from '../schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import {
  sendShiftReminder,
  sendCoverageGapAlert,
  sendLateClockInAlert,
  sendDeclinedShiftAlert,
  sendWeeklyPayrollReport,
  testEmailConnection,
  sendShiftAuditAlert
} from './emailService.js';
import { auditSingleShift } from './payrollAuditService.js';

// Admin email for alerts
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@socialcare.com';
const ACCOUNTS_EMAIL = process.env.ACCOUNTS_EMAIL || ADMIN_EMAIL; // Use same if not set

import { initTelegramBot, sendClockInReminder, sendLateClockInAlert as sendTelegramLateAlert, sendClockOutReminder, sendForgotClockOutAlert, sendShiftSummary } from './telegramService.js';

// Initialize all automation agents
export async function initializeAgents() {
  console.log('🤖 Initializing automation agents...');

  // Initialize Telegram Bot
  const bot = initTelegramBot();
  if (!bot) {
    console.warn('⚠️  Telegram bot not configured. Reminders will not be sent.');
  }

  // Test email connection first
  const emailReady = await testEmailConnection();
  if (!emailReady) {
    console.warn('⚠️  Email service not configured. Agents will run but emails won\'t be sent.');
    console.warn('   Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM in environment variables.');
  }

  // Agent 1: Daily Shift Reminders (7:00 AM) - EMAIL
  cron.schedule('0 7 * * *', async () => {
    console.log('🔔 Running: Daily Shift Reminder Agent (Email)');
    await sendDailyShiftReminders();
  });

  // Agent 2: Coverage Gap Monitor (Every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('🔍 Running: Coverage Gap Monitor');
    await checkCoverageGaps();
  });

  // Agent 3: Late Clock-In Detector (Every 15 minutes)
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Running: Late Clock-In Detector');
    await checkLateClockIns();
  });

  // Agent 4: Weekly Payroll Reports (Friday 5:00 PM)
  cron.schedule('0 17 * * 5', async () => {
    console.log('💰 Running: Weekly Payroll Reporter');
    await sendWeeklyPayrollReports();
  });

  // Agent 5: Tomorrow's Coverage Check (6:00 PM daily)
  cron.schedule('0 18 * * *', async () => {
    console.log('📅 Running: Tomorrow Coverage Check');
    await checkTomorrowCoverage();
  });

  // Agent 6: Pre-Shift Telegram Reminders (Every 15 minutes)
  // Checks for shifts starting in the next 15-30 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('📲 Running: Pre-Shift Reminder Agent');
    await runPreShiftReminders();
  });

  // Agent 7: Missing Clock-Out Detector (Every 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    console.log('⚠️ Running: Missing Clock-Out Detector');
    await checkMissingClockOuts();
  });

  // Agent 8: Shift Summaries (Daily at 08:30 and 20:30 for 12hr shifts)
  cron.schedule('30 8,20 * * *', async () => {
    console.log('📊 Running: Shift Summary Agent');
    await generateShiftSummaries();
  });

  // Agent 9: Shift Verification Agent (Every 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    console.log('💰 Running: Shift Verification Agent');
    await auditRecentShifts();
  });

  console.log('✅ All automation agents initialized');
  console.log('📋 Active agents:');
  console.log('   - Daily Email Reminders (7:00 AM)');
  console.log('   - Coverage Gap Monitor (Hourly)');
  console.log('   - Late Clock-In Detector (15 min)');
  console.log('   - Weekly Payroll Reports (Fri 5PM)');
  console.log('   - Tomorrow Coverage Check (6PM)');
  console.log('   - Pre-Shift Telegram Reminders (15 min)');
  console.log('   - Missing Clock-Out Detector (30 min)');
  console.log('   - Missing Clock-Out Detector (30 min)
    - Shift Summaries(08: 30 & 20: 30)
  - Shift Verification(30 min)');
}

// Agent 1: Send daily shift reminders
async function sendDailyShiftReminders() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all shifts for today
    const todayShifts = await db.select().from(shifts).where(eq(shifts.date, today));

    let sentCount = 0;
    for (const shift of todayShifts) {
      // Get staff details
      const staffMember = await db.select().from(staff).where(eq(staff.id, shift.staffId)).limit(1);

      if (staffMember.length > 0 && staffMember[0].email) {
        const sent = await sendShiftReminder(
          staffMember[0].email,
          staffMember[0].name,
          {
            site: shift.siteName,
            shiftType: shift.type,
            startTime: shift.startTime,
            endTime: shift.endTime,
            date: shift.date
          }
        );
        if (sent) sentCount++;
      }
    }

    console.log(`✅ Sent ${sentCount} shift reminders for today`);
  } catch (error) {
    console.error('❌ Error in sendDailyShiftReminders:', error);
  }
}

// Agent 2: Check for coverage gaps
async function checkCoverageGaps() {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    // Get all shifts in the next 7 days
    const upcomingShifts = await db.select().from(shifts)
      .where(and(
        gte(shifts.date, todayStr),
        lte(shifts.date, nextWeekStr)
      ));

    // Find unassigned or declined shifts
    const gaps = upcomingShifts.filter(shift =>
      !shift.staffId || shift.staffStatus === 'declined'
    );

    if (gaps.length > 0) {
      const gapDetails = gaps.map(gap => ({
        site: gap.siteName,
        shiftType: gap.type,
        date: gap.date,
        status: gap.staffStatus === 'declined' ? 'declined' : 'unassigned'
      }));

      await sendCoverageGapAlert(ADMIN_EMAIL, gapDetails);
      console.log(`⚠️  Found ${gaps.length} coverage gaps`);
    } else {
      console.log('✅ No coverage gaps found');
    }
  } catch (error) {
    console.error('❌ Error in checkCoverageGaps:', error);
  }
}

// Agent 3: Check for late clock-ins
async function checkLateClockIns() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    // Get all shifts for today that should have started
    const todayShifts = await db.select().from(shifts).where(eq(shifts.date, today));

    const lateShifts = [];
    for (const shift of todayShifts) {
      // Check if shift has started (15 min grace period)
      const shiftStart = shift.startTime;
      const [shiftHour, shiftMin] = shiftStart.split(':').map(Number);
      const [currentHour, currentMin] = currentTime.split(':').map(Number);

      const shiftStartMinutes = shiftHour * 60 + shiftMin;
      const currentMinutes = currentHour * 60 + currentMin;

      // If shift started more than 15 minutes ago and not clocked in
      if (currentMinutes > shiftStartMinutes + 15 && !shift.clockedIn && shift.staffId) {
        const staffMember = await db.select().from(staff).where(eq(staff.id, shift.staffId)).limit(1);

        if (staffMember.length > 0) {
          // Send Telegram Alert to Staff
          await sendTelegramLateAlert(
            shift.staffId,
            shift.siteName,
            shift.startTime,
            currentMinutes - shiftStartMinutes
          );

          lateShifts.push({
            staffName: staffMember[0].name,
            site: shift.siteName,
            shiftType: shift.type,
            startTime: shift.startTime
          });
        }
      }
    }

    if (lateShifts.length > 0) {
      await sendLateClockInAlert(ADMIN_EMAIL, lateShifts);
      console.log(`⚠️  Found ${lateShifts.length} late clock-ins`);
    }
  } catch (error) {
    console.error('❌ Error in checkLateClockIns:', error);
  }
}

// Agent 4: Send weekly payroll reports
async function sendWeeklyPayrollReports() {
  try {
    // Get all active staff
    const allStaff = await db.select().from(staff).where(eq(staff.status, 'Active'));

    // Calculate date range for this week (Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];

    let sentCount = 0;
    for (const staffMember of allStaff) {
      // Get shifts for this staff member this week
      const weekShifts = await db.select().from(shifts)
        .where(and(
          eq(shifts.staffId, staffMember.id),
          gte(shifts.date, mondayStr),
          lte(shifts.date, sundayStr)
        ));

      if (weekShifts.length > 0 && staffMember.email) {
        // Calculate hours and pay
        let totalHours = 0;
        let dayHours = 0;
        let nightHours = 0;

        for (const shift of weekShifts) {
          const hours = shift.duration || 12; // Default 12 hours
          totalHours += hours;
          if (shift.type === 'Night Shift') {
            nightHours += hours;
          } else {
            dayHours += hours;
          }
        }

        const standardRate = parseFloat(staffMember.standardRate) || 12.50;
        const enhancedRate = parseFloat(staffMember.enhancedRate) || 14.00;
        const nightRate = parseFloat(staffMember.nightRate) || 15.00;

        const first20Hours = Math.min(dayHours, 20);
        const after20Hours = Math.max(dayHours - 20, 0);

        const standardPay = (first20Hours * standardRate).toFixed(2);
        const enhancedPay = (after20Hours * enhancedRate).toFixed(2);
        const nightPay = (nightHours * nightRate).toFixed(2);
        const totalPay = (parseFloat(standardPay) + parseFloat(enhancedPay) + parseFloat(nightPay)).toFixed(2);

        const payrollData = {
          weekStart: mondayStr,
          totalHours: totalHours.toFixed(1),
          first20Hours: first20Hours.toFixed(1),
          after20Hours: after20Hours.toFixed(1),
          nightHours: nightHours.toFixed(1),
          standardRate: standardRate.toFixed(2),
          enhancedRate: enhancedRate.toFixed(2),
          nightRate: nightRate.toFixed(2),
          standardPay,
          enhancedPay,
          nightPay,
          totalPay
        };

        const sent = await sendWeeklyPayrollReport(staffMember.email, staffMember.name, payrollData);
        if (sent) sentCount++;
      }
    }

    console.log(`✅ Sent ${sentCount} weekly payroll reports`);
  } catch (error) {
    console.error('❌ Error in sendWeeklyPayrollReports:', error);
  }
}

// Agent 5: Check tomorrow's coverage
async function checkTomorrowCoverage() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const tomorrowShifts = await db.select().from(shifts).where(eq(shifts.date, tomorrowStr));

    const gaps = tomorrowShifts.filter(shift =>
      !shift.staffId || shift.staffStatus === 'declined'
    );

    if (gaps.length > 0) {
      const gapDetails = gaps.map(gap => ({
        site: gap.siteName,
        shiftType: gap.type,
        date: gap.date,
        status: gap.staffStatus === 'declined' ? 'declined' : 'unassigned'
      }));

      await sendCoverageGapAlert(ADMIN_EMAIL, gapDetails);
      console.log(`⚠️  Found ${gaps.length} gaps for tomorrow`);
    } else {
      console.log('✅ Tomorrow is fully covered');
    }
  } catch (error) {
    console.error('❌ Error in checkTomorrowCoverage:', error);
  }
}

// Manual trigger for declined shift alerts (called from API endpoint)
export async function triggerDeclinedShiftAlert(shift: any) {
  try {
    await sendDeclinedShiftAlert(ADMIN_EMAIL, shift);
    console.log('✅ Declined shift alert sent');
  } catch (error) {
    console.error('❌ Error sending declined shift alert:', error);
  }
}

// Agent 9: Audit Recent Shifts
async function auditRecentShifts() {
  try {
    const now = new Date();
    // Look back 35 minutes to catch shifts clocked out since last run (every 30 mins)
    // with a 5 minute buffer.
    const lookback = new Date(now.getTime() - 35 * 60000);
    const lookbackStr = lookback.toISOString(); // or keep as date object if drizzle supports it? 
    // Drizzle timestamps are usually Date objects in node-postgres? 
    // Schema says timestamp('clock_out_time'), so it expects Date.

    // Find shifts clocked out recently
    const recentShifts = await db.select().from(shifts)
      .where(and(
        eq(shifts.clockedOut, true),
        gte(shifts.clockOutTime, lookback)
      ));

    if (recentShifts.length > 0) {
      console.log(`🔎 Found ${recentShifts.length} recently completed shifts to audit.`);
      for (const shift of recentShifts) {
        try {
          const auditData = await auditSingleShift(shift.id);
          // Send to Admin (or Accounts email if distinct)
          await sendShiftAuditAlert(ACCOUNTS_EMAIL, auditData);
          console.log(`✅ Audited shift ${shift.id} for ${shift.staffName}`);
        } catch (err) {
          console.error(`❌ Failed to audit shift ${shift.id}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in auditRecentShifts:', error);
  }
}

// ==========================================
// PENDING IMPLEMENTATION STUBS (Fixes Build)
// ==========================================

async function runPreShiftReminders() {
  console.log('🚧 runPreShiftReminders: Not implemented yet');
}

async function checkMissingClockOuts() {
  console.log('🚧 checkMissingClockOuts: Not implemented yet');
}

async function generateShiftSummaries() {
  console.log('🚧 generateShiftSummaries: Not implemented yet');
}

