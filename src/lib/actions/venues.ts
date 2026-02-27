"use server";

import { nanoid } from "nanoid";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  venues,
  venueReactions,
  sessionMembers,
  bukberSessions,
  activityFeed,
} from "@/lib/db/schema";
import { ACTIVITY_TYPE, VENUE_EMOJI } from "@/lib/constants";
import { env } from "@/lib/env";
import { detectPlatform, fetchSocialLinkMetadata } from "@/lib/social-embed";
import { calculateCentroid, calculateVenueScore } from "@/lib/algorithms/scoring";

type ActionResult = { ok: true } | { ok: false; error: string };

// ── Suggest Venue ─────────────────────────────────────────────────────────────

export async function suggestVenue(params: {
  sessionId: string;
  name: string;
  googlePlaceId?: string | null;
  location?: { lat: number; lng: number } | null;
  socialLinkUrl?: string | null;
}): Promise<ActionResult> {
  const authSession = await auth();
  const userId = authSession?.user?.id;
  if (!userId) return { ok: false, error: "Harus login dulu" };

  const [member] = await db
    .select({ id: sessionMembers.id })
    .from(sessionMembers)
    .where(
      and(
        eq(sessionMembers.sessionId, params.sessionId),
        eq(sessionMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!member) return { ok: false, error: "Lu bukan anggota session ini" };

  const [session] = await db
    .select({ status: bukberSessions.status })
    .from(bukberSessions)
    .where(eq(bukberSessions.id, params.sessionId))
    .limit(1);

  if (!session) return { ok: false, error: "Session ga ditemukan" };
  if (session.status === "confirmed" || session.status === "completed") {
    return { ok: false, error: "Session udah selesai, ga bisa suggest venue" };
  }

  let socialLinkMetadata = null;
  let socialLinkPlatform: string | null = null;

  if (params.socialLinkUrl) {
    socialLinkPlatform = detectPlatform(params.socialLinkUrl);
    if (socialLinkPlatform) {
      socialLinkMetadata = await fetchSocialLinkMetadata(params.socialLinkUrl);
    }
  }

  const venueId = nanoid();
  await db.insert(venues).values({
    id: venueId,
    sessionId: params.sessionId,
    name: params.name,
    googlePlaceId: params.googlePlaceId ?? null,
    location: params.location ?? null,
    suggestedByMemberId: member.id,
    socialLinkUrl: params.socialLinkUrl ?? null,
    socialLinkPlatform,
    socialLinkMetadata,
    compositeScore: 0.75, // member-suggested gets social proof bonus
  });

  await db.insert(activityFeed).values({
    id: nanoid(),
    sessionId: params.sessionId,
    memberId: member.id,
    type: ACTIVITY_TYPE.suggested_venue,
    metadata: { venueName: params.name },
  });

  revalidatePath(`/sessions/${params.sessionId}`);
  return { ok: true };
}

// ── Discover Venues ────────────────────────────────────────────────────────────

interface GooglePlaceResult {
  place_id: string;
  name: string;
  rating?: number;
  price_level?: number;
  types?: string[];
  geometry?: { location: { lat: number; lng: number } };
}

export async function discoverVenues(sessionId: string): Promise<ActionResult & { count?: number; skipped?: boolean }> {
  const authSession = await auth();
  const userId = authSession?.user?.id;
  if (!userId) return { ok: false, error: "Harus login dulu" };

  const [session] = await db
    .select()
    .from(bukberSessions)
    .where(eq(bukberSessions.id, sessionId))
    .limit(1);

  if (!session) return { ok: false, error: "Session ga ditemukan" };
  if (session.hostId !== userId) return { ok: false, error: "Cuma host yang bisa" };
  if (session.status !== "discovering") {
    return { ok: false, error: "Session belum di fase discovering" };
  }

  // Idempotency: skip if system venues already exist
  const existing = await db
    .select({ id: venues.id })
    .from(venues)
    .where(and(eq(venues.sessionId, sessionId), isNull(venues.suggestedByMemberId)))
    .limit(1);

  if (existing.length > 0) return { ok: true, skipped: true };

  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Google Places API ga dikonfigurasi" };
  }

  // Fetch members with location data for centroid calculation
  const members = await db
    .select({
      flexibilityScore: sessionMembers.flexibilityScore,
      referenceLocation: sessionMembers.referenceLocation,
      budgetCeiling: sessionMembers.budgetCeiling,
      sessionCuisinePreferences: sessionMembers.sessionCuisinePreferences,
      proximityTolerance: sessionMembers.proximityTolerance,
    })
    .from(sessionMembers)
    .where(eq(sessionMembers.sessionId, sessionId));

  const centroid = calculateCentroid(
    members.map((m) => ({
      flexibilityScore: m.flexibilityScore,
      referenceLocation: m.referenceLocation as { lat: number; lng: number } | null,
    })),
  );

  // Fallback: office location (work mode) → first member with location
  let searchLocation = centroid;
  if (!searchLocation) {
    const office = session.officeLocation as { lat?: number; lng?: number } | null;
    if (office?.lat && office?.lng) {
      searchLocation = { lat: office.lat, lng: office.lng };
    } else {
      const firstWithLoc = members.find((m) => m.referenceLocation != null);
      if (firstWithLoc) {
        searchLocation = firstWithLoc.referenceLocation as { lat: number; lng: number };
      }
    }
  }

  if (!searchLocation) {
    await db.insert(activityFeed).values({
      id: nanoid(),
      sessionId,
      type: ACTIVITY_TYPE.system_recommendation,
      metadata: { message: "Ga ada data lokasi, venue discovery diskip" },
    });
    revalidatePath(`/sessions/${sessionId}`);
    return { ok: true, skipped: true };
  }

  // Google Places Nearby Search
  const placesUrl =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${searchLocation.lat},${searchLocation.lng}` +
    `&radius=3000&type=restaurant&key=${apiKey}`;

  let placesData: { results?: GooglePlaceResult[] };
  try {
    const placesRes = await fetch(placesUrl, { cache: "no-store" });
    if (!placesRes.ok) throw new Error("places_api_error");
    placesData = (await placesRes.json()) as { results?: GooglePlaceResult[] };
  } catch {
    return { ok: false, error: "Google Places request gagal, coba lagi ya" };
  }

  const results = placesData.results ?? [];

  if (results.length === 0) {
    await db.insert(activityFeed).values({
      id: nanoid(),
      sessionId,
      type: ACTIVITY_TYPE.system_recommendation,
      metadata: { message: "Ga ketemu venue di sekitar lokasi" },
    });
    revalidatePath(`/sessions/${sessionId}`);
    return { ok: true, count: 0 };
  }

  const memberData = members.map((m) => ({
    referenceLocation: m.referenceLocation as { lat: number; lng: number } | null,
    budgetCeiling: m.budgetCeiling,
    sessionCuisinePreferences: m.sessionCuisinePreferences as string[] | null,
  }));

  const venueInserts = results.slice(0, 10).map((place) => {
    const location = place.geometry?.location
      ? { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
      : null;

    const compositeScore = calculateVenueScore(
      {
        location,
        rating: place.rating ?? null,
        priceLevel: place.price_level ?? null,
        cuisineType: place.types?.[0] ?? null,
        socialLinkUrl: null,
        suggestedByMemberId: null,
      },
      memberData,
      centroid,
    );

    return {
      id: nanoid(),
      sessionId,
      googlePlaceId: place.place_id,
      name: place.name,
      location,
      rating: place.rating ?? null,
      priceLevel: place.price_level ?? null,
      compositeScore,
      suggestedByMemberId: null,
    };
  });

  await db.insert(venues).values(venueInserts);

  await db.insert(activityFeed).values({
    id: nanoid(),
    sessionId,
    type: ACTIVITY_TYPE.system_recommendation,
    metadata: { message: `${venueInserts.length} venue ditemukan di sekitar lu!` },
  });

  revalidatePath(`/sessions/${sessionId}`);
  return { ok: true, count: venueInserts.length };
}

// ── React to Venue ─────────────────────────────────────────────────────────────

export async function reactToVenue(params: {
  sessionId: string;
  venueId: string;
  emoji: string;
}): Promise<ActionResult> {
  const authSession = await auth();
  const userId = authSession?.user?.id;
  if (!userId) return { ok: false, error: "Harus login dulu" };

  const validEmojis = Object.values(VENUE_EMOJI) as string[];
  if (!validEmojis.includes(params.emoji)) {
    return { ok: false, error: "Emoji ga valid" };
  }

  const [member] = await db
    .select({ id: sessionMembers.id })
    .from(sessionMembers)
    .where(
      and(
        eq(sessionMembers.sessionId, params.sessionId),
        eq(sessionMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!member) return { ok: false, error: "Lu bukan anggota session ini" };

  // Check if venue belongs to this session
  const [venue] = await db
    .select({ id: venues.id })
    .from(venues)
    .where(
      and(eq(venues.id, params.venueId), eq(venues.sessionId, params.sessionId)),
    )
    .limit(1);

  if (!venue) return { ok: false, error: "Venue ga ditemukan" };

  // Toggle reaction
  const [existing] = await db
    .select({ id: venueReactions.id })
    .from(venueReactions)
    .where(
      and(
        eq(venueReactions.venueId, params.venueId),
        eq(venueReactions.memberId, member.id),
        eq(venueReactions.emoji, params.emoji),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(venueReactions).where(eq(venueReactions.id, existing.id));
  } else {
    await db.insert(venueReactions).values({
      id: nanoid(),
      venueId: params.venueId,
      memberId: member.id,
      emoji: params.emoji,
    });
  }

  revalidatePath(`/sessions/${params.sessionId}`);
  return { ok: true };
}

// ── Retry Discovery ─────────────────────────────────────────────────────────────

export async function retryDiscoverVenues(sessionId: string): Promise<ActionResult & { count?: number }> {
  // Delete existing system venues first, then re-discover
  const authSession = await auth();
  const userId = authSession?.user?.id;
  if (!userId) return { ok: false, error: "Harus login dulu" };

  const [session] = await db
    .select({ hostId: bukberSessions.hostId })
    .from(bukberSessions)
    .where(eq(bukberSessions.id, sessionId))
    .limit(1);

  if (!session) return { ok: false, error: "Session ga ditemukan" };
  if (session.hostId !== userId) return { ok: false, error: "Cuma host yang bisa" };

  // Delete existing system-discovered venues (not member-suggested)
  const systemVenues = await db
    .select({ id: venues.id })
    .from(venues)
    .where(and(eq(venues.sessionId, sessionId), isNull(venues.suggestedByMemberId)));

  if (systemVenues.length > 0) {
    await db
      .delete(venues)
      .where(inArray(venues.id, systemVenues.map((v) => v.id)));
  }

  return discoverVenues(sessionId);
}
