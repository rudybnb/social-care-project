export const UNPUBLISHED_SHIFT_MESSAGE = 'This shift has not been published yet.';

export function isShiftPublished(shift: { published?: boolean | null }): boolean {
  return shift.published === true;
}

export function getShiftPublicationError(shift: { published?: boolean | null }): string | null {
  return isShiftPublished(shift) ? null : UNPUBLISHED_SHIFT_MESSAGE;
}

export function getUniqueShiftIds(shiftIds: string[]): string[] {
  return [...new Set(shiftIds)];
}
