
import dotenv from 'dotenv';
dotenv.config();

import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { shifts, staff } from './src/schema'; // Keep using schema for type safety locally if possible, or just raw sql
import { ilike, eq, and, gte, desc } from 'drizzle-orm';

async function checkSingita() {
    console.log('Connecting to DB...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const db = drizzle(client);

        console.log('Checking for Singita...');
        const person = await db.select().from(staff).where(ilike(staff.name, '%Singita%'));

        if (person.length === 0) {
            console.log('❌ Singita not found in details');
        } else {
            console.log('✅ Found Staff:', person.map(p => `${p.name} (${p.id})`));
            const sId = person[0].id;

            // Check last 10 days
            const recentShifts = await db.select().from(shifts).where(
                and(
                    eq(shifts.staffId, sId),
                    gte(shifts.date, '2026-01-10')
                )
            ).orderBy(desc(shifts.date));

            console.log(`Found ${recentShifts.length} shifts since Jan 10th:`);
            recentShifts.forEach(s => {
                console.log(`\n--- Shift ${s.id} ---`);
                console.log(`Date: ${s.date}`);
                console.log(`Type: ${s.type}`);
                console.log(`Site: ${s.siteName}`);
                console.log(`Scheduled: ${s.startTime} - ${s.endTime}`);
                console.log(`Duration (Table Column): ${s.duration}`);
                console.log(`Clocked In: ${s.clockedIn}, Out: ${s.clockedOut}`);
                if (s.clockInTime) console.log(`ClockInTime: ${s.clockInTime}`);
                if (s.clockOutTime) console.log(`ClockOutTime: ${s.clockOutTime}`);
                console.log(`Notes: ${s.notes}`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkSingita();
