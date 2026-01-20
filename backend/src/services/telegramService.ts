// Telegram Bot Service for Clock-in Reminders
// Uses the Telegram Bot API to send reminders to staff

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../index.js';
import { staff, shifts } from '../schema.js';
import { eq, and } from 'drizzle-orm';

// Telegram Bot Token - set this in environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID || '';

// Initialize bot (polling mode for receiving messages, webhook mode for production)
let bot: TelegramBot | null = null;

export function initTelegramBot() {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('⚠️  TELEGRAM_BOT_TOKEN not set - Telegram reminders disabled');
        return null;
    }

    try {
        const disablePolling = process.env.DISABLE_TELEGRAM_POLLING === 'true';

        bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
            polling: !disablePolling
        });

        if (disablePolling) {
            console.log('ℹ️ Telegram polling disabled by environment variable');
        } else {
            // Handle polling errors to prevent crash/noisy logs on deployment
            bot.on('polling_error', (error: any) => {
                // 409 Conflict is normal during zero-downtime deployments
                if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
                    // Suppress stack trace for expected conflicts
                    console.warn(`⚠️ Telegram Polling Conflict: Another instance is running (normal during deployment).`);
                } else {
                    console.error('❌ Telegram Polling Error:', error.message);
                }
            });
        }

        // Handle /start command - this is how staff link their account
        bot.onText(/\/start (.+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
            const chatId = msg.chat.id;
            const staffId = match ? match[1] : null;

            if (!staffId) {
                bot?.sendMessage(chatId, '❌ Invalid link. Please use the link from your staff app.');
                return;
            }

            try {
                // Update staff record with their Telegram chat ID
                if (db) {
                    await db.update(staff)
                        .set({ telegramChatId: chatId.toString() })
                        .where(eq(staff.id, staffId));

                    const staffMember = await db.select().from(staff).where(eq(staff.id, staffId));
                    const name = staffMember[0]?.name || 'Staff Member';

                    bot?.sendMessage(chatId,
                        `✅ Connected successfully!\n\nHello ${name}! You will now receive:\n` +
                        `📍 Clock-in reminders before your shift\n` +
                        `⏰ Alerts if you forget to clock in/out\n\n` +
                        `Make sure to keep Telegram notifications enabled!`
                    );

                    console.log(`✅ Telegram linked for staff ${staffId} -> chat ${chatId}`);
                }
            } catch (error) {
                console.error('Error linking Telegram account:', error);
                bot?.sendMessage(chatId, '❌ Error linking your account. Please try again or contact admin.');
            }
        });

        // Handle /ping command - Simple health check
        bot.onText(/\/ping/, async (msg: TelegramBot.Message) => {
            const chatId = msg.chat.id;
            bot?.sendMessage(chatId, `🏓 Pong! Bot is running.\nTime: ${new Date().toISOString()}`);
        });

        // Handle /fix command - Manual Clock-In/Out
        // Format: /fix <StaffName> <Date> <Start> <End>
        // Example: /fix Lauren 14/01 08:00 20:00
        bot.onText(/\/fix (.+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
            const chatId = msg.chat.id;
            // Security: Only allow admin chat
            if (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID) {
                return;
            }

            const rawInput = match ? match[1] : '';
            // Split by space, handle potentially multi-word names later? No, keep simple for now.
            // Better regex or splitting: Name might have spaces.
            // Let's assume Name is first token(s), then Date, Start, End.
            // Actually, safer to ask: /fix <Date> <Start> <End> <StaffName...>
            // Or just split by spaces and try to parse date/time from the end.

            const parts = rawInput.trim().split(/\s+/);
            if (parts.length < 4) {
                bot?.sendMessage(chatId, '❌ Usage: /fix <StaffName> <Date> <StartHH:MM> <EndHH:MM>\nExample: /fix Lauren 2025-01-14 08:00 20:00');
                return;
            }

            const endTimeStr = parts.pop();
            const startTimeStr = parts.pop();
            const dateStr = parts.pop();
            const staffNamePart = parts.join(' '); // Remainder is name

            if (!endTimeStr || !startTimeStr || !dateStr || !staffNamePart) return;

            try {
                if (!db) {
                    bot?.sendMessage(chatId, '❌ Database not connected.');
                    return;
                }

                // 1. Find Staff
                const allStaff = await db.select().from(staff);
                console.log(`[/fix] Found ${allStaff.length} staff members in DB`);
                // Fuzzy match
                const targetStaff = allStaff.find(s => s.name.toLowerCase().includes(staffNamePart.toLowerCase()));

                if (!targetStaff) {
                    // Show available staff names for debugging
                    const staffNames = allStaff.map(s => s.name).slice(0, 15).join(', ');
                    bot?.sendMessage(chatId,
                        `❌ Staff member containing "${staffNamePart}" not found.\n\n` +
                        `📋 Available staff (${allStaff.length} total):\n${staffNames || 'None found'}`
                    );
                    return;
                }

                // 2. Parse Date
                // Handle DD/MM or YYYY-MM-DD
                let targetDate = dateStr;
                if (dateStr.includes('/')) {
                    const [d, m, y] = dateStr.split('/');
                    const year = y && y.length === 4 ? y : `20${y || '25'}`; // Guess year 2025/2026? Warning: unsafe.
                    // Ideally force YYYY-MM-DD or use specific Logic
                    // Let's rely on standard ISO for now if possible, or try to format.
                    // Actually, db stores date as YYYY-MM-DD string.
                    targetDate = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }

                // 3. Find Shift
                const shiftsFound = await db.select().from(shifts).where(and(
                    eq(shifts.staffId, targetStaff.id),
                    eq(shifts.date, targetDate)
                )); // Note: this relies on 'date' column string format match

                if (shiftsFound.length === 0) {
                    // Try creating it? Or error?
                    // For now error, user can create shift in app or I can add create logic.
                    // Error is safer.
                    bot?.sendMessage(chatId, `❌ No shift found for ${targetStaff.name} on ${targetDate}.`);
                    return;
                }

                const targetShift = shiftsFound[0]; // Update first match

                // 4. Update Times
                const clockIn = new Date(`${targetDate}T${startTimeStr}:00`);
                const clockOut = new Date(`${targetDate}T${endTimeStr}:00`);

                // Handle overnight
                if (clockOut < clockIn) {
                    clockOut.setDate(clockOut.getDate() + 1);
                }

                const durationMs = clockOut.getTime() - clockIn.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);

                await db.update(shifts)
                    .set({
                        clockedIn: true,
                        clockInTime: clockIn,
                        clockedOut: true,
                        clockOutTime: clockOut,
                        duration: parseFloat(durationHours.toFixed(2)),
                        notes: (targetShift.notes || '') + ' [Manual /fix]',
                        updatedAt: new Date()
                    })
                    .where(eq(shifts.id, targetShift.id));

                bot?.sendMessage(chatId, `✅ Updated shift for <b>${targetStaff.name}</b> on ${targetDate}.\nTime: ${startTimeStr} - ${endTimeStr} (${durationHours.toFixed(2)}h)`, { parse_mode: 'HTML' });

            } catch (err: any) {
                console.error(err);
                bot?.sendMessage(chatId, `❌ Error: ${err.message}`);
            }
        });

        // Handle /fixbatch command - Batch Manual Clock-In/Out for same staff
        // Format: /fixbatch <StaffName>
        //         <Date> <Start> <End>
        //         <Date> <Start> <End>
        // Example: /fixbatch Lauren
        //          15/12 10:00 15:00
        //          16/12 08:00 16:00
        bot.onText(/\/fixbatch (.+)/s, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
            const chatId = msg.chat.id;
            // Security: Only allow admin chat
            if (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID) {
                return;
            }

            const rawInput = match ? match[1] : '';
            const lines = rawInput.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);

            if (lines.length < 2) {
                bot?.sendMessage(chatId,
                    '❌ Usage: /fixbatch <StaffName>\n' +
                    '<Date> <StartHH:MM> <EndHH:MM>\n' +
                    '<Date> <StartHH:MM> <EndHH:MM>\n\n' +
                    'Example:\n/fixbatch Lauren\n15/12 10:00 15:00\n16/12 08:00 16:00');
                return;
            }

            const staffNamePart = lines[0];
            const shiftLines = lines.slice(1);

            try {
                if (!db) {
                    bot?.sendMessage(chatId, '❌ Database not connected.');
                    return;
                }

                // 1. Find Staff
                const allStaff = await db.select().from(staff);
                console.log(`[/fixbatch] Found ${allStaff.length} staff members in DB`);

                const targetStaff = allStaff.find(s => s.name.toLowerCase().includes(staffNamePart.toLowerCase()));

                if (!targetStaff) {
                    // Show available staff names for debugging
                    const staffNames = allStaff.map(s => s.name).slice(0, 15).join(', ');
                    bot?.sendMessage(chatId,
                        `❌ Staff member containing "${staffNamePart}" not found.\n\n` +
                        `📋 Available staff (${allStaff.length} total):\n${staffNames || 'None found'}`
                    );
                    return;
                }

                const results: string[] = [];
                let successCount = 0;
                let errorCount = 0;

                // 2. Process each shift line
                for (const line of shiftLines) {
                    const parts = line.split(/\s+/);
                    if (parts.length < 3) {
                        results.push(`❌ Invalid format: ${line}`);
                        errorCount++;
                        continue;
                    }

                    const [dateStr, startTimeStr, endTimeStr] = parts;

                    // Parse Date
                    let targetDate = dateStr;
                    if (dateStr.includes('/')) {
                        const [d, m, y] = dateStr.split('/');
                        const year = y && y.length === 4 ? y : `20${y || '25'}`;
                        targetDate = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                    }


                    // Find Shift - search by staffId OR staffName (for robustness)
                    let shiftsFound = await db.select().from(shifts).where(and(
                        eq(shifts.staffId, targetStaff.id),
                        eq(shifts.date, targetDate)
                    ));

                    // If not found by staffId, try by staffName
                    if (shiftsFound.length === 0) {
                        shiftsFound = await db.select().from(shifts).where(and(
                            eq(shifts.staffName, targetStaff.name),
                            eq(shifts.date, targetDate)
                        ));
                    }

                    if (shiftsFound.length === 0) {
                        // Check if there are ANY shifts for this staff member on nearby dates for debugging
                        const anyShifts = await db.select().from(shifts).where(
                            eq(shifts.staffName, targetStaff.name)
                        );
                        const availableDates = anyShifts.map(s => s.date).slice(0, 5).join(', ');
                        results.push(`❌ No shift for "${targetStaff.name}" on ${targetDate} (Available: ${availableDates || 'none'})`);
                        errorCount++;
                        continue;
                    }

                    const targetShift = shiftsFound[0];

                    // Update Times
                    const clockIn = new Date(`${targetDate}T${startTimeStr}:00`);
                    const clockOut = new Date(`${targetDate}T${endTimeStr}:00`);

                    // Handle overnight
                    if (clockOut < clockIn) {
                        clockOut.setDate(clockOut.getDate() + 1);
                    }


                    const durationMs = clockOut.getTime() - clockIn.getTime();
                    const durationHours = durationMs / (1000 * 60 * 60);

                    try {
                        await db.update(shifts)
                            .set({
                                clockedIn: true,
                                clockInTime: clockIn,
                                clockedOut: true,
                                clockOutTime: clockOut,
                                duration: parseFloat(durationHours.toFixed(2)),
                                notes: (targetShift.notes || '') + ' [Manual /fixbatch]',
                                updatedAt: new Date()
                            })
                            .where(eq(shifts.id, targetShift.id));

                        results.push(`✅ ${targetDate}: ${startTimeStr}-${endTimeStr} (${durationHours.toFixed(1)}h)`);
                        successCount++;
                    } catch (updateError: any) {
                        console.error(`Failed to update shift ${targetShift.id}:`, updateError);
                        results.push(`❌ DB error on ${targetDate}: ${updateError.message?.substring(0, 50) || 'Unknown'}`);
                        errorCount++;
                    }
                }

                // Send summary
                const summary =
                    `📋 <b>Batch Update for ${targetStaff.name}</b>\n\n` +
                    results.join('\n') +
                    `\n\n✅ ${successCount} updated | ❌ ${errorCount} failed`;

                bot?.sendMessage(chatId, summary, { parse_mode: 'HTML' });

            } catch (err: any) {
                console.error(err);
                bot?.sendMessage(chatId, `❌ Error: ${err.message}`);
            }
        });

        // Handle /report command - Manual Daily Payroll Report
        // Usage: /report or /report YYYY-MM-DD
        bot.onText(/\/report(?: (.+))?/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
            const chatId = msg.chat.id;
            // Security: Only allow admin chat
            if (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID) {
                return;
            }

            try {
                if (!db) {
                    bot?.sendMessage(chatId, '❌ Database not connected.');
                    return;
                }

                // Parse date - default to yesterday
                let targetDate: string;
                const dateArg = match ? match[1]?.trim() : null;

                if (dateArg) {
                    // Handle DD/MM or YYYY-MM-DD format
                    if (dateArg.includes('/')) {
                        const [d, m, y] = dateArg.split('/');
                        const year = y && y.length === 4 ? y : `20${y || '25'}`;
                        targetDate = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                    } else {
                        targetDate = dateArg;
                    }
                } else {
                    // Default to yesterday
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    targetDate = yesterday.toISOString().split('T')[0];
                }

                bot?.sendMessage(chatId, `📊 Generating report for ${targetDate}...`);

                // Get all shifts for that date
                const dayShifts = await db.select().from(shifts).where(eq(shifts.date, targetDate));

                if (dayShifts.length === 0) {
                    bot?.sendMessage(chatId, `ℹ️ No shifts found for ${targetDate}.`);
                    return;
                }

                // Get all staff for rate lookup
                const allStaff = await db.select().from(staff);
                const staffMap = new Map(allStaff.map(s => [s.id, s]));

                let totalCost = 0;
                let totalHours = 0;
                let staffCount = 0;
                const staffTotals = new Map<string, { name: string; hours: number; pay: number; notes: Set<string> }>();

                for (const shift of dayShifts) {
                    if (!shift.staffId) continue;

                    // Use scheduled duration if hours are missing (e.g. not clocked out)
                    const hours = shift.duration || 0;
                    const staffMember = staffMap.get(shift.staffId);
                    if (!staffMember) continue;

                    // Calculate pay (simplified - use shift type for rate)
                    const rate = shift.type === 'Night Shift'
                        ? parseFloat(staffMember.nightRate || '15')
                        : parseFloat(staffMember.standardRate || '12.50');

                    const pay = hours * rate;

                    // Accumulate per staff
                    const existing = staffTotals.get(shift.staffId);
                    if (existing) {
                        existing.hours += hours;
                        existing.pay += pay;
                        if (shift.notes) existing.notes.add(shift.notes);
                        if (shift.declineReason) existing.notes.add(`Declined: ${shift.declineReason}`);
                        if (shift.extensionReason) existing.notes.add(`Extended: ${shift.extensionReason}`);
                    } else {
                        const notes = new Set<string>();
                        if (shift.notes) notes.add(shift.notes);
                        if (shift.declineReason) notes.add(`Declined: ${shift.declineReason}`);
                        if (shift.extensionReason) notes.add(`Extended: ${shift.extensionReason}`);
                        staffTotals.set(shift.staffId, { name: staffMember.name, hours, pay, notes });
                        staffCount++;
                    }

                    totalHours += hours;
                    totalCost += pay;
                }

                // Format breakdown
                let breakdown = '';
                staffTotals.forEach(s => {
                    breakdown += `${s.name.padEnd(18)} | ${s.hours.toFixed(1).padStart(5)}h | £${s.pay.toFixed(2)}\n`;
                    if (s.notes && s.notes.size > 0) {
                        s.notes.forEach(n => breakdown += `   ↳ ${n.substring(0, 50)}\n`);
                    }
                });

                const message =
                    `📅 <b>Payroll Report</b>\n` +
                    `Date: ${targetDate}\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `👥 Staff Worked: ${staffCount}\n` +
                    `⏱ Total Hours: ${totalHours.toFixed(1)} hrs\n` +
                    `💷 <b>Total Cost: £${totalCost.toFixed(2)}</b>\n\n` +
                    `<b>Breakdown:</b>\n` +
                    `<pre>${breakdown || 'No clocked shifts'}</pre>`;

                bot?.sendMessage(chatId, message, { parse_mode: 'HTML' });

            } catch (err: any) {
                console.error(err);
                bot?.sendMessage(chatId, `❌ Error: ${err.message}`);
            }
        });

        console.log('✅ Telegram bot initialized successfully');
        return bot;
    } catch (error) {
        console.error('❌ Failed to initialize Telegram bot:', error);
        return null;
    }
}

// Send a message to a specific staff member
export async function sendTelegramMessage(staffId: string, message: string): Promise<boolean> {
    if (!bot || !db) return false;

    try {
        const staffMember = await db.select().from(staff).where(eq(staff.id, staffId));
        const chatId = staffMember[0]?.telegramChatId;

        if (!chatId) {
            console.log(`⚠️  Staff ${staffId} has no Telegram linked`);
            return false;
        }

        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        console.log(`📱 Telegram sent to ${staffId}: ${message.substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send Telegram to ${staffId}:`, error);
        return false;
    }
}

// Send a message to admin
export async function sendAdminTelegram(message: string): Promise<boolean> {
    if (!bot || !ADMIN_CHAT_ID) {
        console.warn('⚠️  Cannot send admin Telegram - bot or ADMIN_CHAT_ID not configured');
        return false;
    }

    try {
        await bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
        console.log(`📱 Admin Telegram sent: ${message.substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send admin Telegram:', error);
        return false;
    }
}

// Send clock-in reminder to staff
export async function sendClockInReminder(staffId: string, siteName: string, startTime: string): Promise<boolean> {
    const message =
        `⏰ <b>Shift Reminder</b>\n\n` +
        `Your shift at <b>${siteName}</b> starts at <b>${startTime}</b>.\n\n` +
        `📍 Don't forget to clock in when you arrive!`;

    return sendTelegramMessage(staffId, message);
}

// Send late clock-in alert to staff
export async function sendLateClockInAlert(staffId: string, siteName: string, startTime: string, minutesLate: number): Promise<boolean> {
    const message =
        `⚠️ <b>Clock-In Alert</b>\n\n` +
        `You haven't clocked in for your shift at <b>${siteName}</b>.\n` +
        `Shift started: ${startTime} (${minutesLate} minutes ago)\n\n` +
        `🔔 Please clock in now!`;

    return sendTelegramMessage(staffId, message);
}

// Send clock-out reminder to staff
export async function sendClockOutReminder(staffId: string, siteName: string, endTime: string): Promise<boolean> {
    const message =
        `🏁 <b>Shift Ending</b>\n\n` +
        `Your shift at <b>${siteName}</b> ends at <b>${endTime}</b>.\n\n` +
        `📍 Don't forget to clock out before you leave!`;

    return sendTelegramMessage(staffId, message);
}

// Send forgot clock-out alert to staff
export async function sendForgotClockOutAlert(staffId: string, siteName: string, endTime: string): Promise<boolean> {
    const message =
        `🔴 <b>Clock-Out Alert</b>\n\n` +
        `You haven't clocked out from <b>${siteName}</b>.\n` +
        `Shift ended: ${endTime}\n\n` +
        `⚠️ Please clock out now, or your shift may be auto-clocked out!`;

    return sendTelegramMessage(staffId, message);
}

// Send shift summary to admin
export async function sendShiftSummary(
    shiftType: 'Day' | 'Night',
    totalShifts: number,
    clockedIn: number,
    notClockedIn: number,
    clockedOut: number,
    notClockedOut: number
): Promise<boolean> {
    const message =
        `📊 <b>${shiftType} Shift Summary</b>\n\n` +
        `Total Shifts: ${totalShifts}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `✅ Clocked In: ${clockedIn}\n` +
        `❌ Not Clocked In: ${notClockedIn}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `✅ Clocked Out: ${clockedOut}\n` +
        `❌ Not Clocked Out: ${notClockedOut}`;

    return sendAdminTelegram(message);
}

// Send daily payroll report to admin
export async function sendPayrollReport(reportData: any): Promise<boolean> {
    const breakdown = reportData.breakdownText ? reportData.breakdownText.substring(0, 3500) : 'No detail'; // Telegram limit is 4096

    const message =
        `📅 <b>Daily Payroll Report</b>\n` +
        `Date: ${reportData.date}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `👥 Staff Worked: ${reportData.staffCount}\n` +
        `⏱ Total Hours: ${reportData.totalHours} hrs\n` +
        `💷 <b>Total Cost: £${reportData.totalCost}</b>\n\n` +
        `<b>Breakdown:</b>\n` +
        `<pre>${breakdown}</pre>\n` +
        `(End of Report)`;

    return sendAdminTelegram(message);
}

// Generate Telegram link for a staff member
export function generateTelegramLink(staffId: string): string {
    if (!TELEGRAM_BOT_TOKEN) return '';

    // Extract bot username from token (first part before colon)
    // For now, return a placeholder - the actual username needs to be configured
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername';
    return `https://t.me/${botUsername}?start=${staffId}`;
}

export { bot };
