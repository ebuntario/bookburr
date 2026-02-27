"use server";

import { nanoid } from "nanoid";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  dateOptions,
  dateVotes,
  activityFeed,
} from "@/lib/db/schema";
import {
  PREFERENCE_LEVEL,
  JOINED_VIA,
  ACTIVITY_TYPE,
  SESSION_STATUS,
} from "@/lib/constants";
import { broadcastSessionEvent } from "@/lib/supabase/broadcast";
import type { PreferenceLevel } from "@/lib/constants";

interface JoinSessionInput {
  sessionId: string;
  votes: { dateOptionId: string; preferenceLevel: PreferenceLevel }[];
  referenceLocation?: string;
  lat?: number;
  lng?: number;
  budgetCeiling?: number;
}

type JoinResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

const VALID_PREFERENCE_LEVELS = new Set(Object.values(PREFERENCE_LEVEL));
const MAX_BUDGET = 10_000_000;

export async function joinSession(
  input: JoinSessionInput,
): Promise<JoinResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "unauthorized" };

  if (!input.sessionId) return { ok: false, error: "Session ID nggak valid" };

  for (const vote of input.votes) {
    if (!VALID_PREFERENCE_LEVELS.has(vote.preferenceLevel)) {
      return { ok: false, error: "Preference level nggak valid" };
    }
  }

  if (input.budgetCeiling != null) {
    if (
      !Number.isInteger(input.budgetCeiling) ||
      input.budgetCeiling <= 0 ||
      input.budgetCeiling > MAX_BUDGET
    ) {
      return { ok: false, error: "Budget nggak valid" };
    }
  }

  try {
    const memberId = nanoid();

    await db.transaction(async (tx) => {
      // Re-check session status inside transaction (prevents TOCTOU)
      const [bukber] = await tx
        .select({ status: bukberSessions.status })
        .from(bukberSessions)
        .where(eq(bukberSessions.id, input.sessionId))
        .limit(1);

      if (!bukber) throw new Error("SESSION_NOT_FOUND");
      if (
        bukber.status !== SESSION_STATUS.collecting &&
        bukber.status !== SESSION_STATUS.discovering
      ) {
        throw new Error("SESSION_CLOSED");
      }

      // Validate all dateOptionIds belong to this session
      if (input.votes.length > 0) {
        const voteIds = input.votes.map((v) => v.dateOptionId);
        const uniqueVoteIds = [...new Set(voteIds)];
        const validDates = await tx
          .select({ id: dateOptions.id })
          .from(dateOptions)
          .where(
            and(
              eq(dateOptions.sessionId, input.sessionId),
              inArray(dateOptions.id, uniqueVoteIds),
            ),
          );
        if (validDates.length !== uniqueVoteIds.length) {
          throw new Error("INVALID_DATE_OPTIONS");
        }
      }

      // Insert member
      const location =
        input.referenceLocation
          ? { address: input.referenceLocation, lat: input.lat, lng: input.lng }
          : null;

      await tx.insert(sessionMembers).values({
        id: memberId,
        sessionId: input.sessionId,
        userId,
        joinedVia: JOINED_VIA.web,
        referenceLocation: location,
        budgetCeiling: input.budgetCeiling ?? null,
      });

      // Bulk insert date votes
      if (input.votes.length > 0) {
        await tx.insert(dateVotes).values(
          input.votes.map((v) => ({
            id: nanoid(),
            dateOptionId: v.dateOptionId,
            memberId,
            preferenceLevel: v.preferenceLevel,
          })),
        );
      }

      // Activity feed
      await tx.insert(activityFeed).values({
        id: nanoid(),
        sessionId: input.sessionId,
        memberId,
        type: ACTIVITY_TYPE.joined,
      });
    });

    revalidatePath(`/sessions/${input.sessionId}`);
    broadcastSessionEvent({ event: "member_joined", sessionId: input.sessionId }).catch(() => {});
    return { ok: true, sessionId: input.sessionId };
  } catch (err: unknown) {
    const pgErr = err as { code?: string };

    // Handle race condition: UNIQUE violation on session_members means already joined
    if (pgErr.code === "23505") {
      return { ok: true, sessionId: input.sessionId };
    }

    const msg = err instanceof Error ? err.message : "";
    if (msg === "SESSION_NOT_FOUND")
      return { ok: false, error: "Bukber nggak ditemukan" };
    if (msg === "SESSION_CLOSED")
      return { ok: false, error: "Bukber udah ditutup, nggak bisa join lagi" };
    if (msg === "INVALID_DATE_OPTIONS")
      return { ok: false, error: "Data tanggal nggak valid" };

    throw err;
  }
}
