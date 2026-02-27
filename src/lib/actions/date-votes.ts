"use server";

import { nanoid } from "nanoid";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  dateOptions,
  dateVotes,
  activityFeed,
  users,
} from "@/lib/db/schema";
import { ACTIVITY_TYPE } from "@/lib/constants";
import type { PreferenceLevel } from "@/lib/constants";
import { calculateFlexibilityScore } from "@/lib/algorithms/scoring";
import { revalidatePath } from "next/cache";
import { broadcastSessionEvent } from "@/lib/supabase/broadcast";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateDateVotes(input: {
  sessionId: string;
  votes: { dateOptionId: string; preferenceLevel: PreferenceLevel }[];
}): Promise<ActionResult> {
  const authSession = await auth();
  const userId = authSession?.user?.id;
  if (!userId) return { ok: false, error: "unauthorized" };

  const { sessionId, votes } = input;

  try {
    await db.transaction(async (tx) => {
      // Validate session + status
      const [session] = await tx
        .select({ id: bukberSessions.id, status: bukberSessions.status })
        .from(bukberSessions)
        .where(eq(bukberSessions.id, sessionId))
        .limit(1);

      if (!session) throw new Error("session_not_found");
      if (session.status !== "collecting" && session.status !== "discovering") {
        throw new Error("votes_locked");
      }

      // Get member + user info in one query
      const [memberWithUser] = await tx
        .select({
          memberId: sessionMembers.id,
          referenceLocation: sessionMembers.referenceLocation,
          maritalStatus: users.maritalStatus,
        })
        .from(sessionMembers)
        .innerJoin(users, eq(sessionMembers.userId, users.id))
        .where(
          and(
            eq(sessionMembers.sessionId, sessionId),
            eq(sessionMembers.userId, userId),
          ),
        )
        .limit(1);

      if (!memberWithUser) throw new Error("not_member");

      // Get all date IDs for this session (to handle deletions)
      const allDates = await tx
        .select({ id: dateOptions.id })
        .from(dateOptions)
        .where(eq(dateOptions.sessionId, sessionId));

      const allDateIds = allDates.map((d) => d.id);
      const submittedDateIds = votes.map((v) => v.dateOptionId);

      // Validate all submitted dateOptionIds belong to this session
      const invalid = submittedDateIds.filter((id) => !allDateIds.includes(id));
      if (invalid.length > 0) throw new Error("invalid_dates");

      // Upsert submitted votes
      for (const v of votes) {
        await tx
          .insert(dateVotes)
          .values({
            id: nanoid(),
            dateOptionId: v.dateOptionId,
            memberId: memberWithUser.memberId,
            preferenceLevel: v.preferenceLevel,
          })
          .onConflictDoUpdate({
            target: [dateVotes.dateOptionId, dateVotes.memberId],
            set: { preferenceLevel: v.preferenceLevel },
          });
      }

      // Delete votes for dates not in the new list
      const toDelete = allDateIds.filter((id) => !submittedDateIds.includes(id));
      if (toDelete.length > 0) {
        await tx.delete(dateVotes).where(
          and(
            eq(dateVotes.memberId, memberWithUser.memberId),
            inArray(dateVotes.dateOptionId, toDelete),
          ),
        );
      }

      // Recalculate flexibility_score for this member
      const availableDates = votes.filter(
        (v) =>
          v.preferenceLevel === "strongly_prefer" ||
          v.preferenceLevel === "can_do",
      ).length;

      const newFlexScore = calculateFlexibilityScore({
        maritalStatus: memberWithUser.maritalStatus,
        hasLocation: memberWithUser.referenceLocation != null,
        totalDates: allDateIds.length,
        availableDates,
      });

      await tx
        .update(sessionMembers)
        .set({ flexibilityScore: newFlexScore })
        .where(eq(sessionMembers.id, memberWithUser.memberId));

      // Write activity feed entry
      await tx.insert(activityFeed).values({
        id: nanoid(),
        sessionId,
        memberId: memberWithUser.memberId,
        type: ACTIVITY_TYPE.voted,
        metadata: null,
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    // Broadcast non-blocking
    broadcastSessionEvent({ event: "votes_updated", sessionId }).catch(() => {});
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    if (message === "session_not_found")
      return { ok: false, error: "Session ga ketemu" };
    if (message === "votes_locked")
      return { ok: false, error: "Votes udah dikunci, ga bisa edit lagi" };
    if (message === "not_member")
      return { ok: false, error: "Lu belum join session ini" };
    if (message === "invalid_dates")
      return { ok: false, error: "Tanggal ga valid" };
    throw err;
  }
}
