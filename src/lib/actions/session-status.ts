"use server";

import { eq, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  venues,
  dateOptions,
} from "@/lib/db/schema";
import { SESSION_STATUS_TRANSITIONS, ACTIVITY_TYPE } from "@/lib/constants";
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

async function validateAdvancePrerequisites(
  tx: Tx,
  status: string,
  sessionId: string,
): Promise<void> {
  if (status === "collecting") {
    const [{ memberCount }] = await tx
      .select({ memberCount: count() })
      .from(sessionMembers)
      .where(eq(sessionMembers.sessionId, sessionId));
    if (memberCount < 2) throw new Error("NEED_MORE_MEMBERS");
  }

  if (status === "discovering") {
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
};

export async function advanceSessionStatus(
  sessionId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireAuth();

    await db.transaction(async (tx) => {
      const row = await lockSessionForUpdate(tx, sessionId, userId);

      const nextStatus = SESSION_STATUS_TRANSITIONS[row.status];
      if (!nextStatus) throw new Error("NO_TRANSITION");

      await validateAdvancePrerequisites(tx, row.status, sessionId);

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
  const { sessionId, venueId, dateOptionId } = input;

  try {
    const userId = await requireAuth();

    await db.transaction(async (tx) => {
      const row = await lockSessionForUpdate(tx, sessionId, userId);
      if (row.status !== "voting") throw new Error("WRONG_STATUS");

      await validateConfirmInputs(tx, sessionId, venueId, dateOptionId);

      await tx
        .update(bukberSessions)
        .set({
          status: "confirmed",
          confirmedVenueId: venueId,
          confirmedDateOptionId: dateOptionId,
        })
        .where(eq(bukberSessions.id, sessionId));

      await insertHostActivity(tx, {
        sessionId,
        userId,
        type: ACTIVITY_TYPE.confirmed,
        metadata: { from: "voting", to: "confirmed", venueId, dateOptionId },
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    broadcastSessionEvent({ event: "status_changed", sessionId }).catch(
      () => {},
    );
    sendCalendarInvitesForSession(sessionId, venueId, dateOptionId).catch(
      (err) => {
        console.error("[confirmSession] calendar invite failed:", err);
      },
    );
    return { ok: true };
  } catch (err: unknown) {
    return mapActionError(err, CONFIRM_ERRORS);
  }
}
