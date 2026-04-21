import { db } from './src/db.js';
import { staff, leaveBalances } from './src/schema.js';
import { eq, and } from 'drizzle-orm';

async function debugMelissa() {
    if (!db) {
        console.error('Database not connected');
        process.exit(1);
    }

    try {
        const melissaId = 'd61a205b-2663-427e-b98d-2c583d3df834';
        console.log(`Checking staff member: ${melissaId}`);

        const [member] = await db.select().from(staff).where(eq(staff.id, melissaId));

        if (!member) {
            console.log('❌ Melissa Blake NOT FOUND in database');
            const allStaff = await db.select().from(staff);
            console.log(`Total staff in DB: ${allStaff.length}`);
            console.log('Listing names:');
            allStaff.forEach(s => console.log(`- ${s.name} (${s.id})`));
        } else {
            console.log(`✅ Found Melissa Blake: ${member.name}`);
            console.log(`- Start Date: ${member.startDate}`);

            const currentYear = 2026;
            const [balance] = await db.select().from(leaveBalances).where(
                and(
                    eq(leaveBalances.staffId, melissaId),
                    eq(leaveBalances.year, currentYear)
                )
            );

            if (balance) {
                console.log('✅ Found Leave Balance:');
                console.log(JSON.stringify(balance, null, 2));
            } else {
                console.log('❌ No Leave Balance found for 2026');
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

debugMelissa();
