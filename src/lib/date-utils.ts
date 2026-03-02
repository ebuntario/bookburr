/** Shared date validation utilities used by session and date-option actions. */

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(d: string): boolean {
  if (!DATE_PATTERN.test(d)) return false;
  const parsed = new Date(d + "T00:00:00");
  return !isNaN(parsed.getTime());
}
