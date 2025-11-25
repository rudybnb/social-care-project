/**
 * Calculate accrued annual leave hours based on employment start date
 * 
 * Rules:
 * - Must work 3 months before qualifying for any leave
 * - Accrues 3.5 days (28 hours) per quarter
 * - Total annual entitlement: 14 days (112 hours)
 * - Accrual: 9.33 hours per month OR 28 hours per quarter
 */

export function calculateAccruedLeave(startDate: string, asOfDate?: Date): number {
  const start = new Date(startDate);
  const now = asOfDate || new Date();
  
  // Calculate months worked
  const monthsWorked = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44) // Average days per month
  );
  
  // Must work 3 months before qualifying
  if (monthsWorked < 3) {
    return 0;
  }
  
  // Calculate quarters completed (rounded down)
  const quartersCompleted = Math.floor(monthsWorked / 3);
  
  // Each quarter = 3.5 days = 28 hours
  // Maximum 4 quarters = 14 days = 112 hours
  const accruedHours = Math.min(quartersCompleted * 28, 112);
  
  return accruedHours;
}

export function getNextAccrualDate(startDate: string): Date {
  const start = new Date(startDate);
  const now = new Date();
  
  // Calculate months since start
  const monthsWorked = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  
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
  
  const monthsWorked = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  
  const quartersCompleted = Math.floor(monthsWorked / 3);
  const hoursAccrued = Math.min(quartersCompleted * 28, 112);
  const nextAccrualDate = getNextAccrualDate(startDate);
  const nextAccrualHours = quartersCompleted < 4 ? 28 : 0;
  
  return {
    monthsWorked,
    quartersCompleted,
    hoursAccrued,
    nextAccrualDate,
    nextAccrualHours
  };
}

