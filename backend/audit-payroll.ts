
import { db } from './src/db';
import { shifts, staff } from './src/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

async function auditPayroll() {
  console.log('🔍 Starting Payroll Audit (2025-12-14 to 2026-01-14)...\n');

  const startDate = '2025-12-14';
  const endDate = '2026-01-14';

  // Fetch all active staff
  const allStaff = await db.select().from(staff);
  
  // Fetch all shifts in range
  const rangeShifts = await db.select().from(shifts)
    .where(and(
      gte(shifts.date, startDate),
      lte(shifts.date, endDate)
    ));

  console.log(`found ${rangeShifts.length} shifts in this period.`);

  // Group shifts by staff
  const staffShifts = {};
  for (const shift of rangeShifts) {
    if (!staffShifts[shift.staffId]) staffShifts[shift.staffId] = [];
    staffShifts[shift.staffId].push(shift);
  }

  // Iterate staff
  for (const person of allStaff) {
    const myShifts = staffShifts[person.id] || [];
    if (myShifts.length === 0) continue;

    console.log(`\n==================================================`);
    console.log(`👤 Staff: ${person.name} (${person.role})`);
    console.log(`   Source Rates (from DB 'staff' table):`);
    console.log(`   - Standard: £${person.standardRate}`);
    console.log(`   - Enhanced: ${person.enhancedRate !== '—' ? '£'+person.enhancedRate : 'N/A'}`);
    console.log(`   - Night:    ${person.nightRate !== '—' ? '£'+person.nightRate : 'N/A'}`);
    
    // Group by Week (Mon-Sun) to apply the "First 20 hours" logic correctly? 
    // Wait, the logic is "First 20 hours of the WEEK".
    // I need to bucket these shifts into ISO weeks.
    
    const weeks = {};
    for (const shift of myShifts) {
      const date = new Date(shift.date);
      // Get logical week start (Monday)
      const day = date.getDay();
      const diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(date.setDate(diff)).toISOString().split('T')[0];
      
      if (!weeks[monday]) weeks[monday] = [];
      weeks[monday].push(shift);
    }

    let grandTotalPay = 0;
    let grandTotalHours = 0;

    // Process each week
    for (const [weekStart, weeklyShifts] of Object.entries(weeks)) {
      console.log(`\n   📅 Week Starting ${weekStart}:`);
      
      let dayHours = 0;
      let nightHours = 0;
      let detailedLog = [];

      for (const shift of weeklyShifts) {
        const hours = shift.duration || 12; // Fallback to 12 if 0?
        if (shift.type === 'Night Shift' || shift.type === 'Night') {
            nightHours += hours;
            detailedLog.push(`      - ${shift.date}: ${shift.type} (${hours}h) -> Night Rate`);
        } else {
            dayHours += hours;
            detailedLog.push(`      - ${shift.date}: ${shift.type} (${hours}h) -> Day Logic`);
        }
      }

      // Calculation
      const standardRate = parseFloat(person.standardRate) || 0;
      const enhancedRate = parseFloat(person.enhancedRate) || standardRate; // Fallback to standard if missing? or 0? 
      // automationAgents.ts lines 268 sets default 14.00, let's see logic there.
      // const enhancedRate = parseFloat(staffMember.enhancedRate) || 14.00;
      // I should be careful. If the DB has it as '—', it might default to something else in code.
      // Let's use the DB value if parseable, else 0 or alert user.
      const safeEnhanced = (person.enhancedRate && person.enhancedRate !== '—') ? parseFloat(person.enhancedRate) : 0;
      const safeNight = (person.nightRate && person.nightRate !== '—') ? parseFloat(person.nightRate) : 0;
      
      const first20 = Math.min(dayHours, 20);
      const after20 = Math.max(dayHours - 20, 0);

      const standardPay = first20 * standardRate;
      const enhancedPay = after20 * safeEnhanced;
      const nightPay = nightHours * safeNight;
      const totalWeekPay = standardPay + enhancedPay + nightPay;

      grandTotalPay += totalWeekPay;
      grandTotalHours += (dayHours + nightHours);

      detailedLog.forEach(l => console.log(l));
      console.log(`      ----------------------------------`);
      console.log(`      Day Hrs: ${dayHours} (Std: ${first20} @ £${standardRate}, Enh: ${after20} @ £${safeEnhanced})`);
      console.log(`      Night Hrs: ${nightHours} (@ £${safeNight})`);
      console.log(`      💵 Week Pay: £${totalWeekPay.toFixed(2)}`);
    }
    
    console.log(`\n   💰 TOTAL PERIOD PAY: £${grandTotalPay.toFixed(2)} (${grandTotalHours} hrs)`);
  }
}

auditPayroll().catch(console.error).then(() => process.exit(0));
