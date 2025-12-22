import { db } from '../index.js';
import { shifts } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Calculate the Saturday midnight deadline for a given date
 * Week runs from Sunday to Saturday
 * Deadline is Saturday 11:59 PM → Sunday 12:00 AM
 */
export function getWeekDeadline(shiftDate: Date): Date {
  const date = new Date(shiftDate);
  
  // Get the day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = date.getDay();
  
  // Calculate days until next Sunday (start of week)
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  // Get the Sunday that starts the week this shift belongs to
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() + daysUntilSunday);
  weekStart.setHours(0, 0, 0, 0);
  
  // The deadline is the Saturday before (which is actually the same day at midnight)
  // So the deadline is Sunday 00:00:00
  return weekStart;
}

/**
 * Auto-accept pending shifts that are past their deadline
 * Runs periodically to check and update shifts
 */
export async function autoAcceptPendingShifts() {
  if (!db) {
    console.error('Database not configured');
    return;
  }

  try {
    const now = new Date();
    console.log(`[Auto-Accept] Running at ${now.toISOString()}`);

    // Find all pending shifts that are past their deadline
    const pendingShifts = await db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.staffStatus, 'pending'),
          sql`${shifts.weekDeadline} IS NOT NULL`,
          sql`${shifts.weekDeadline} < ${now.toISOString()}`
        )
      );

    if (pendingShifts.length === 0) {
      console.log('[Auto-Accept] No pending shifts past deadline');
      return;
    }

    console.log(`[Auto-Accept] Found ${pendingShifts.length} shifts to auto-accept`);

    // Auto-accept each shift
    for (const shift of pendingShifts) {
      await db
        .update(shifts)
        .set({
          staffStatus: 'accepted',
          autoAccepted: true,
          responseLocked: true,
          updatedAt: now
        })
        .where(eq(shifts.id, shift.id));

      console.log(`[Auto-Accept] Auto-accepted shift ${shift.id} for ${shift.staffName} on ${shift.date}`);
    }

    console.log(`[Auto-Accept] Successfully auto-accepted ${pendingShifts.length} shifts`);
  } catch (error) {
    console.error('[Auto-Accept] Error:', error);
  }
}

/**
 * Lock responses for all shifts past their deadline
 * This prevents staff from changing accepted/declined status without admin approval
 */
export async function lockExpiredShifts() {
  if (!db) {
    console.error('Database not configured');
    return;
  }

  try {
    const now = new Date();
    console.log(`[Lock Shifts] Running at ${now.toISOString()}`);

    // Lock all shifts past their deadline that aren't already locked
    const result = await db
      .update(shifts)
      .set({
        responseLocked: true,
        updatedAt: now
      })
      .where(
        and(
          eq(shifts.responseLocked, false),
          sql`${shifts.weekDeadline} IS NOT NULL`,
          sql`${shifts.weekDeadline} < ${now.toISOString()}`
        )
      )
      .returning({ id: shifts.id });

    console.log(`[Lock Shifts] Locked ${result.length} shifts`);
  } catch (error) {
    console.error('[Lock Shifts] Error:', error);
  }
}

/**
 * Set week deadlines for all shifts that don't have one
 * This should be run once to initialize existing shifts
 */
export async function setWeekDeadlines() {
  if (!db) {
    console.error('Database not configured');
    return;
  }

  try {
    console.log('[Set Deadlines] Setting week deadlines for all shifts...');

    // Get all shifts without a deadline
    const shiftsWithoutDeadline = await db
      .select()
      .from(shifts)
      .where(sql`${shifts.weekDeadline} IS NULL`);

    console.log(`[Set Deadlines] Found ${shiftsWithoutDeadline.length} shifts without deadlines`);

    for (const shift of shiftsWithoutDeadline) {
      const shiftDate = new Date(shift.date);
      const deadline = getWeekDeadline(shiftDate);

      await db
        .update(shifts)
        .set({
          weekDeadline: deadline,
          updatedAt: new Date()
        })
        .where(eq(shifts.id, shift.id));
    }

    console.log(`[Set Deadlines] Set deadlines for ${shiftsWithoutDeadline.length} shifts`);
  } catch (error) {
    console.error('[Set Deadlines] Error:', error);
  }
}
