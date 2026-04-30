import { db } from './src/db.js';
import { shifts } from './src/schema.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const s = await db.select().from(shifts).where(eq(shifts.date, '2026-04-25'));
        console.log("Shifts for 25th:", JSON.stringify(s, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
