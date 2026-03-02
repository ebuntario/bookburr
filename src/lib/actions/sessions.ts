"use server";

import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  dateOptions,
  venues,
  activityFeed,
} from "@/lib/db/schema";
import {
  SESSION_STATUS,
  SESSION_MODE,
  SESSION_SHAPE,
  JOINED_VIA,
  ACTIVITY_TYPE,
  EID_2026,
} from "@/lib/constants";
import type { SessionShape } from "@/lib/constants";
import type { Tx } from "./helpers";
import { isValidDateString } from "@/lib/date-utils";

interface CreateSessionInput {
  name: string;
  mode: "personal" | "work";
  sessionShape: SessionShape;
  officeLocation?: string;
  /** Seed dates for need_both / venue_known (optional) */
  seededDates?: string[];
  /** Pre-set date for date_known (required when shape is date_known) */
  confirmedDate?: string;
  /** Date range bounds (optional, defaults to tomorrow → EID_2026) */
  dateRangeStart?: string;
  dateRangeEnd?: string;
  /** For venue_known shape */
  presetVenueName?: string;
  presetVenueAddress?: string;
}

interface CreateSessionResult {
  ok: true;
  sessionId: string;
  inviteCode: string;
}

interface CreateSessionError {
  ok: false;
  error: string;
}

const MAX_DATES = 30;
const MAX_RETRIES = 3;

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const VALID_SHAPES = new Set(Object.values(SESSION_SHAPE));

function validateCreateSessionInput(
  input: CreateSessionInput,
): CreateSessionError | null {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) {
    return { ok: false, error: "Nama bukber harus 2-60 karakter" };
  }
  if (input.mode !== SESSION_MODE.personal && input.mode !== SESSION_MODE.work) {
    return { ok: false, error: "Mode nggak valid" };
  }
  if (!VALID_SHAPES.has(input.sessionShape)) {
    return { ok: false, error: "Session shape nggak valid" };
  }
  if (input.sessionShape === SESSION_SHAPE.date_known) {
    if (!input.confirmedDate || !isValidDateString(input.confirmedDate)) {
      return { ok: false, error: "Tanggal wajib diisi untuk date_known" };
    }
  }
  if (input.sessionShape === SESSION_SHAPE.venue_known) {
    if (!input.presetVenueName?.trim()) {
      return { ok: false, error: "Nama venue wajib diisi" };
    }
  }
  const seededCount = input.seededDates
    ? [...new Set(input.seededDates)].filter(isValidDateString).length
    : 0;
  if (seededCount > MAX_DATES) {
    return { ok: false, error: `Maksimal ${MAX_DATES} tanggal` };
  }
  return null;
}

function normalizeDateRange(input: CreateSessionInput): {
  dateRangeStart: string;
  dateRangeEnd: string;
  seededDates: string[];
  officeLocation: string | undefined;
} {
  return {
    dateRangeStart:
      input.dateRangeStart && isValidDateString(input.dateRangeStart)
        ? input.dateRangeStart
        : getTomorrow(),
    dateRangeEnd:
      input.dateRangeEnd && isValidDateString(input.dateRangeEnd)
        ? input.dateRangeEnd
        : EID_2026,
    seededDates: input.seededDates
      ? [...new Set(input.seededDates)].filter(isValidDateString)
      : [],
    officeLocation:
      input.mode === SESSION_MODE.work && input.officeLocation
        ? input.officeLocation.trim()
        : undefined,
  };
}

async function insertShapeSpecificRecords(
  tx: Tx,
  sessionId: string,
  memberId: string,
  userId: string,
  shape: SessionShape,
  input: CreateSessionInput,
  seededDates: string[],
) {
  if (shape === SESSION_SHAPE.date_known && input.confirmedDate) {
    const dateOptionId = nanoid();
    await tx.insert(dateOptions).values({
      id: dateOptionId,
      sessionId,
      date: input.confirmedDate,
      createdBy: userId,
    });
    await tx
      .update(bukberSessions)
      .set({ confirmedDateOptionId: dateOptionId })
      .where(eq(bukberSessions.id, sessionId));
  }

  if (shape === SESSION_SHAPE.venue_known && input.presetVenueName) {
    await tx.insert(venues).values({
      id: nanoid(),
      sessionId,
      name: input.presetVenueName.trim(),
      location: input.presetVenueAddress
        ? { address: input.presetVenueAddress.trim() }
        : null,
      suggestedByMemberId: memberId,
    });
  }

  if (seededDates.length > 0 && shape !== SESSION_SHAPE.date_known) {
    await tx.insert(dateOptions).values(
      seededDates.map((d) => ({
        id: nanoid(),
        sessionId,
        date: d,
        createdBy: userId,
      })),
    );
  }
}

export async function createSession(
  input: CreateSessionInput,
): Promise<CreateSessionResult | CreateSessionError> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: "unauthorized" };
  }

  const validationError = validateCreateSessionInput(input);
  if (validationError) return validationError;

  const name = input.name.trim();
  const shape = input.sessionShape;
  const { dateRangeStart, dateRangeEnd, seededDates, officeLocation } =
    normalizeDateRange(input);

  // Retry loop for invite code collisions
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const sessionId = nanoid();
    const inviteCode = nanoid(8).toUpperCase();

    try {
      await db.transaction(async (tx) => {
        await tx.insert(bukberSessions).values({
          id: sessionId,
          hostId: userId,
          name,
          mode: input.mode,
          sessionShape: shape,
          officeLocation: officeLocation
            ? { address: officeLocation }
            : undefined,
          inviteCode,
          status: SESSION_STATUS.collecting,
          dateRangeStart,
          dateRangeEnd,
          datesLocked: shape === SESSION_SHAPE.date_known,
        });

        const memberId = nanoid();
        await tx.insert(sessionMembers).values({
          id: memberId,
          sessionId,
          userId,
          joinedVia: JOINED_VIA.web,
        });

        await insertShapeSpecificRecords(
          tx, sessionId, memberId, userId, shape, input, seededDates,
        );

        await tx.insert(activityFeed).values({
          id: nanoid(),
          sessionId,
          memberId,
          type: ACTIVITY_TYPE.session_created,
          metadata: { sessionName: name, mode: input.mode, shape },
        });
      });

      return { ok: true, sessionId, inviteCode };
    } catch (err: unknown) {
      const pgError = err as { code?: string; constraint_name?: string };
      if (
        pgError.code === "23505" &&
        attempt < MAX_RETRIES - 1
      ) {
        continue;
      }
      throw err;
    }
  }

  return { ok: false, error: "Gagal bikin bukber, coba lagi ya" };
}
