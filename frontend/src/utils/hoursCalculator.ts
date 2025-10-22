// Utility functions for calculating hours and rates

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  date: string;
  shiftType: 'Day' | 'Night';
  duration: number; // hours
  extended?: boolean;
  extensionHours?: number;
  extensionApproved?: boolean;
  extensionReason?: string;
  approvedBy?: string;
}

export interface WeeklyHours {
  standardHours: number; // 0-20 hours
  enhancedHours: number; // 20+ hours
  totalHours: number;
  currentRate: 'standard' | 'enhanced';
  weekStart: string;
  weekEnd: string;
}

/**
 * Get the start and end of the current week (Monday to Sunday)
 */
export const getCurrentWeek = (): { start: Date; end: Date } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
};

/**
 * Calculate weekly hours for a staff member
 */
export const calculateWeeklyHours = (
  staffId: string,
  shifts: Shift[]
): WeeklyHours => {
  const { start, end } = getCurrentWeek();
  
  // Filter shifts for current week
  const weekShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= start && shiftDate <= end && shift.staffId === staffId;
  });
  
  // Calculate total hours including extensions
  let totalHours = 0;
  weekShifts.forEach(shift => {
    totalHours += shift.duration;
    if (shift.extended && shift.extensionHours) {
      totalHours += shift.extensionHours;
    }
  });
  
  // Split into standard (0-20) and enhanced (20+)
  const standardHours = Math.min(totalHours, 20);
  const enhancedHours = Math.max(0, totalHours - 20);
  
  return {
    standardHours,
    enhancedHours,
    totalHours,
    currentRate: totalHours >= 20 ? 'enhanced' : 'standard',
    weekStart: start.toISOString().split('T')[0],
    weekEnd: end.toISOString().split('T')[0]
  };
};

/**
 * Calculate pay for a staff member based on hours and rates
 */
export const calculatePay = (
  weeklyHours: WeeklyHours,
  standardRate: number,
  enhancedRate: number
): { standardPay: number; enhancedPay: number; totalPay: number } => {
  const standardPay = weeklyHours.standardHours * standardRate;
  const enhancedPay = weeklyHours.enhancedHours * (enhancedRate || standardRate);
  
  return {
    standardPay,
    enhancedPay,
    totalPay: standardPay + enhancedPay
  };
};

/**
 * Check if shift extension requires approval
 */
export const requiresOvertimeApproval = (
  extensionHours: number,
  totalWeeklyHours: number
): boolean => {
  // Requires approval if:
  // 1. Extension is more than 3 hours
  // 2. Total weekly hours would exceed 48 hours
  return extensionHours > 3 || totalWeeklyHours > 48;
};

/**
 * Format hours for display
 */
export const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

