/**
 * Format a date string (YYYY-MM-DD) into Indonesian locale display.
 * Used by step-date-votes, confirm-session-sheet, and WhatsApp card builders.
 */
export function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Shorter date format for compact display. */
export function formatDateShort(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
