"use server";

import { nanoid } from "nanoid";
import { eq, sql, and, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  venues,
  dateOptions,
  activityFeed,
} from "@/lib/db/schema";
import { SESSION_STATUS_TRANSITIONS, ACTIVITY_TYPE } from "@/lib/constants";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function advanceSessionStatus(
  sessionId: string,
): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "unauthorized" };

  try {
    await db.transaction(async (tx) => {
      // Lock the session row to prevent concurrent transitions
      const lockResult = await tx.execute(
        sql`SELECT id, status, host_id FROM bukber_sessions WHERE id = ${sessionId} FOR UPDATE`,
      );
      const locked = lockResult.rows[0];

      if (!locked) throw new Error("session_not_found");
      const row = locked as { id: string; status: string; host_id: string };
      if (row.host_id !== userId) throw new Error("not_host");

      const nextStatus = SESSION_STATUS_TRANSITIONS[row.status];
      if (!nextStatus) throw new Error("no_transition");

      // Validate prerequisites
      if (row.status === SESSION_STATUS_TRANSITIONS.collecting) {
        // collecting → discovering: need ≥2 members (host already counts as 1)
        // Actually check: collecting state, need total ≥2
      }

      if (row.status === "collecting") {
        const [{ memberCount }] = await tx
          .select({ memberCount: count() })
          .from(sessionMembers)
          .where(eq(sessionMembers.sessionId, sessionId));
        if (memberCount < 2)
          throw new Error("need_more_members");
      }

      if (row.status === "discovering") {
        const [{ venueCount }] = await tx
          .select({ venueCount: count() })
          .from(venues)
          .where(eq(venues.sessionId, sessionId));
        if (venueCount < 1)
          throw new Error("need_venues");
      }

      // Update session status
      await tx
        .update(bukberSessions)
        .set({ status: nextStatus })
        .where(eq(bukberSessions.id, sessionId));

      // Write activity feed entry
      const [hostMember] = await tx
        .select({ id: sessionMembers.id })
        .from(sessionMembers)
        .where(
          and(
            eq(sessionMembers.sessionId, sessionId),
            eq(sessionMembers.userId, userId),
          ),
        )
        .limit(1);

      await tx.insert(activityFeed).values({
        id: nanoid(),
        sessionId,
        memberId: hostMember?.id ?? null,
        type: ACTIVITY_TYPE.status_changed,
        metadata: { from: row.status, to: nextStatus },
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    if (message === "session_not_found") return { ok: false, error: "Session ga ketemu" };
    if (message === "not_host") return { ok: false, error: "unauthorized" };
    if (message === "no_transition") return { ok: false, error: "Status udah final" };
    if (message === "need_more_members")
      return { ok: false, error: "Butuh minimal 2 orang dulu" };
    if (message === "need_venues")
      return { ok: false, error: "Tambahin venue dulu ya" };
    throw err;
  }
}

export async function confirmSession(input: {
  sessionId: string;
  venueId: string;
  dateOptionId: string;
}): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "unauthorized" };

  const { sessionId, venueId, dateOptionId } = input;

  try {
    await db.transaction(async (tx) => {
      const lockResult = await tx.execute(
        sql`SELECT id, status, host_id FROM bukber_sessions WHERE id = ${sessionId} FOR UPDATE`,
      );
      const locked = lockResult.rows[0];

      if (!locked) throw new Error("session_not_found");
      const row = locked as { id: string; status: string; host_id: string };
      if (row.host_id !== userId) throw new Error("not_host");
      if (row.status !== "voting") throw new Error("wrong_status");

      // Validate venue and date belong to this session
      const [venue] = await tx
        .select({ id: venues.id })
        .from(venues)
        .where(and(eq(venues.id, venueId), eq(venues.sessionId, sessionId)))
        .limit(1);
      if (!venue) throw new Error("invalid_venue");

      const [dateOpt] = await tx
        .select({ id: dateOptions.id })
        .from(dateOptions)
        .where(
          and(
            eq(dateOptions.id, dateOptionId),
            eq(dateOptions.sessionId, sessionId),
          ),
        )
        .limit(1);
      if (!dateOpt) throw new Error("invalid_date");

      // Update session to confirmed
      await tx
        .update(bukberSessions)
        .set({
          status: "confirmed",
          confirmedVenueId: venueId,
          confirmedDateOptionId: dateOptionId,
        })
        .where(eq(bukberSessions.id, sessionId));

      // Write activity entry
      const [hostMember] = await tx
        .select({ id: sessionMembers.id })
        .from(sessionMembers)
        .where(
          and(
            eq(sessionMembers.sessionId, sessionId),
            eq(sessionMembers.userId, userId),
          ),
        )
        .limit(1);

      await tx.insert(activityFeed).values({
        id: nanoid(),
        sessionId,
        memberId: hostMember?.id ?? null,
        type: ACTIVITY_TYPE.confirmed,
        metadata: { from: "voting", to: "confirmed", venueId, dateOptionId },
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    if (message === "session_not_found") return { ok: false, error: "Session ga ketemu" };
    if (message === "not_host") return { ok: false, error: "unauthorized" };
    if (message === "wrong_status") return { ok: false, error: "Status harus voting dulu" };
    if (message === "invalid_venue") return { ok: false, error: "Venue ga valid" };
    if (message === "invalid_date") return { ok: false, error: "Tanggal ga valid" };
    throw err;
  }
}
