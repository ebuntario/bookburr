import { eq, sql, desc, and, asc, ne, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { bukberSessions, sessionMembers, dateOptions, users } from "@/lib/db/schema";

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

/** Lightweight query for OG metadata (no auth needed). */
export async function getSessionOgData(sessionId: string) {
  const [row] = await db
    .select({
      name: bukberSessions.name,
      hostName: users.name,
      memberCount: sql<number>`(SELECT count(*)::int FROM ${sessionMembers} WHERE ${sessionMembers.sessionId} = ${bukberSessions.id})`,
      earliestDate: sql<string | null>`(SELECT min(${dateOptions.date}) FROM ${dateOptions} WHERE ${dateOptions.sessionId} = ${bukberSessions.id})`,
      latestDate: sql<string | null>`(SELECT max(${dateOptions.date}) FROM ${dateOptions} WHERE ${dateOptions.sessionId} = ${bukberSessions.id})`,
    })
    .from(bukberSessions)
    .innerJoin(users, eq(bukberSessions.hostId, users.id))
    .where(eq(bukberSessions.id, sessionId))
    .limit(1);

  return row ?? null;
}

/**
 * Get dates from user's confirmed/completed sessions (for conflict warnings).
 * Returns { date, sessionName }[] — caller builds Record<string, string[]>.
 */
export async function getUserConfirmedDates(
  userId: string,
  excludeSessionId?: string,
): Promise<{ date: string; sessionName: string }[]> {
  try {
    const conditions = [
      eq(sessionMembers.userId, userId),
      inArray(bukberSessions.status, ["confirmed", "completed"]),
      sql`${bukberSessions.confirmedDateOptionId} IS NOT NULL`,
    ];
    if (excludeSessionId) {
      conditions.push(ne(bukberSessions.id, excludeSessionId));
    }

    const rows = await db
      .select({
        date: dateOptions.date,
        sessionName: bukberSessions.name,
      })
      .from(sessionMembers)
      .innerJoin(bukberSessions, eq(sessionMembers.sessionId, bukberSessions.id))
      .innerJoin(
        dateOptions,
        eq(bukberSessions.confirmedDateOptionId, dateOptions.id),
      )
      .where(and(...conditions));

    return rows;
  } catch {
    // Progressive enhancement — return empty on failure
    return [];
  }
}
