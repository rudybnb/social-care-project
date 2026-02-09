import express, { Request, Response, Router } from 'express';
import { db } from '../index.js';
import { shifts, staff } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { sendSystemAlert } from '../services/telegramService.js';

const router: Router = express.Router();

// Manual Clock-In/Out for a single shift
router.post('/manual-clock', async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ error: 'Database not configured' });

        const { shiftId, clockInTime, clockOutTime, notes } = req.body;

        if (!shiftId || !clockInTime || !clockOutTime) {
            return res.status(400).json({ error: 'ShiftID, ClockInTime, and ClockOutTime are required' });
        }

        // Calculate duration based on provided times
        const start = new Date(clockInTime);
        const end = new Date(clockOutTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const durationMs = end.getTime() - start.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);

        // Update the shift
        const updated = await db.update(shifts)
            .set({
                clockedIn: true,
                clockInTime: start,
                clockedOut: true,
                clockOutTime: end,
                duration: parseFloat(durationHours.toFixed(2)),
                notes: notes ? notes : undefined, // Only update if provided? Or append? Let's overwrite/set for now.
                updatedAt: new Date()
            })
            .where(eq(shifts.id, shiftId))
            .returning();

        if (updated.length === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        console.log(`✅ Manual clock update for shift ${shiftId}: ${durationHours.toFixed(2)} hours`);
        res.json({ success: true, shift: updated[0] });

    } catch (error: any) {
        console.error('Error in manual-clock:', error);
        res.status(500).json({ error: 'Failed to update shift', details: error.message });
    }
});

// Bulk Backfill from CSV Data
router.post('/backfill-csv', async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ error: 'Database not configured' });

        const { csvData } = req.body; // Expecting raw CSV string

        if (!csvData) {
            return res.status(400).json({ error: 'No CSV data provided' });
        }

        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',').map((h: string) => h.trim());

        // Expected headers: Date,Staff Name,Start Time (HH:MM),End Time (HH:MM)
        // We'll try to be flexible but basic validation is needed.

        const results = {
            processed: 0,
            updated: 0,
            errors: [] as string[]
        };

        console.log(`Processing backfill CSV with ${lines.length - 1} rows...`);

        // Get all staff to match names to IDs (optimisation: cache this map)
        const allStaff = await db.select().from(staff);
        const staffMap = new Map(allStaff.map(s => [s.name.toLowerCase(), s.id]));

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            results.processed++;

            // Simple split by comma (doesn't handle quoted commas well, but template is simple)
            const parts = line.split(',');
            const dateStr = parts[0]?.trim();
            const staffName = parts[1]?.trim();
            const startTimeStr = parts[2]?.trim();
            const endTimeStr = parts[3]?.trim();

            if (!dateStr || !staffName || !startTimeStr || !endTimeStr) {
                results.errors.push(`Row ${i}: Missing fields`);
                continue;
            }

            const staffId = staffMap.get(staffName.toLowerCase());
            if (!staffId) {
                results.errors.push(`Row ${i}: Staff '${staffName}' not found`);
                continue;
            }

            // Find the shift(s) for this staff on this date
            const matchingShifts = await db.select().from(shifts).where(and(
                eq(shifts.staffId, staffId),
                eq(shifts.date, dateStr)
            ));

            if (matchingShifts.length === 0) {
                results.errors.push(`Row ${i}: No shift found for ${staffName} on ${dateStr}`);
                continue;
            }

            // If multiple shifts, which one? 
            // For now, assume single shift per day or update the first/all?
            // "Smart Import" usually implies matching loosely.
            // Let's take the first one found that isn't completely locked?
            // Or just update the first one.
            const targetShift = matchingShifts[0];

            // Construct full Date objects
            // Date string might be YYYY-MM-DD. Time is HH:MM.
            const clockIn = new Date(`${dateStr}T${startTimeStr}:00`);
            const clockOut = new Date(`${dateStr}T${endTimeStr}:00`);

            // Handle overnight shifts? If End < Start, it might be next day.
            if (clockOut < clockIn) {
                clockOut.setDate(clockOut.getDate() + 1);
            }

            const durationMs = clockOut.getTime() - clockIn.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);

            await db.update(shifts)
                .set({
                    clockedIn: true,
                    clockInTime: clockIn,
                    clockedOut: true,
                    clockOutTime: clockOut,
                    duration: parseFloat(durationHours.toFixed(2)),
                    notes: (targetShift.notes || '') + ' [CSV Backfill]',
                    updatedAt: new Date()
                })
                .where(eq(shifts.id, targetShift.id));

            results.updated++;
        }

        console.log(`Backfill complete. Updated ${results.updated}/${results.processed} rows.`);
        res.json({ success: true, results });

    } catch (error: any) {
        console.error('Error in backfill-csv:', error);
        res.status(500).json({ error: 'Failed to process CSV', details: error.message });
    }
});

// Bulk Accept Shifts (Temporary Admin Tool) - GET for easy browser trigger
router.get('/bulk-accept-now', async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ error: 'Database not configured' });

        // Hardcoded logic for the specific user request
        const startDate = '2026-02-02';
        const endDate = '2026-02-08';

        console.log(` Bulk accepting shifts via GET: ${startDate} to ${endDate}, Erith/Thamesmead, !Singita`);

        const updateResult = await db.update(shifts)
            .set({ staffStatus: 'accepted' })
            .where(and(
                sql`${shifts.date} >= ${startDate}`,
                sql`${shifts.date} <= ${endDate}`,
                sql`(${shifts.siteName} ILIKE '%Erith%' OR ${shifts.siteName} ILIKE '%Thamesmead%')`,
                sql`${shifts.staffName} NOT ILIKE '%Singita%'`
            ))
            .returning();

        console.log(`✅ Bulk Accepted ${updateResult.length} shifts.`);
        res.json({
            success: true,
            message: `Processed Bulk Accept: Erith/Thamesmead (No Singita) for ${startDate} to ${endDate}`,
            count: updateResult.length,
            updated: updateResult.map(s => `${s.date}: ${s.staffName} @ ${s.siteName}`)
        });

    } catch (error: any) {
        console.error('Error in bulk-accept:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Exported function for automation
export async function removeDuplicateShifts() {
    if (!db) return { deletedCount: 0, details: [] };

    const allShifts = await db.select().from(shifts);
    const staffMap = new Map<string, any[]>();

    // Group by Staff|Date|StartTime
    for (const shift of allShifts) {
        const sig = `${shift.staffId}|${shift.date}|${shift.startTime}`;
        if (!staffMap.has(sig)) {
            staffMap.set(sig, []);
        }
        staffMap.get(sig)?.push(shift);
    }

    let deletedCount = 0;
    const deletedIds: string[] = [];
    const details: string[] = [];

    console.log(`Analyzing ${allShifts.length} shifts for duplicates...`);

    for (const [sig, group] of staffMap.entries()) {
        if (group.length > 1) {
            // Sort by createdAt DESC (try to keep newest)
            group.sort((a, b) => {
                const tA = new Date(a.createdAt || 0).getTime();
                const tB = new Date(b.createdAt || 0).getTime();
                return tB - tA; // Descending
            });

            // Keep group[0], delete rest
            const toDelete = group.slice(1);

            console.log(`Found duplicate group for ${sig} with ${group.length} shifts. Removing ${toDelete.length} older entries.`);

            for (const d of toDelete) {
                await db.delete(shifts).where(eq(shifts.id, d.id));
                deletedCount++;
                deletedIds.push(d.id);
                details.push(`${d.staffName} ${d.date} ${d.startTime} (ID: ${d.id}, Created: ${d.createdAt})`);
            }
        }
    }

    if (deletedCount > 0) {
        const alertMessage = `🧹 <b>Duplicate Shifts Removed</b>\n\n` +
            `Found and removed ${deletedCount} duplicate shift(s).\n\n` +
            `<b>Details:</b>\n` +
            details.slice(0, 5).join('\n') +
            (details.length > 5 ? `\n...and ${details.length - 5} more` : '');

        // Send to Telegram asynchronously
        sendSystemAlert(alertMessage).catch(err => console.error('Failed to send Telegram alert:', err));
    }

    return { deletedCount, details };
}

// Remove Duplicate Shifts (Same Staff, Date, StartTime) - Keep Newest
router.get('/remove-duplicates', async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ error: 'Database not configured' });

        const { deletedCount, details } = await removeDuplicateShifts();

        res.json({
            success: true,
            message: `Removed ${deletedCount} duplicate shifts.`,
            deletedCount,
            details
        });

    } catch (error: any) {
        console.error('Error removing duplicates:', error);
        res.status(500).json({ error: 'Failed to remove duplicates', details: error.message });
    }
});

export default router;
