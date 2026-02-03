
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { shifts } from './src/schema';
import { eq, or, desc } from 'drizzle-orm';

dotenv.config();

async function checkShifts() {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.error("DATABASE_URL not found in .env");
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(pool);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`Checking shifts for ${yesterdayStr} and ${todayStr}...`);

    try {
        const recentShifts = await db.select({
            id: shifts.id,
            staffName: shifts.staffName,
            date: shifts.date,
            startTime: shifts.startTime,
            endTime: shifts.endTime,
            clockInTime: shifts.clockInTime,
            clockOutTime: shifts.clockOutTime,
            duration: shifts.duration,
            status: shifts.staffStatus,
            notes: shifts.notes
        })
            .from(shifts)
            .where(
                or(
                    eq(shifts.date, yesterdayStr),
                    eq(shifts.date, todayStr)
                )
            )
            .orderBy(desc(shifts.date));

        console.log(`Found ${recentShifts.length} shifts.`);

        recentShifts.forEach(s => {
            console.log(`\n-----------------------------------`);
            console.log(`${s.date} | ${s.staffName} (${s.status})`);
            console.log(`Shift ID: ${s.id}`);
            console.log(`Scheduled: ${s.startTime} - ${s.endTime}`);
            console.log(`Actual   : ${s.clockInTime ? s.clockInTime.toISOString().substring(11, 16) : 'Missing'} - ${s.clockOutTime ? s.clockOutTime.toISOString().substring(11, 16) : 'Missing'}`);
            console.log(`Duration : ${s.duration}`);
            if (s.notes) console.log(`Notes    : ${s.notes}`);
        });

    } catch (err) {
        console.error("Error fetching shifts:", err);
    } finally {
        await pool.end();
    }
}

checkShifts();
