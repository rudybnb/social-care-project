import { Request, Response } from 'express';
import { staff, shifts } from './schema.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, like } from 'drizzle-orm';

export async function fixShiftStaffIds(req: Request, res: Response) {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const pool = new Pool({ connectionString: DATABASE_URL });
    const db = drizzle(pool);

    // Get all staff from database
    const allStaff = await db.select().from(staff);
    
    // Get all shifts
    const allShifts = await db.select().from(shifts);
    
    const updates = [];
    
    for (const shift of allShifts) {
      // Find matching staff by name (case-insensitive)
      const matchingStaff = allStaff.find(s => 
        s.name.toLowerCase() === shift.staffName.toLowerCase()
      );
      
      if (matchingStaff && matchingStaff.id !== shift.staffId) {
        // Update shift with correct staff ID
        await db.update(shifts)
          .set({ staffId: matchingStaff.id })
          .where(eq(shifts.id, shift.id));
        
        updates.push({
          shiftId: shift.id,
          staffName: shift.staffName,
          oldStaffId: shift.staffId,
          newStaffId: matchingStaff.id,
          date: shift.date,
          type: shift.type
        });
        
        console.log(`✅ Updated shift ${shift.id}: ${shift.staffName} (${shift.staffId} → ${matchingStaff.id})`);
      }
    }

    await pool.end();

    res.json({
      success: true,
      message: `Fixed ${updates.length} shifts`,
      updates: updates
    });

  } catch (error: any) {
    console.error('Fix shifts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix shifts',
      details: error.message
    });
  }
}

