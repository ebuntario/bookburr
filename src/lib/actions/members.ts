"use server";

import { nanoid } from "nanoid";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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
import { requireAuth, mapActionError, type Tx } from "./helpers";
import type { PreferenceLevel } from "@/lib/constants";

interface JoinSessionInput {
  sessionId: string;
  votes: { dateOptionId: string; preferenceLevel: PreferenceLevel }[];
  /** New dates suggested by member during join (atomic suggest+vote) */
  newDates?: { date: string; preferenceLevel: PreferenceLevel }[];
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
const MAX_NEW_DATES_PER_JOIN = 10;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateJoinInput(
  input: JoinSessionInput,
): string | null {
  if (!input.sessionId) return "Session ID nggak valid";

  for (const vote of input.votes) {
    if (!VALID_PREFERENCE_LEVELS.has(vote.preferenceLevel)) {
      return "Preference level nggak valid";
    }
  }

  if (input.newDates) {
    if (input.newDates.length > MAX_NEW_DATES_PER_JOIN) {
      return `Maksimal ${MAX_NEW_DATES_PER_JOIN} tanggal baru per join`;
    }
    for (const nd of input.newDates) {
      if (!DATE_PATTERN.test(nd.date)) return "Format tanggal nggak valid";
      if (!VALID_PREFERENCE_LEVELS.has(nd.preferenceLevel)) {
        return "Preference level nggak valid";
      }
    }
  }

  if (input.budgetCeiling != null) {
    if (
      !Number.isInteger(input.budgetCeiling) ||
      input.budgetCeiling <= 0 ||
      input.budgetCeiling > MAX_BUDGET
    ) {
      return "Budget nggak valid";
    }
  }

  return null;
}

async function validateDateOptions(
  tx: Tx,
  sessionId: string,
  votes: JoinSessionInput["votes"],
): Promise<void> {
  if (votes.length === 0) return;
  const voteIds = votes.map((v) => v.dateOptionId);
  const uniqueVoteIds = [...new Set(voteIds)];
  const validDates = await tx
    .select({ id: dateOptions.id })
    .from(dateOptions)
    .where(
      and(
        eq(dateOptions.sessionId, sessionId),
        inArray(dateOptions.id, uniqueVoteIds),
      ),
    );
  if (validDates.length !== uniqueVoteIds.length) {
    throw new Error("INVALID_DATE_OPTIONS");
  }
}

function buildLocationObject(input: JoinSessionInput) {
  return input.referenceLocation
    ? { address: input.referenceLocation, lat: input.lat, lng: input.lng }
    : null;
}

const JOIN_ERRORS: Record<string, string> = {
  UNAUTHORIZED: "unauthorized",
  SESSION_NOT_FOUND: "Bukber nggak ditemukan",
  SESSION_CLOSED: "Bukber udah ditutup, nggak bisa join lagi",
  INVALID_DATE_OPTIONS: "Data tanggal nggak valid",
  DATES_LOCKED: "Tanggal udah dikunci, nggak bisa suggest tanggal baru",
};

export async function joinSession(
  input: JoinSessionInput,
): Promise<JoinResult> {
  const validationError = validateJoinInput(input);
  if (validationError) return { ok: false, error: validationError };

  try {
    const userId = await requireAuth();
    const memberId = nanoid();

    await db.transaction(async (tx) => {
      const [bukber] = await tx
        .select({
          status: bukberSessions.status,
          datesLocked: bukberSessions.datesLocked,
          dateRangeStart: bukberSessions.dateRangeStart,
          dateRangeEnd: bukberSessions.dateRangeEnd,
        })
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

      // Validate existing date options
      await validateDateOptions(tx, input.sessionId, input.votes);

      // Handle new date suggestions (atomic suggest+vote)
      const newDateVotes: { dateOptionId: string; preferenceLevel: PreferenceLevel }[] = [];

      if (input.newDates && input.newDates.length > 0) {
        if (bukber.datesLocked) throw new Error("DATES_LOCKED");

        // Insert new date_options (ON CONFLICT DO NOTHING for concurrent members)
        const newDateStrings = input.newDates.map((nd) => nd.date);
        for (const nd of input.newDates) {
          await tx
            .insert(dateOptions)
            .values({
              id: nanoid(),
              sessionId: input.sessionId,
              date: nd.date,
              createdBy: userId,
            })
            .onConflictDoNothing({
              target: [dateOptions.sessionId, dateOptions.date],
            });
        }

        // Fetch IDs for all new dates (covers both newly created and already-existing)
        const insertedDates = await tx
          .select({ id: dateOptions.id, date: dateOptions.date })
          .from(dateOptions)
          .where(
            and(
              eq(dateOptions.sessionId, input.sessionId),
              inArray(dateOptions.date, newDateStrings),
            ),
          );

        // Build preference lookup
        const prefByDate = new Map(
          input.newDates.map((nd) => [nd.date, nd.preferenceLevel]),
        );
        for (const d of insertedDates) {
          const pref = prefByDate.get(d.date);
          if (pref) {
            newDateVotes.push({ dateOptionId: d.id, preferenceLevel: pref });
          }
        }
      }

      // Insert member
      await tx.insert(sessionMembers).values({
        id: memberId,
        sessionId: input.sessionId,
        userId,
        joinedVia: JOINED_VIA.web,
        referenceLocation: buildLocationObject(input),
        budgetCeiling: input.budgetCeiling ?? null,
      });

      // Merge all votes (existing + new date votes)
      const allVotes = [...input.votes, ...newDateVotes];
      if (allVotes.length > 0) {
        await tx.insert(dateVotes).values(
          allVotes.map((v) => ({
            id: nanoid(),
            dateOptionId: v.dateOptionId,
            memberId,
            preferenceLevel: v.preferenceLevel,
          })),
        );
      }

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
    // Handle race condition: UNIQUE violation means already joined
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      return { ok: true, sessionId: input.sessionId };
    }
    return mapActionError(err, JOIN_ERRORS) as JoinResult;
  }
}
