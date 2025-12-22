import { Request, Response } from 'express';
import { db } from './index.js';
import { sql } from 'drizzle-orm';

export async function migrateAutoAccept(_req: Request, res: Response) {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    console.log('Running auto-accept migration...');

    // Add new columns
    await db.execute(sql`
      ALTER TABLE shifts 
      ADD COLUMN IF NOT EXISTS auto_accepted BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS response_locked BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS week_deadline TIMESTAMP
    `);

    console.log('✅ Auto-accept columns added');

    // Set week deadlines for all existing shifts
    const { setWeekDeadlines } = await import('./jobs/autoAcceptShifts.js');
    await setWeekDeadlines();

    console.log('✅ Week deadlines set for all shifts');

    // Run initial auto-accept and lock jobs
    const { autoAcceptPendingShifts, lockExpiredShifts } = await import('./jobs/autoAcceptShifts.js');
    await autoAcceptPendingShifts();
    await lockExpiredShifts();

    console.log('✅ Initial auto-accept and lock jobs completed');

    res.json({ 
      success: true, 
      message: 'Auto-accept migration completed successfully' 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message 
    });
  }
}
