
import { db } from './dist/db.js';
import { shifts } from './dist/schema.js';
import { and, gte, lte } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function exportBackfillData() {
    console.log('📤 Exporting shifts for backfill (Dec 14 - Jan 14)...');

    const startDate = '2025-12-14';
    const endDate = '2026-01-14';

    try {
        const result = await db.select().from(shifts)
            .where(and(
                gte(shifts.date, startDate),
                lte(shifts.date, endDate)
            ));

        console.log(`✅ Found ${result.length} shifts.`);

        if (result.length === 0) {
            console.log('No shifts found. Exiting.');
            process.exit(0);
        }

        // CSV Header
        let csvContent = "Shift ID,Date,Staff Name,Site,Scheduled Start,Scheduled End,ACTUAL START (HH:MM),ACTUAL END (HH:MM)\n";

        for (const shift of result) {
            // Pre-fill with existing if available, or empty
            const existingStart = shift.clockInTime ? new Date(shift.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "";
            const existingEnd = shift.clockOutTime ? new Date(shift.clockOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "";

            csvContent += `${shift.id},${shift.date},"${shift.staffName}","${shift.siteName}",${shift.startTime},${shift.endTime},${existingStart},${existingEnd}\n`;
        }

        const outDir = 'backfill_data';
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }

        const filePath = path.join(outDir, 'shifts_to_update.csv');
        fs.writeFileSync(filePath, csvContent);

        console.log(`✅ CSV exported to: ${filePath}`);
        console.log(`👉 Please open this file, fill in the ACTUAL START and ACTUAL END times (HH:MM), and save.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error exporting backfill data:', error);
        process.exit(1);
    }
}

exportBackfillData();
