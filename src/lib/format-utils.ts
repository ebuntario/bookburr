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

/** Long format without year (weekday + day + month). */
export function formatDateNoYear(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
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

/** Build a Google Maps search URL from lat/lng coordinates. */
export function buildGoogleMapsUrl(
  location: { lat?: number; lng?: number } | null | undefined,
): string | undefined {
  if (!location?.lat || !location?.lng) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
}
