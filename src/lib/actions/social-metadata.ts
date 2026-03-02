"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { venues, sessionMembers } from "@/lib/db/schema";
import { fetchSocialLinkMetadata } from "@/lib/social-embed";
import { logError } from "@/lib/logger";
import type { ActionResult } from "./helpers";

export async function refreshVenueMetadata(params: {
  venueId: string;
  sessionId: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Harus login dulu" };

  // Verify membership
  const [member] = await db
    .select({ id: sessionMembers.id })
    .from(sessionMembers)
    .where(
      and(
        eq(sessionMembers.sessionId, params.sessionId),
        eq(sessionMembers.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!member) return { ok: false, error: "Lu bukan anggota session ini" };

  // Fetch venue — only refresh if metadata is still empty
  const [venue] = await db
    .select({
      socialLinkUrl: venues.socialLinkUrl,
      socialLinkMetadata: venues.socialLinkMetadata,
    })
    .from(venues)
    .where(
      and(eq(venues.id, params.venueId), eq(venues.sessionId, params.sessionId)),
    )
    .limit(1);

  if (!venue) return { ok: false, error: "Venue ga ditemukan" };
  if (!venue.socialLinkUrl) return { ok: false, error: "Venue ga punya social link" };

  // Only refresh if metadata is genuinely empty
  const existing = venue.socialLinkMetadata as Record<string, unknown> | null;
  const isEmpty =
    !existing || (Object.keys(existing).length === 0);
  if (!isEmpty) return { ok: true }; // Already has metadata, nothing to do

  try {
    const metadata = await fetchSocialLinkMetadata(venue.socialLinkUrl);
    await db
      .update(venues)
      .set({ socialLinkMetadata: metadata })
      .where(eq(venues.id, params.venueId));

    revalidatePath(`/sessions/${params.sessionId}`);
    return { ok: true };
  } catch (err) {
    logError("refreshVenueMetadata", err, { venueId: params.venueId });
    return { ok: false, error: "Gagal fetch metadata, coba lagi ya" };
  }
}
