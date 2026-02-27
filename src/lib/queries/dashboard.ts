import { eq, desc, asc, sql, and, lt, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bukberSessions,
  sessionMembers,
  dateOptions,
  dateVotes,
  activityFeed,
  users,
  venues,
  venueReactions,
  venueVotes,
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

export async function getDatesWithVoteCounts(
  sessionId: string,
  memberId?: string,
) {
  const myVoteExpr = memberId
    ? sql<string | null>`MAX(CASE WHEN ${dateVotes.memberId} = ${memberId} THEN ${dateVotes.preferenceLevel} END)`
    : sql<string | null>`CAST(NULL AS text)`;

  const dateScoreExpr = sql<number>`
    COALESCE(SUM(
      1.0 / GREATEST(COALESCE(${sessionMembers.flexibilityScore}, 0.1), 0.1)
      * CASE ${dateVotes.preferenceLevel}
          WHEN 'strongly_prefer' THEN 1.5
          WHEN 'can_do' THEN 1.0
          ELSE 0
        END
    ), 0)::float
  `;

  const dates = await db
    .select({
      id: dateOptions.id,
      date: dateOptions.date,
      stronglyPrefer: sql<number>`count(${dateVotes.id}) filter (where ${dateVotes.preferenceLevel} = 'strongly_prefer')::int`,
      canDo: sql<number>`count(${dateVotes.id}) filter (where ${dateVotes.preferenceLevel} = 'can_do')::int`,
      unavailable: sql<number>`count(${dateVotes.id}) filter (where ${dateVotes.preferenceLevel} = 'unavailable')::int`,
      dateScore: dateScoreExpr,
      myVote: myVoteExpr,
    })
    .from(dateOptions)
    .leftJoin(dateVotes, eq(dateVotes.dateOptionId, dateOptions.id))
    .leftJoin(sessionMembers, eq(sessionMembers.id, dateVotes.memberId))
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

export async function getVenuesForSession(sessionId: string, memberId?: string) {
  const venueList = await db
    .select({
      id: venues.id,
      name: venues.name,
      rating: venues.rating,
      priceLevel: venues.priceLevel,
      compositeScore: venues.compositeScore,
      location: venues.location,
      socialLinkUrl: venues.socialLinkUrl,
      socialLinkPlatform: venues.socialLinkPlatform,
      socialLinkMetadata: venues.socialLinkMetadata,
      suggestedByMemberId: venues.suggestedByMemberId,
    })
    .from(venues)
    .where(eq(venues.sessionId, sessionId))
    .orderBy(desc(venues.compositeScore));

  if (venueList.length === 0) return [];

  const venueIds = venueList.map((v) => v.id);

  // Reaction counts per emoji per venue
  const reactionRows = await db
    .select({
      venueId: venueReactions.venueId,
      emoji: venueReactions.emoji,
      count: sql<number>`count(*)::int`,
      hasMyReaction: memberId
        ? sql<boolean>`bool_or(${venueReactions.memberId} = ${memberId})`
        : sql<boolean>`false`,
    })
    .from(venueReactions)
    .where(inArray(venueReactions.venueId, venueIds))
    .groupBy(venueReactions.venueId, venueReactions.emoji);

  // Vote counts per venue (aggregate only — never expose who voted for what)
  const voteRows = await db
    .select({
      venueId: venueVotes.venueId,
      count: sql<number>`count(*)::int`,
    })
    .from(venueVotes)
    .where(
      and(
        eq(venueVotes.sessionId, sessionId),
        sql`${venueVotes.venueId} IS NOT NULL`,
      ),
    )
    .groupBy(venueVotes.venueId);

  // Current member's vote (venueId or isTerserah)
  let myVote: { venueId: string | null; isTerserah: boolean } | null = null;
  if (memberId) {
    const [mv] = await db
      .select({
        venueId: venueVotes.venueId,
        isTerserah: venueVotes.isTerserah,
      })
      .from(venueVotes)
      .where(
        and(
          eq(venueVotes.sessionId, sessionId),
          eq(venueVotes.memberId, memberId),
        ),
      )
      .limit(1);
    myVote = mv ?? null;
  }

  const reactionMap: Record<
    string,
    Record<string, { count: number; hasMyReaction: boolean }>
  > = {};
  for (const r of reactionRows) {
    if (!reactionMap[r.venueId]) reactionMap[r.venueId] = {};
    reactionMap[r.venueId][r.emoji] = {
      count: r.count,
      hasMyReaction: r.hasMyReaction,
    };
  }

  const voteCountMap: Record<string, number> = {};
  for (const v of voteRows) {
    if (v.venueId) voteCountMap[v.venueId] = v.count;
  }

  return venueList.map((v) => ({
    ...v,
    reactions: reactionMap[v.id] ?? {},
    voteCount: voteCountMap[v.id] ?? 0,
    isMyVote: myVote?.venueId === v.id,
  }));
}

/** Count of distinct members who have cast a venue vote (including terserah). */
export async function getVenueVotedMemberCount(sessionId: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(distinct ${venueVotes.memberId})::int` })
    .from(venueVotes)
    .where(eq(venueVotes.sessionId, sessionId));
  return count;
}

/** Total terserah count for the session. */
export async function getTerserahCount(sessionId: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(venueVotes)
    .where(
      and(
        eq(venueVotes.sessionId, sessionId),
        eq(venueVotes.isTerserah, true),
      ),
    );
  return count;
}

/** Whether the current member has voted "terserah". */
export async function getMemberVoteStatus(
  sessionId: string,
  memberId: string,
): Promise<{ voted: boolean; isTerserah: boolean; venueId: string | null }> {
  const [vote] = await db
    .select({
      venueId: venueVotes.venueId,
      isTerserah: venueVotes.isTerserah,
    })
    .from(venueVotes)
    .where(
      and(
        eq(venueVotes.sessionId, sessionId),
        eq(venueVotes.memberId, memberId),
      ),
    )
    .limit(1);

  return vote
    ? { voted: true, isTerserah: vote.isTerserah, venueId: vote.venueId }
    : { voted: false, isTerserah: false, venueId: null };
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
