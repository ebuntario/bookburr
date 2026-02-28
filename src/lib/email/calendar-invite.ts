import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  users,
  venues,
  dateOptions,
} from "@/lib/db/schema";
import { generateIcsContent } from "@/lib/calendar";
import { formatDate } from "@/lib/format-utils";

interface CalendarInviteInput {
  to: string[];
  sessionName: string;
  venueName: string;
  venueAddress?: string;
  date: string; // YYYY-MM-DD
  lat?: number;
  lng?: number;
  icsContent: string;
}

function buildCalendarEmailHtml(input: CalendarInviteInput): string {
  const googleMapsUrl =
    input.lat && input.lng
      ? `https://maps.google.com/?q=${input.lat},${input.lng}`
      : null;

  return `
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Bukber "${input.sessionName}" udah fix!</h2>
      <p><strong>${input.venueName}</strong></p>
      <p>${formatDate(input.date)} — 18:00 WIB</p>
      ${googleMapsUrl ? `<p><a href="${googleMapsUrl}">Buka di Google Maps</a></p>` : ""}
      <p style="color: #888; font-size: 12px; margin-top: 24px;">
        File .ics terlampir — buka untuk save ke calendar kamu.
      </p>
    </div>
  `;
}

async function sendEmailBatch(
  resend: Resend,
  emails: string[],
  from: string,
  subject: string,
  html: string,
  icsBuffer: Buffer,
): Promise<void> {
  const BATCH_SIZE = 10;
  if (emails.length > 20) {
    console.warn(
      `[calendar-invite] Sending to ${emails.length} recipients — may hit Resend rate limits`,
    );
  }

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map((email) =>
        resend.emails.send({
          from,
          to: email,
          subject,
          html,
          attachments: [
            {
              filename: "bukber.ics",
              content: icsBuffer,
              contentType: "text/calendar; method=REQUEST; charset=utf-8",
            },
          ],
        }),
      ),
    );
  }
}

async function sendCalendarInvites(input: CalendarInviteInput): Promise<void> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const from = process.env.AUTH_EMAIL_FROM ?? "BookBurr <noreply@bookburr.com>";
  const html = buildCalendarEmailHtml(input);
  const icsBuffer = Buffer.from(input.icsContent, "utf-8");
  const subject = `Bukber: ${input.sessionName} — ${formatDate(input.date)}`;

  await sendEmailBatch(resend, input.to, from, subject, html, icsBuffer);
}

/**
 * Fetch all data and send calendar invites for a confirmed session.
 * Fire-and-forget — never throws.
 */
export async function sendCalendarInvitesForSession(
  sessionId: string,
  venueId: string,
  dateOptionId: string,
): Promise<void> {
  try {
    const [sessionRow, venueRow, dateRow, memberEmails] = await Promise.all([
      db
        .select({ name: bukberSessions.name })
        .from(bukberSessions)
        .where(eq(bukberSessions.id, sessionId))
        .limit(1)
        .then((r) => r[0]),
      db
        .select({
          name: venues.name,
          location: venues.location,
        })
        .from(venues)
        .where(eq(venues.id, venueId))
        .limit(1)
        .then((r) => r[0]),
      db
        .select({ date: dateOptions.date })
        .from(dateOptions)
        .where(eq(dateOptions.id, dateOptionId))
        .limit(1)
        .then((r) => r[0]),
      db
        .select({ email: users.email })
        .from(sessionMembers)
        .innerJoin(users, eq(sessionMembers.userId, users.id))
        .where(eq(sessionMembers.sessionId, sessionId))
        .then((rows) => rows.map((r) => r.email)),
    ]);

    if (!sessionRow || !venueRow || !dateRow || memberEmails.length === 0)
      return;

    const loc = venueRow.location as {
      lat?: number;
      lng?: number;
      address?: string;
    } | null;

    const icsContent = generateIcsContent({
      sessionId,
      sessionName: sessionRow.name,
      date: dateRow.date,
      venueName: venueRow.name,
      venueAddress: loc?.address,
      lat: loc?.lat,
      lng: loc?.lng,
    });

    await sendCalendarInvites({
      to: memberEmails,
      sessionName: sessionRow.name,
      venueName: venueRow.name,
      venueAddress: loc?.address,
      date: dateRow.date,
      lat: loc?.lat,
      lng: loc?.lng,
      icsContent,
    });
  } catch (err) {
    console.error("[calendar-invite] Failed to send:", err);
  }
}
