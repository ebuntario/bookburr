"use server";

import { getActivityFeed } from "@/lib/queries/dashboard";
import { requireAuth } from "./helpers";

export async function loadMoreActivity(sessionId: string, cursor: string) {
  try {
    await requireAuth();
  } catch {
    return [];
  }

  const cursorDate = new Date(cursor);
  return getActivityFeed(sessionId, 10, cursorDate);
}
