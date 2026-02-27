import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, sessionMembers, bukberSessions } from "@/lib/db/schema";

export async function getUserProfile(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}

export async function getUserStats(userId: string) {
  const [[{ totalSessions }], [{ sessionsHosted }]] = await Promise.all([
    db
      .select({ totalSessions: count() })
      .from(sessionMembers)
      .where(eq(sessionMembers.userId, userId)),
    db
      .select({ sessionsHosted: count() })
      .from(bukberSessions)
      .where(eq(bukberSessions.hostId, userId)),
  ]);

  return { totalSessions, sessionsHosted };
}
