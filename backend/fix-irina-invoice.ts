
import 'dotenv/config';
import { db } from './src/db';
import { shifts, staff } from './src/schema';
import { eq, and } from 'drizzle-orm';

const updates = [
    { date: '2025-12-15', start: '09:20', end: '17:00', dur: 7.67, type: 'Day' },
    { date: '2025-12-17', start: '15:00', end: '21:00', dur: 6.00, type: 'Day' },
    { date: '2025-12-18', start: '20:00', end: '11:00', dur: 15.00, type: 'Night' },
    { date: '2025-12-23', start: '20:00', end: '08:20', dur: 12.33, type: 'Night' },
    { date: '2025-12-26', start: '12:00', end: '21:00', dur: 9.00, type: 'Day' },
    { date: '2025-12-29', start: '08:30', end: '20:00', dur: 11.50, type: 'Day' },
    { date: '2025-12-31', start: '09:00', end: '21:30', dur: 12.50, type: 'Day' },
    { date: '2026-01-01', start: '12:00', end: '22:45', dur: 10.75, type: 'Day' }, // Note: Invoice is lower than system
    { date: '2026-01-06', start: '09:00', end: '21:30', dur: 12.50, type: 'Day' },
    { date: '2026-01-07', start: '09:15', end: '20:45', dur: 11.50, type: 'Day' },
    { date: '2026-01-08', start: '09:00', end: '21:00', dur: 12.00, type: 'Day' },
    { date: '2026-01-12', start: '20:00', end: '09:00', dur: 13.00, type: 'Night' },
    { date: '2026-01-13', start: '20:00', end: '09:55', dur: 13.92, type: 'Night' },
    { date: '2026-01-14', start: '20:00', end: '09:55', dur: 13.92, type: 'Night' },
];

async function applyFix() {
    console.log('Applying Invoice Fixes for Irina...');

    // Get Irina
    const staffRec = await db.select().from(staff).where(eq(staff.name, 'Irina Mitrovici'));
    if (!staffRec.length) { console.log('Irina not found'); process.exit(1); }
    const irinaId = staffRec[0].id;

    for (const u of updates) {
        // Find shift
        const found = await db.select().from(shifts).where(and(
            eq(shifts.staffId, irinaId),
            eq(shifts.date, u.date)
        ));

        if (found.length === 0) {
            console.log(`⚠️ Shift not found for ${u.date}. Creating new? No, skipping for safety.`);
            continue;
        }

        const shift = found[0];
        console.log(`Update ${u.date}: Sys [${shift.startTime}-${shift.endTime || '?'}] -> Inv [${u.start}-${u.end}]`);

        await db.update(shifts)
            .set({
                startTime: u.start,
                endTime: u.end,
                duration: u.dur, // Only use decimal
                updatedAt: new Date()
            })
            .where(eq(shifts.id, shift.id));
    }
    console.log('Done.');
    process.exit(0);
}

applyFix();
