// Helper function to calculate duration between two times
// Handles overnight shifts (e.g., 20:00 to 08:00 = 12 hours)
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  // If end time is earlier than start time, it's an overnight shift
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
  }

  const durationMinutes = endMinutes - startMinutes;
  const durationHours = durationMinutes / 60;

  return Math.round(durationHours * 100) / 100; // Round to 2 decimal places
}


// Helper function to calculate end time from start time and duration
export function calculateEndTime(startTime: string, durationHours: number): string {
  if (!startTime || durationHours === undefined) return '';
  const [startHour, startMin] = startTime.split(':').map(Number);
  const totalMinutes = startHour * 60 + startMin + Math.round(durationHours * 60);
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMin = totalMinutes % 60;
  return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
}
