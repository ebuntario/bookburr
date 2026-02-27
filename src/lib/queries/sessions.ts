import { eq, sql, desc, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bukberSessions, sessionMembers, dateOptions } from "@/lib/db/schema";

// date "YYYY-MM-DD" strings for display
type DateRange = { earliestDate: string | null; latestDate: string | null };

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
      memberCount: sql<number>`count(distinct ${sessionMembers.id})::int`,
      earliestDate: sql<string | null>`min(${dateOptions.date})`,
      latestDate: sql<string | null>`max(${dateOptions.date})`,
    })
    .from(bukberSessions)
    .innerJoin(
      sessionMembers,
      eq(bukberSessions.id, sessionMembers.sessionId),
    )
    .leftJoin(dateOptions, eq(bukberSessions.id, dateOptions.sessionId))
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

export type { DateRange };

export async function getSessionById(sessionId: string) {
  const [row] = await db
    .select()
    .from(bukberSessions)
    .where(eq(bukberSessions.id, sessionId))
    .limit(1);

  return row ?? null;
}

export async function getSessionWithDates(sessionId: string) {
  const [session] = await db
    .select()
    .from(bukberSessions)
    .where(eq(bukberSessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  const dates = await db
    .select({ id: dateOptions.id, date: dateOptions.date })
    .from(dateOptions)
    .where(eq(dateOptions.sessionId, sessionId))
    .orderBy(asc(dateOptions.date));

  return { session, dateOptions: dates };
}

export async function getMemberByUserAndSession(
  userId: string,
  sessionId: string,
) {
  const [member] = await db
    .select({ id: sessionMembers.id })
    .from(sessionMembers)
    .where(
      and(
        eq(sessionMembers.userId, userId),
        eq(sessionMembers.sessionId, sessionId),
      ),
    )
    .limit(1);

  return member ?? null;
}
