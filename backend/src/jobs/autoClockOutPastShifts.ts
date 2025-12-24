import { db } from '../index.js';
import { shifts } from '../schema.js';
import { and, eq, lt } from 'drizzle-orm';

/**
 * Automatically clock out shifts from past dates that are still showing as clocked in
 * Runs daily at midnight to clean up forgotten clock-outs
 */
export async function autoClockOutPastShifts() {
  try {
    if (!db) {
      console.error('Database not configured');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    console.log(`[Auto Clock-Out] Running for shifts before ${today}...`);

    // Find all shifts from past dates that are clocked in but not clocked out
    const pastShifts = await db.select()
      .from(shifts)
      .where(
        and(
          lt(shifts.date, today),
          eq(shifts.clockedIn, true),
          eq(shifts.clockedOut, false)
        )
      );

    if (pastShifts.length === 0) {
      console.log('[Auto Clock-Out] No past shifts to clock out');
      return;
    }

    console.log(`[Auto Clock-Out] Found ${pastShifts.length} past shifts still clocked in`);

    // Clock out each shift with the end time of their shift day
    for (const shift of pastShifts) {
      // Calculate the scheduled end time
      const shiftDate = shift.date;
      const endTime = shift.endTime;
      
      // Parse end time (format: "HH:MM")
      const [hours, minutes] = endTime.split(':').map(Number);
      
      // Create clock-out timestamp at the scheduled end time
      let clockOutDate = new Date(shiftDate);
      clockOutDate.setHours(hours, minutes, 0, 0);
      
      // If it's a night shift that ends the next day (e.g., 20:00 - 08:00)
      if (shift.type === 'Night' && hours < 12) {
        clockOutDate.setDate(clockOutDate.getDate() + 1);
      }

      await db.update(shifts)
        .set({
          clockedOut: true,
          clockOutTime: clockOutDate,
          updatedAt: new Date()
        })
        .where(eq(shifts.id, shift.id));

      console.log(`[Auto Clock-Out] Clocked out ${shift.staffName} from ${shift.date} at ${clockOutDate.toISOString()}`);
    }

    console.log(`[Auto Clock-Out] Successfully clocked out ${pastShifts.length} past shifts`);
  } catch (error) {
    console.error('[Auto Clock-Out] Error:', error);
  }
}

/**
 * Start the auto clock-out job
 * Runs every day at midnight (00:00)
 */
export function startAutoClockOutJob() {
  // Run immediately on startup
  autoClockOutPastShifts();

  // Run every day at midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    autoClockOutPastShifts();
    // Then run every 24 hours
    setInterval(autoClockOutPastShifts, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);

  console.log('[Auto Clock-Out] Job scheduled to run daily at midnight');
}
