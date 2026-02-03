
import dotenv from 'dotenv';
dotenv.config();

import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { shifts, staff } from './src/schema';
import { ilike, eq, and, gte, desc } from 'drizzle-orm';

async function auditData() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const db = drizzle(client);
        console.log('✅ Connected.');

        // 1. Check Singita for 2026-01-19
        console.log('\n🔍 Checking Singita (2026-01-19)...');
        const singita = await db.select().from(staff).where(ilike(staff.name, '%Singita%'));
        if (singita.length > 0) {
            const sShifts = await db.select().from(shifts).where(
                and(
                    eq(shifts.staffId, singita[0].id),
                    eq(shifts.date, '2026-01-19')
                )
            );

            sShifts.forEach(s => {
                console.log(`[Shift ${s.id}] Status: ${s.staffStatus} | Time: ${s.startTime}-${s.endTime} | Dur: ${s.duration} | Notes: ${s.notes}`);
            });
        }

        // 2. Check Kingsley for 2026-01-19
        console.log('\n🔍 Checking Kingsley (2026-01-19)...');
        const kingsley = await db.select().from(staff).where(ilike(staff.name, '%Kingsley%'));
        if (kingsley.length > 0) {
            const kShifts = await db.select().from(shifts).where(
                and(
                    eq(shifts.staffId, kingsley[0].id),
                    eq(shifts.date, '2026-01-19')
                )
            );

            if (kShifts.length === 0) console.log("No shifts found for Kingsley on this date.");
            kShifts.forEach(s => {
                console.log(`[Shift ${s.id}] Status: ${s.staffStatus} | Time: ${s.startTime}-${s.endTime} | Dur: ${s.duration} | Notes: ${s.notes}`);
            });
        } else {
            console.log("Kingsley staff record not found.");
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

auditData();
