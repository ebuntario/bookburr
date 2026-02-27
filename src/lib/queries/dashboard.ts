import { eq, desc, asc, sql, and, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  dateOptions,
  dateVotes,
  activityFeed,
  users,
  venues,
} from "@/lib/db/schema";

export async function getSessionWithMembers(sessionId: string) {
  const [session] = await db
    .select()
    .from(bukberSessions)
    .where(eq(bukberSessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  const members = await db
    .select({
      id: sessionMembers.id,
      userId: sessionMembers.userId,
      name: users.name,
      email: users.email,
      image: users.image,
      joinedVia: sessionMembers.joinedVia,
      createdAt: sessionMembers.createdAt,
    })
    .from(sessionMembers)
    .innerJoin(users, eq(sessionMembers.userId, users.id))
    .where(eq(sessionMembers.sessionId, sessionId))
    .orderBy(asc(sessionMembers.createdAt));

  return { session, members };
}

export async function getDatesWithVoteCounts(sessionId: string) {
  const dates = await db
    .select({
      id: dateOptions.id,
      date: dateOptions.date,
      stronglyPrefer: sql<number>`count(${dateVotes.id}) filter (where ${dateVotes.preferenceLevel} = 'strongly_prefer')::int`,
      canDo: sql<number>`count(${dateVotes.id}) filter (where ${dateVotes.preferenceLevel} = 'can_do')::int`,
      unavailable: sql<number>`count(${dateVotes.id}) filter (where ${dateVotes.preferenceLevel} = 'unavailable')::int`,
    })
    .from(dateOptions)
    .leftJoin(dateVotes, eq(dateVotes.dateOptionId, dateOptions.id))
    .where(eq(dateOptions.sessionId, sessionId))
    .groupBy(dateOptions.id, dateOptions.date)
    .orderBy(asc(dateOptions.date));

  const [{ votedMemberCount }] = await db
    .select({
      votedMemberCount: sql<number>`count(distinct ${dateVotes.memberId})::int`,
    })
    .from(dateVotes)
    .innerJoin(dateOptions, eq(dateVotes.dateOptionId, dateOptions.id))
    .where(eq(dateOptions.sessionId, sessionId));

  return { dates, votedMemberCount };
}

export async function getVenuesForSession(sessionId: string) {
  return db
    .select({
      id: venues.id,
      name: venues.name,
      compositeScore: venues.compositeScore,
    })
    .from(venues)
    .where(eq(venues.sessionId, sessionId))
    .orderBy(desc(venues.compositeScore));
}

export async function getRecentActivity(sessionId: string, limit: number) {
  return getActivityFeed(sessionId, limit);
}

export async function getActivityFeed(
  sessionId: string,
  limit: number,
  cursor?: Date,
) {
  const where = cursor
    ? and(
        eq(activityFeed.sessionId, sessionId),
        lt(activityFeed.createdAt, cursor),
      )
    : eq(activityFeed.sessionId, sessionId);

  return db
    .select({
      id: activityFeed.id,
      type: activityFeed.type,
      metadata: activityFeed.metadata,
      createdAt: activityFeed.createdAt,
      actorName: users.name,
      actorEmail: users.email,
      actorImage: users.image,
    })
    .from(activityFeed)
    .leftJoin(sessionMembers, eq(activityFeed.memberId, sessionMembers.id))
    .leftJoin(users, eq(sessionMembers.userId, users.id))
    .where(where)
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit);
}
