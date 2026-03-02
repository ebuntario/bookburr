"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { venues } from "@/lib/db/schema";
import { fetchSocialLinkMetadata } from "@/lib/social-embed";
import { logError } from "@/lib/logger";
import { requireAuth, requireMember, type ActionResult } from "./helpers";

export async function refreshVenueMetadata(params: {
  venueId: string;
  sessionId: string;
}): Promise<ActionResult> {
  try {
    const userId = await requireAuth();
    await requireMember(params.sessionId, userId);
  } catch {
    return { ok: false, error: "Harus login dulu / bukan anggota" };
  }

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
