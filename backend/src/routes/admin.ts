import express, { Request, Response, Router } from 'express';
import { db } from '../index.js';
import { shifts, staff } from '../schema.js';
import { eq, and } from 'drizzle-orm';

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

export default router;
