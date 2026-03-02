"use server";

import { eq, and, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  venues,
  dateOptions,
  dateVotes,
} from "@/lib/db/schema";
import { SESSION_STATUS, SESSION_STATUS_TRANSITIONS, SHAPE_STATUS_TRANSITIONS, ACTIVITY_TYPE, SESSION_SHAPE } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { broadcastSessionEvent } from "@/lib/supabase/broadcast";
import { sendCalendarInvitesForSession } from "@/lib/email/calendar-invite";
import {
  requireAuth,
  mapActionError,
  lockSessionForUpdate,
  insertHostActivity,
  type ActionResult,
  type Tx,
} from "./helpers";
import { logError } from "@/lib/logger";

async function validateAdvancePrerequisites(
  tx: Tx,
  status: string,
  sessionId: string,
  sessionShape: string,
): Promise<void> {
  if (status === SESSION_STATUS.collecting) {
    const [{ memberCount }] = await tx
      .select({ memberCount: count() })
      .from(sessionMembers)
      .where(eq(sessionMembers.sessionId, sessionId));
    if (memberCount < 2) throw new Error("NEED_MORE_MEMBERS");

    // date_known: skip viable date check (date already confirmed)
    if (sessionShape !== SESSION_SHAPE.date_known) {
      const [{ viableDateCount }] = await tx
        .select({
          viableDateCount: sql<number>`count(distinct ${dateOptions.id})::int`,
        })
        .from(dateOptions)
        .innerJoin(dateVotes, eq(dateVotes.dateOptionId, dateOptions.id))
        .where(
          and(
            eq(dateOptions.sessionId, sessionId),
            sql`${dateVotes.preferenceLevel} IN ('strongly_prefer', 'can_do')`,
          ),
        );
      if (viableDateCount < 1) throw new Error("NEED_VIABLE_DATE");
    }
  }

  // venue_known: skip venue check for discovering (it skips discovering entirely via transition map)
  if (status === SESSION_STATUS.discovering && sessionShape !== SESSION_SHAPE.venue_known) {
    const [{ venueCount }] = await tx
      .select({ venueCount: count() })
      .from(venues)
      .where(eq(venues.sessionId, sessionId));
    if (venueCount < 1) throw new Error("NEED_VENUES");
  }
}

const ADVANCE_ERRORS: Record<string, string> = {
  UNAUTHORIZED: "unauthorized",
  SESSION_NOT_FOUND: "Session ga ketemu",
  NOT_HOST: "unauthorized",
  NO_TRANSITION: "Status udah final",
  NEED_MORE_MEMBERS: "Butuh minimal 2 orang dulu",
  NEED_VENUES: "Tambahin venue dulu ya",
  NEED_VIABLE_DATE: "Belum ada tanggal yang minimal 1 orang bisa",
};

export async function advanceSessionStatus(
  sessionId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireAuth();

    await db.transaction(async (tx) => {
      const row = await lockSessionForUpdate(tx, sessionId, userId);

      // Use per-shape transition map
      const shapeTransitions = SHAPE_STATUS_TRANSITIONS[row.session_shape] ?? SESSION_STATUS_TRANSITIONS;
      const nextStatus = shapeTransitions[row.status];
      if (!nextStatus) throw new Error("NO_TRANSITION");

      await validateAdvancePrerequisites(tx, row.status, sessionId, row.session_shape);

      await tx
        .update(bukberSessions)
        .set({ status: nextStatus })
        .where(eq(bukberSessions.id, sessionId));

      await insertHostActivity(tx, {
        sessionId,
        userId,
        type: ACTIVITY_TYPE.status_changed,
        metadata: { from: row.status, to: nextStatus },
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    broadcastSessionEvent({ event: "status_changed", sessionId }).catch(
      () => {},
    );
    return { ok: true };
  } catch (err: unknown) {
    return mapActionError(err, ADVANCE_ERRORS);
  }
}

async function validateConfirmInputs(
  tx: Tx,
  sessionId: string,
  venueId: string,
  dateOptionId: string,
): Promise<void> {
  const [[venue], [dateOpt]] = await Promise.all([
    tx
      .select({ id: venues.id })
      .from(venues)
      .where(and(eq(venues.id, venueId), eq(venues.sessionId, sessionId)))
      .limit(1),
    tx
      .select({ id: dateOptions.id })
      .from(dateOptions)
      .where(
        and(
          eq(dateOptions.id, dateOptionId),
          eq(dateOptions.sessionId, sessionId),
        ),
      )
      .limit(1),
  ]);
  if (!venue) throw new Error("INVALID_VENUE");
  if (!dateOpt) throw new Error("INVALID_DATE");
}

const CONFIRM_ERRORS: Record<string, string> = {
  UNAUTHORIZED: "unauthorized",
  SESSION_NOT_FOUND: "Session ga ketemu",
  NOT_HOST: "unauthorized",
  WRONG_STATUS: "Status harus voting dulu",
  INVALID_VENUE: "Venue ga valid",
  INVALID_DATE: "Tanggal ga valid",
};

export async function confirmSession(input: {
  sessionId: string;
  venueId: string;
  dateOptionId: string;
}): Promise<ActionResult> {
  const { sessionId, venueId } = input;
  let resolvedDateOptionId = input.dateOptionId;

  try {
    const userId = await requireAuth();

    await db.transaction(async (tx) => {
      const row = await lockSessionForUpdate(tx, sessionId, userId);
      if (row.status !== SESSION_STATUS.voting) throw new Error("WRONG_STATUS");

      // For venue_known: venueId should already be the preset venue
      // For date_known: dateOptionId should already be set at creation
      if (row.session_shape === SESSION_SHAPE.date_known) {
        const [sess] = await tx
          .select({ confirmedDateOptionId: bukberSessions.confirmedDateOptionId })
          .from(bukberSessions)
          .where(eq(bukberSessions.id, sessionId))
          .limit(1);
        if (sess?.confirmedDateOptionId) {
          resolvedDateOptionId = sess.confirmedDateOptionId;
        }
      }

      await validateConfirmInputs(tx, sessionId, venueId, resolvedDateOptionId);

      await tx
        .update(bukberSessions)
        .set({
          status: SESSION_STATUS.confirmed,
          confirmedVenueId: venueId,
          confirmedDateOptionId: resolvedDateOptionId,
        })
        .where(eq(bukberSessions.id, sessionId));

      await insertHostActivity(tx, {
        sessionId,
        userId,
        type: ACTIVITY_TYPE.confirmed,
        metadata: { from: "voting", to: "confirmed", venueId, dateOptionId: resolvedDateOptionId },
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    broadcastSessionEvent({ event: "status_changed", sessionId }).catch(
      () => {},
    );
    sendCalendarInvitesForSession(sessionId, venueId, resolvedDateOptionId).catch(
      (err) => {
        logError("confirmSession:calendarInvite", err, { sessionId });
      },
    );
    return { ok: true };
  } catch (err: unknown) {
    return mapActionError(err, CONFIRM_ERRORS);
  }
}
