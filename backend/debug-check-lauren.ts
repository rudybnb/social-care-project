
import { db } from './src/db.js';
import { staff, shifts } from './src/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function checkLauren() {
    console.log('--- Checking Lauren Status ---');

    // 1. Find Staff
    const lauren = await db.select().from(staff).where(sql`lower(${staff.name}) LIKE '%lauren%'`).limit(1);

    if (lauren.length === 0) {
        console.log('❌ Staff Lauren not found');
        return;
    }

    const staffId = lauren[0].id;
    console.log(`Found Lauren: ${lauren[0].name} (${staffId})`);

    // 2. Check Active Shift
    const activeShift = await db.select().from(shifts).where(and(
        eq(shifts.staffId, staffId),
        eq(shifts.clockedIn, true),
        eq(shifts.clockedOut, false)
    ));

    if (activeShift.length > 0) {
        console.log('⚠️ Active Shift Found:');
        activeShift.forEach(s => {
            console.log(`   - Shift ${s.id} at ${s.siteName}`);
            console.log(`   - Date: ${s.date}`);
            console.log(`   - Start: ${s.startTime}, End: ${s.endTime}`);
            console.log(`   - Clocked In At: ${s.clockInTime}`);
        });
    } else {
        console.log('✅ No Active Shift (She is clocked out or not working)');
        // Check recent completed shifts
        const recent = await db.select().from(shifts)
            .where(eq(shifts.staffId, staffId))
            .orderBy(desc(shifts.date))
            .limit(3);
        console.log('   Recent Shifts:');
        recent.forEach(s => console.log(`   - ${s.date}: In ${s.clockedIn}, Out ${s.clockedOut} (${s.clockOutTime})`));
    }

    // 3. Check Audit Logs (if table exists)
    try {
        const logs = await db.execute(sql`
        SELECT * FROM activity_logs 
        WHERE staff_id = ${staffId} 
        ORDER BY timestamp DESC 
        LIMIT 5
     `);

        console.log('\n--- Recent Activity Logs ---');
        if (logs.rows.length === 0) {
            console.log('No logs found.');
        } else {
            logs.rows.forEach((log: any) => {
                console.log(`[${log.timestamp}] ${log.action} (${log.status}): ${log.details}`);
            });
        }
    } catch (e) {
        console.log('Could not read activity_logs:', e.message);
    }

    process.exit(0);
}

checkLauren();
