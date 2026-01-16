
import { db } from './src/db';
import { shifts, staff } from './src/schema';
import { ilike, eq, and, gte } from 'drizzle-orm';

async function checkKingsley() {
    console.log('Checking for Kingsley...');
    const person = await db.select().from(staff).where(ilike(staff.name, '%Kingsley%'));

    if (person.length === 0) {
        console.log('❌ Kingsley not found in details');
    } else {
        console.log('✅ Found Staff:', person.map(p => `${p.name} (${p.id})`));
        const kID = person[0].id;

        const myShifts = await db.select().from(shifts).where(
            and(
                eq(shifts.staffId, kID),
                gte(shifts.date, '2025-01-01') // Check recent
            )
        );

        console.log(`Found ${myShifts.length} shifts since Jan 1st:`);
        myShifts.forEach(s => {
            console.log(`- ${s.date} (${s.type}): ${s.clockedIn ? 'Clocked In' : 'NOT In'} / ${s.clockedOut ? 'Clocked Out' : 'NOT Out'}`);
            console.log(`  Times: ${s.startTime}-${s.endTime}`);
        });
    }
    process.exit(0);
}

checkKingsley();
