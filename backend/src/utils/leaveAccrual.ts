/**
 * Calculate accrued annual leave hours based on employment start date
 * 
 * Rules:
 * - Must work 3 months before qualifying for any leave
 * - Accrues 7 days (56 hours) per quarter
 * - Total annual entitlement: 28 days (224 hours)
 * - Accrual: 18.66 hours per month OR 56 hours per quarter
 */

function getMonthsWorked(start: Date, now: Date): number {
  let months = (now.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += now.getMonth();
  // If the current day of month is less than start day, full month hasn't passed
  if (now.getDate() < start.getDate()) {
    months--;
  }
  return Math.max(0, months);
}

export function calculateAccruedLeave(startDate: string, asOfDate?: Date): number {
  const start = new Date(startDate);
  const now = asOfDate || new Date();

  // Calculate months worked using precise calendar math
  const monthsWorked = getMonthsWorked(start, now);

  // Must work 3 months before qualifying
  if (monthsWorked < 3) {
    return 0;
  }

  // Calculate quarters completed (rounded down)
  const quartersCompleted = Math.floor(monthsWorked / 3);

  // Each quarter = 7 days = 56 hours
  // Maximum 4 quarters = 28 days = 224 hours
  const accruedHours = Math.min(quartersCompleted * 56, 224);

  return accruedHours;
}

export function getNextAccrualDate(startDate: string): Date {
  const start = new Date(startDate);
  const now = new Date();

  // Calculate months since start
  const monthsWorked = getMonthsWorked(start, now);

  // Next accrual is at the next quarter boundary
  const nextQuarterMonth = Math.ceil((monthsWorked + 1) / 3) * 3;

  const nextAccrual = new Date(start);
  nextAccrual.setMonth(start.getMonth() + nextQuarterMonth);

  return nextAccrual;
}

export function getAccrualBreakdown(startDate: string): {
  monthsWorked: number;
  quartersCompleted: number;
  hoursAccrued: number;
  nextAccrualDate: Date;
  nextAccrualHours: number;
} {
  const start = new Date(startDate);
  const now = new Date();

  const monthsWorked = getMonthsWorked(start, now);

  const quartersCompleted = Math.floor(monthsWorked / 3);
  const hoursAccrued = Math.min(quartersCompleted * 56, 224);
  const nextAccrualDate = getNextAccrualDate(startDate);
  const nextAccrualHours = quartersCompleted < 4 ? 56 : 0;

  return {
    monthsWorked,
    quartersCompleted,
    hoursAccrued,
    nextAccrualDate,
    nextAccrualHours
  };
}

