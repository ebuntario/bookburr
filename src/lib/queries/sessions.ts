import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bukberSessions, sessionMembers } from "@/lib/db/schema";

export async function getSessionsByUserId(userId: string) {
  const rows = await db
    .select({
      id: bukberSessions.id,
      name: bukberSessions.name,
      mode: bukberSessions.mode,
      status: bukberSessions.status,
      inviteCode: bukberSessions.inviteCode,
      hostId: bukberSessions.hostId,
      createdAt: bukberSessions.createdAt,
      memberCount: sql<number>`count(${sessionMembers.id})::int`,
    })
    .from(bukberSessions)
    .innerJoin(
      sessionMembers,
      eq(bukberSessions.id, sessionMembers.sessionId),
    )
    .where(
      eq(
        bukberSessions.id,
        sql`ANY(SELECT ${sessionMembers.sessionId} FROM ${sessionMembers} WHERE ${sessionMembers.userId} = ${userId})`,
      ),
    )
    .groupBy(bukberSessions.id)
    .orderBy(desc(bukberSessions.createdAt));

  return rows;
}

export async function getSessionById(sessionId: string) {
  const [row] = await db
    .select()
    .from(bukberSessions)
    .where(eq(bukberSessions.id, sessionId))
    .limit(1);

  return row ?? null;
}
