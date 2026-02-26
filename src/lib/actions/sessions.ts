"use server";

import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  dateOptions,
  activityFeed,
} from "@/lib/db/schema";
import {
  SESSION_STATUS,
  SESSION_MODE,
  JOINED_VIA,
  ACTIVITY_TYPE,
} from "@/lib/constants";

interface CreateSessionInput {
  name: string;
  mode: "personal" | "work";
  officeLocation?: string;
  candidateDates: string[]; // "YYYY-MM-DD" strings
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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATES = 30;
const MAX_RETRIES = 3;

export async function createSession(
  input: CreateSessionInput,
): Promise<CreateSessionResult | CreateSessionError> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: "unauthorized" };
  }

  // Validate name
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) {
    return { ok: false, error: "Nama bukber harus 2-60 karakter" };
  }

  // Validate mode
  if (input.mode !== SESSION_MODE.personal && input.mode !== SESSION_MODE.work) {
    return { ok: false, error: "Mode nggak valid" };
  }

  // Deduplicate and validate dates
  const uniqueDates = [...new Set(input.candidateDates)];
  if (uniqueDates.length === 0) {
    return { ok: false, error: "Pilih minimal 1 tanggal" };
  }
  if (uniqueDates.length > MAX_DATES) {
    return { ok: false, error: `Maksimal ${MAX_DATES} tanggal` };
  }
  for (const d of uniqueDates) {
    if (!DATE_PATTERN.test(d)) {
      return { ok: false, error: "Format tanggal nggak valid" };
    }
  }

  // Validate office location for work mode
  const officeLocation =
    input.mode === SESSION_MODE.work && input.officeLocation
      ? input.officeLocation.trim()
      : undefined;

  // Retry loop for invite code collisions
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const sessionId = nanoid();
    const inviteCode = nanoid(8).toUpperCase();

    try {
      await db.transaction(async (tx) => {
        // Insert session
        await tx.insert(bukberSessions).values({
          id: sessionId,
          hostId: userId,
          name,
          mode: input.mode,
          officeLocation: officeLocation
            ? { address: officeLocation }
            : undefined,
          inviteCode,
          status: SESSION_STATUS.collecting,
        });

        // Host auto-joins as member
        const memberId = nanoid();
        await tx.insert(sessionMembers).values({
          id: memberId,
          sessionId,
          userId,
          joinedVia: JOINED_VIA.web,
        });

        // Insert date options
        await tx.insert(dateOptions).values(
          uniqueDates.map((d) => ({
            id: nanoid(),
            sessionId,
            date: d,
            createdBy: userId,
          })),
        );

        // Insert activity feed entry
        await tx.insert(activityFeed).values({
          id: nanoid(),
          sessionId,
          memberId,
          type: ACTIVITY_TYPE.session_created,
          metadata: { sessionName: name, mode: input.mode },
        });
      });

      return { ok: true, sessionId, inviteCode };
    } catch (err: unknown) {
      // Retry on invite_code unique constraint violation (PG error 23505)
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
