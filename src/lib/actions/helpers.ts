import { nanoid } from "nanoid";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessionMembers, activityFeed } from "@/lib/db/schema";
import type { ActivityType } from "@/lib/constants";
import { logError } from "@/lib/logger";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Transaction type extracted from our db instance
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function requireAuth(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

export function mapActionError(
  err: unknown,
  errorMap: Record<string, string>,
): ActionResult {
  const message = err instanceof Error ? err.message : "unknown";
  if (message in errorMap) {
    return { ok: false, error: errorMap[message] };
  }
  logError("mapActionError", err, { unmapped: message });
  throw err;
}

export async function lockSessionForUpdate(
  tx: Tx,
  sessionId: string,
  userId: string,
): Promise<{ id: string; status: string; host_id: string; session_shape: string }> {
  const lockResult = await tx.execute(
    sql`SELECT id, status, host_id, session_shape FROM bukber_sessions WHERE id = ${sessionId} FOR UPDATE`,
  );
  const locked = lockResult.rows[0];
  if (!locked) throw new Error("SESSION_NOT_FOUND");
  const row = locked as { id: string; status: string; host_id: string; session_shape: string };
  if (row.host_id !== userId) throw new Error("NOT_HOST");
  return row;
}

export async function insertHostActivity(
  tx: Tx,
  params: {
    sessionId: string;
    userId: string;
    type: ActivityType;
    metadata: Record<string, unknown> | null;
  },
): Promise<void> {
  const [hostMember] = await tx
    .select({ id: sessionMembers.id })
    .from(sessionMembers)
    .where(
      and(
        eq(sessionMembers.sessionId, params.sessionId),
        eq(sessionMembers.userId, params.userId),
      ),
    )
    .limit(1);

  await tx.insert(activityFeed).values({
    id: nanoid(),
    sessionId: params.sessionId,
    memberId: hostMember?.id ?? null,
    type: params.type,
    metadata: params.metadata,
  });
}
