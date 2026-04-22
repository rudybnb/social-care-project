import { Request, Response } from 'express';
import { db } from './index.js';
import { shifts } from './schema.js';
import { eq } from 'drizzle-orm';

export async function manualClockOut(req: Request, res: Response) {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { shiftIds } = req.body;
    
    if (!shiftIds || !Array.isArray(shiftIds)) {
      return res.status(400).json({ error: 'shiftIds array required' });
    }

    const results = [];
    const now = new Date();

    for (const shiftId of shiftIds) {
      const shiftResult = await db.select().from(shifts).where(eq(shifts.id, shiftId));
      if (shiftResult.length === 0) continue;
      const shift = shiftResult[0];

      let actualDuration = shift.duration || 0;
      if (shift.clockInTime) {
        const clockInDate = new Date(shift.clockInTime);
        const diffMs = now.getTime() - clockInDate.getTime();
        actualDuration = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }
      const actualEndTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const updated = await db.update(shifts)
        .set({ 
          clockedOut: true,
          clockOutTime: now,
          endTime: actualEndTime,
          duration: actualDuration,
          updatedAt: now
        })
        .where(eq(shifts.id, shiftId))
        .returning();
      
      results.push(updated[0]);
    }

    res.json({ 
      success: true, 
      message: `Clocked out ${results.length} staff members`,
      shifts: results
    });
  } catch (error: any) {
    console.error('Manual clock-out error:', error);
    res.status(500).json({ 
      error: 'Clock-out failed', 
      details: error.message 
    });
  }
}
