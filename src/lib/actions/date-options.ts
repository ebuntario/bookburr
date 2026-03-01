"use server";

import { nanoid } from "nanoid";
import { eq, and, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  dateOptions,
  activityFeed,
} from "@/lib/db/schema";
import { ACTIVITY_TYPE, SESSION_STATUS } from "@/lib/constants";
import { broadcastSessionEvent } from "@/lib/supabase/broadcast";
import {
  requireAuth,
  mapActionError,
  lockSessionForUpdate,
  insertHostActivity,
  type ActionResult,
  type Tx,
} from "./helpers";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATE_OPTIONS_PER_SESSION = 45;

function isValidDateString(d: string): boolean {
  if (!DATE_PATTERN.test(d)) return false;
  const parsed = new Date(d + "T00:00:00");
  return !isNaN(parsed.getTime());
}

function isDateInRange(
  d: string,
  rangeStart: string | null,
  rangeEnd: string | null,
): boolean {
  if (rangeStart && d < rangeStart) return false;
  if (rangeEnd && d > rangeEnd) return false;
  return true;
}

function isNotPast(d: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(d + "T00:00:00");
  return date >= today;
}

async function getDateOptionCount(tx: Tx, sessionId: string): Promise<number> {
  const [{ value }] = await tx
    .select({ value: count() })
    .from(dateOptions)
    .where(eq(dateOptions.sessionId, sessionId));
  return value;
}

async function requireMember(
  tx: Tx,
  sessionId: string,
  userId: string,
): Promise<string> {
  const [member] = await tx
    .select({ id: sessionMembers.id })
    .from(sessionMembers)
    .where(
      and(
        eq(sessionMembers.sessionId, sessionId),
        eq(sessionMembers.userId, userId),
      ),
    )
    .limit(1);
  if (!member) throw new Error("NOT_MEMBER");
  return member.id;
}

// ── suggestDate ──────────────────────────────────────────────────────────────

const SUGGEST_ERRORS: Record<string, string> = {
  UNAUTHORIZED: "unauthorized",
  SESSION_NOT_FOUND: "Session ga ketemu",
  NOT_MEMBER: "Lu belum join session ini",
  SESSION_CLOSED: "Session udah ditutup",
  DATES_LOCKED: "Tanggal udah dikunci sama host",
  INVALID_DATE: "Tanggal nggak valid",
  OUT_OF_RANGE: "Tanggal di luar rentang yang tersedia",
  DATE_PAST: "Nggak bisa pilih tanggal yang udah lewat",
  TOO_MANY_DATES: "Udah terlalu banyak tanggal di session ini",
};

export async function suggestDate(
  sessionId: string,
  date: string,
): Promise<ActionResult> {
  try {
    const userId = await requireAuth();

    if (!isValidDateString(date)) throw new Error("INVALID_DATE");
    if (!isNotPast(date)) throw new Error("DATE_PAST");

    await db.transaction(async (tx) => {
      const memberId = await requireMember(tx, sessionId, userId);

      const [session] = await tx
        .select({
          status: bukberSessions.status,
          datesLocked: bukberSessions.datesLocked,
          dateRangeStart: bukberSessions.dateRangeStart,
          dateRangeEnd: bukberSessions.dateRangeEnd,
        })
        .from(bukberSessions)
        .where(eq(bukberSessions.id, sessionId))
        .limit(1);

      if (!session) throw new Error("SESSION_NOT_FOUND");
      if (
        session.status !== SESSION_STATUS.collecting &&
        session.status !== SESSION_STATUS.discovering
      ) {
        throw new Error("SESSION_CLOSED");
      }
      if (session.datesLocked) throw new Error("DATES_LOCKED");
      if (!isDateInRange(date, session.dateRangeStart, session.dateRangeEnd)) {
        throw new Error("OUT_OF_RANGE");
      }

      const existingCount = await getDateOptionCount(tx, sessionId);
      if (existingCount >= MAX_DATE_OPTIONS_PER_SESSION) {
        throw new Error("TOO_MANY_DATES");
      }

      // ON CONFLICT DO NOTHING — date already exists is fine
      await tx
        .insert(dateOptions)
        .values({
          id: nanoid(),
          sessionId,
          date,
          createdBy: userId,
        })
        .onConflictDoNothing({
          target: [dateOptions.sessionId, dateOptions.date],
        });

      await tx.insert(activityFeed).values({
        id: nanoid(),
        sessionId,
        memberId,
        type: ACTIVITY_TYPE.date_suggested,
        metadata: { date },
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    broadcastSessionEvent({
      event: "date_suggested",
      sessionId,
    }).catch(() => {});
    return { ok: true };
  } catch (err: unknown) {
    return mapActionError(err, SUGGEST_ERRORS);
  }
}

// ── addDateOption (host) ─────────────────────────────────────────────────────

const ADD_DATE_ERRORS: Record<string, string> = {
  UNAUTHORIZED: "unauthorized",
  SESSION_NOT_FOUND: "Session ga ketemu",
  NOT_HOST: "unauthorized",
  SESSION_CLOSED: "Session udah ditutup",
  INVALID_DATE: "Tanggal nggak valid",
  OUT_OF_RANGE: "Tanggal di luar rentang",
  DATE_PAST: "Nggak bisa pilih tanggal yang udah lewat",
  TOO_MANY_DATES: "Udah terlalu banyak tanggal di session ini",
};

export async function addDateOption(
  sessionId: string,
  date: string,
): Promise<ActionResult> {
  try {
    const userId = await requireAuth();

    if (!isValidDateString(date)) throw new Error("INVALID_DATE");
    if (!isNotPast(date)) throw new Error("DATE_PAST");

    await db.transaction(async (tx) => {
      const row = await lockSessionForUpdate(tx, sessionId, userId);
      if (
        row.status !== SESSION_STATUS.collecting &&
        row.status !== SESSION_STATUS.discovering
      ) {
        throw new Error("SESSION_CLOSED");
      }

      // Host ignores dates_locked — they control it
      const [session] = await tx
        .select({
          dateRangeStart: bukberSessions.dateRangeStart,
          dateRangeEnd: bukberSessions.dateRangeEnd,
        })
        .from(bukberSessions)
        .where(eq(bukberSessions.id, sessionId))
        .limit(1);

      if (session && !isDateInRange(date, session.dateRangeStart, session.dateRangeEnd)) {
        throw new Error("OUT_OF_RANGE");
      }

      const existingCount = await getDateOptionCount(tx, sessionId);
      if (existingCount >= MAX_DATE_OPTIONS_PER_SESSION) {
        throw new Error("TOO_MANY_DATES");
      }

      await tx
        .insert(dateOptions)
        .values({
          id: nanoid(),
          sessionId,
          date,
          createdBy: userId,
        })
        .onConflictDoNothing({
          target: [dateOptions.sessionId, dateOptions.date],
        });

      await insertHostActivity(tx, {
        sessionId,
        userId,
        type: ACTIVITY_TYPE.date_suggested,
        metadata: { date },
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    broadcastSessionEvent({
      event: "date_suggested",
      sessionId,
    }).catch(() => {});
    return { ok: true };
  } catch (err: unknown) {
    return mapActionError(err, ADD_DATE_ERRORS);
  }
}

// ── removeDateOption (host) ──────────────────────────────────────────────────

const REMOVE_DATE_ERRORS: Record<string, string> = {
  UNAUTHORIZED: "unauthorized",
  SESSION_NOT_FOUND: "Session ga ketemu",
  NOT_HOST: "unauthorized",
  SESSION_CLOSED: "Session udah ditutup",
  DATE_NOT_FOUND: "Tanggal ga ketemu",
  CANNOT_REMOVE_CONFIRMED: "Ga bisa hapus tanggal yang udah dikonfirmasi",
  CANNOT_REMOVE_LAST: "Ga bisa hapus tanggal terakhir",
};

export async function removeDateOption(
  sessionId: string,
  dateOptionId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireAuth();

    await db.transaction(async (tx) => {
      const row = await lockSessionForUpdate(tx, sessionId, userId);
      if (
        row.status !== SESSION_STATUS.collecting &&
        row.status !== SESSION_STATUS.discovering
      ) {
        throw new Error("SESSION_CLOSED");
      }

      // Can't remove the confirmed date
      const [session] = await tx
        .select({ confirmedDateOptionId: bukberSessions.confirmedDateOptionId })
        .from(bukberSessions)
        .where(eq(bukberSessions.id, sessionId))
        .limit(1);

      if (session?.confirmedDateOptionId === dateOptionId) {
        throw new Error("CANNOT_REMOVE_CONFIRMED");
      }

      // Find the date to get its date string for activity log
      const [dateOpt] = await tx
        .select({ id: dateOptions.id, date: dateOptions.date })
        .from(dateOptions)
        .where(
          and(
            eq(dateOptions.id, dateOptionId),
            eq(dateOptions.sessionId, sessionId),
          ),
        )
        .limit(1);

      if (!dateOpt) throw new Error("DATE_NOT_FOUND");

      // Check we're not removing the last date
      const existingCount = await getDateOptionCount(tx, sessionId);
      if (existingCount <= 1) throw new Error("CANNOT_REMOVE_LAST");

      // Delete cascades to date_votes via FK
      await tx
        .delete(dateOptions)
        .where(eq(dateOptions.id, dateOptionId));

      await insertHostActivity(tx, {
        sessionId,
        userId,
        type: ACTIVITY_TYPE.date_removed,
        metadata: { date: dateOpt.date },
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    broadcastSessionEvent({
      event: "date_removed",
      sessionId,
    }).catch(() => {});
    return { ok: true };
  } catch (err: unknown) {
    return mapActionError(err, REMOVE_DATE_ERRORS);
  }
}

// ── toggleDatesLocked (host) ─────────────────────────────────────────────────

const TOGGLE_LOCK_ERRORS: Record<string, string> = {
  UNAUTHORIZED: "unauthorized",
  SESSION_NOT_FOUND: "Session ga ketemu",
  NOT_HOST: "unauthorized",
  SESSION_CLOSED: "Session udah ditutup",
};

export async function toggleDatesLocked(
  sessionId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireAuth();

    await db.transaction(async (tx) => {
      const row = await lockSessionForUpdate(tx, sessionId, userId);
      if (row.status !== SESSION_STATUS.collecting) {
        throw new Error("SESSION_CLOSED");
      }

      // Read current lock state
      const [session] = await tx
        .select({ datesLocked: bukberSessions.datesLocked })
        .from(bukberSessions)
        .where(eq(bukberSessions.id, sessionId))
        .limit(1);

      const newLocked = !session!.datesLocked;

      await tx
        .update(bukberSessions)
        .set({ datesLocked: newLocked })
        .where(eq(bukberSessions.id, sessionId));

      await insertHostActivity(tx, {
        sessionId,
        userId,
        type: ACTIVITY_TYPE.dates_locked_changed,
        metadata: { locked: newLocked },
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    broadcastSessionEvent({
      event: "dates_locked_changed",
      sessionId,
    }).catch(() => {});
    return { ok: true };
  } catch (err: unknown) {
    return mapActionError(err, TOGGLE_LOCK_ERRORS);
  }
}
