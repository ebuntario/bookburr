/**
 * RFC 5545 compliant .ics calendar file generator.
 * Pure string generation — no external dependencies.
 */

interface IcsInput {
  sessionId: string;
  sessionName: string;
  date: string; // YYYY-MM-DD
  startHour?: number; // default 18 (6pm WIB)
  durationMinutes?: number; // default 120
  venueName?: string;
  venueAddress?: string;
  lat?: number;
  lng?: number;
}

/** Fold lines at 75 octets per RFC 5545 §3.1 */
function foldLine(line: string): string {
  const maxLen = 75;
  if (line.length <= maxLen) return line;
  const parts: string[] = [line.slice(0, maxLen)];
  let pos = maxLen;
  while (pos < line.length) {
    parts.push(" " + line.slice(pos, pos + maxLen - 1));
    pos += maxLen - 1;
  }
  return parts.join("\r\n");
}

function formatIcsDate(dateStr: string, hour: number): string {
  // Format: YYYYMMDDTHHMMSS (local time, will use TZID)
  const d = dateStr.replace(/-/g, "");
  const h = hour.toString().padStart(2, "0");
  return `${d}T${h}0000`;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateIcsContent(input: IcsInput): string {
  const {
    sessionId,
    sessionName,
    date,
    startHour = 18,
    durationMinutes = 120,
    venueName,
    venueAddress,
    lat,
    lng,
  } = input;

  const dtStart = formatIcsDate(date, startHour);
  const endHour = startHour + Math.floor(durationMinutes / 60);
  const endMin = durationMinutes % 60;
  const dtEnd = formatIcsDate(date, endHour).replace(
    /T(\d{2})0000$/,
    `T${endHour.toString().padStart(2, "0")}${endMin.toString().padStart(2, "0")}00`,
  );

  const now = new Date();
  const dtstamp =
    now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const location = [venueName, venueAddress].filter(Boolean).join(", ");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookBurr//Bukber//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    // VTIMEZONE for Asia/Jakarta (WIB, UTC+7, no DST)
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Jakarta",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0700",
    "TZOFFSETTO:+0700",
    "TZNAME:WIB",
    "END:STANDARD",
    "END:VTIMEZONE",
    // VEVENT
    "BEGIN:VEVENT",
    `UID:${sessionId}@bookburr.com`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Asia/Jakarta:${dtStart}`,
    `DTEND;TZID=Asia/Jakarta:${dtEnd}`,
    `SUMMARY:${escapeIcsText(`Bukber: ${sessionName}`)}`,
  ];

  if (location) {
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }
  if (lat != null && lng != null) {
    lines.push(`GEO:${lat};${lng}`);
  }

  // VALARM: 30 min before
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Bukber in 30 minutes!",
    "END:VALARM",
  );

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
