"use server";

import { auth } from "@/lib/auth";
import { getActivityFeed } from "@/lib/queries/dashboard";

export async function loadMoreActivity(sessionId: string, cursor: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const cursorDate = new Date(cursor);
  return getActivityFeed(sessionId, 10, cursorDate);
}
