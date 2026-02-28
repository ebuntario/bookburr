"use server";

import { nanoid } from "nanoid";
import { eq, and, inArray, sql } from "drizzle-orm";
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
import { requireAuth, mapActionError, type ActionResult, type Tx } from "./helpers";

interface MemberWithUser {
  memberId: string;
  referenceLocation: unknown;
  maritalStatus: string | null;
}

async function recalcFlexibilityScore(
  tx: Tx,
  member: MemberWithUser,
  votes: { preferenceLevel: PreferenceLevel }[],
  totalDates: number,
): Promise<void> {
  const availableDates = votes.filter(
    (v) => v.preferenceLevel === "strongly_prefer" || v.preferenceLevel === "can_do",
  ).length;

  const newFlexScore = calculateFlexibilityScore({
    maritalStatus: member.maritalStatus,
    hasLocation: member.referenceLocation != null,
    totalDates,
    availableDates,
  });

  await tx
    .update(sessionMembers)
    .set({ flexibilityScore: newFlexScore })
    .where(eq(sessionMembers.id, member.memberId));
}

const UPDATE_VOTES_ERRORS: Record<string, string> = {
  UNAUTHORIZED: "unauthorized",
  SESSION_NOT_FOUND: "Session ga ketemu",
  VOTES_LOCKED: "Votes udah dikunci, ga bisa edit lagi",
  NOT_MEMBER: "Lu belum join session ini",
  INVALID_DATES: "Tanggal ga valid",
};

async function validateVotableSession(
  tx: Tx,
  sessionId: string,
): Promise<void> {
  const [session] = await tx
    .select({ id: bukberSessions.id, status: bukberSessions.status })
    .from(bukberSessions)
    .where(eq(bukberSessions.id, sessionId))
    .limit(1);

  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.status !== "collecting" && session.status !== "discovering") {
    throw new Error("VOTES_LOCKED");
  }
}

async function findMemberWithUser(
  tx: Tx,
  sessionId: string,
  userId: string,
): Promise<MemberWithUser> {
  const [member] = await tx
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

  if (!member) throw new Error("NOT_MEMBER");
  return member;
}

async function applyVoteDiff(
  tx: Tx,
  memberId: string,
  allDateIds: string[],
  votes: { dateOptionId: string; preferenceLevel: PreferenceLevel }[],
): Promise<void> {
  const submittedDateIds = votes.map((v) => v.dateOptionId);

  const invalid = submittedDateIds.filter((id) => !allDateIds.includes(id));
  if (invalid.length > 0) throw new Error("INVALID_DATES");

  if (votes.length > 0) {
    await tx
      .insert(dateVotes)
      .values(
        votes.map((v) => ({
          id: nanoid(),
          dateOptionId: v.dateOptionId,
          memberId,
          preferenceLevel: v.preferenceLevel,
        })),
      )
      .onConflictDoUpdate({
        target: [dateVotes.dateOptionId, dateVotes.memberId],
        set: { preferenceLevel: sql`excluded.preference_level` },
      });
  }

  const toDelete = allDateIds.filter((id) => !submittedDateIds.includes(id));
  if (toDelete.length > 0) {
    await tx.delete(dateVotes).where(
      and(
        eq(dateVotes.memberId, memberId),
        inArray(dateVotes.dateOptionId, toDelete),
      ),
    );
  }
}

export async function updateDateVotes(input: {
  sessionId: string;
  votes: { dateOptionId: string; preferenceLevel: PreferenceLevel }[];
}): Promise<ActionResult> {
  const { sessionId, votes } = input;

  try {
    const userId = await requireAuth();

    await db.transaction(async (tx) => {
      await validateVotableSession(tx, sessionId);
      const member = await findMemberWithUser(tx, sessionId, userId);

      const allDates = await tx
        .select({ id: dateOptions.id })
        .from(dateOptions)
        .where(eq(dateOptions.sessionId, sessionId));
      const allDateIds = allDates.map((d) => d.id);

      await applyVoteDiff(tx, member.memberId, allDateIds, votes);
      await recalcFlexibilityScore(tx, member, votes, allDateIds.length);

      await tx.insert(activityFeed).values({
        id: nanoid(),
        sessionId,
        memberId: member.memberId,
        type: ACTIVITY_TYPE.voted,
        metadata: null,
      });
    });

    revalidatePath(`/sessions/${sessionId}`);
    broadcastSessionEvent({ event: "votes_updated", sessionId }).catch(() => {});
    return { ok: true };
  } catch (err: unknown) {
    return mapActionError(err, UPDATE_VOTES_ERRORS);
  }
}
