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
      const updated = await db.update(shifts)
        .set({ 
          clockedOut: true,
          clockOutTime: now,
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
