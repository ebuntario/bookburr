"use server";

import { nanoid } from "nanoid";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  venues,
  venueReactions,
  venueVotes,
  sessionMembers,
  bukberSessions,
  activityFeed,
} from "@/lib/db/schema";
import { ACTIVITY_TYPE, VENUE_EMOJI, SESSION_STATUS } from "@/lib/constants";
import { env } from "@/lib/env";
import { logError } from "@/lib/logger";
import { detectPlatform, fetchSocialLinkMetadata } from "@/lib/social-embed";
import { calculateCentroid, calculateVenueScore } from "@/lib/algorithms/scoring";
import { broadcastSessionEvent } from "@/lib/supabase/broadcast";
import type { ActionResult } from "./helpers";

// ── discoverVenues helpers ──────────────────────────────────────────────────

interface DiscoverMember {
  flexibilityScore: number | null;
  referenceLocation: unknown;
  budgetCeiling: number | null;
  sessionCuisinePreferences: unknown;
  proximityTolerance: number | null;
}

function resolveSearchLocation(
  session: { officeLocation: unknown },
  members: DiscoverMember[],
  centroid: { lat: number; lng: number } | null,
): { lat: number; lng: number } | null {
  if (centroid) return centroid;
  const office = session.officeLocation as { lat?: number; lng?: number } | null;
  if (office?.lat && office?.lng) return { lat: office.lat, lng: office.lng };
  const firstWithLoc = members.find((m) => m.referenceLocation != null);
  if (firstWithLoc) return firstWithLoc.referenceLocation as { lat: number; lng: number };
  return null;
}

interface GooglePlaceResult {
  place_id: string;
  name: string;
  rating?: number;
  price_level?: number;
  types?: string[];
  geometry?: { location: { lat: number; lng: number } };
}

async function fetchNearbyPlaces(
  location: { lat: number; lng: number },
  apiKey: string,
): Promise<GooglePlaceResult[]> {
  const placesUrl =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${location.lat},${location.lng}` +
    `&radius=3000&type=restaurant&key=${apiKey}`;

  const placesRes = await fetch(placesUrl, { cache: "no-store" });
  if (!placesRes.ok) throw new Error("PLACES_API_ERROR");
  const placesData = (await placesRes.json()) as { results?: GooglePlaceResult[] };
  return placesData.results ?? [];
}

function buildVenueInserts(
  results: GooglePlaceResult[],
  members: DiscoverMember[],
  centroid: { lat: number; lng: number } | null,
  sessionId: string,
) {
  const memberData = members.map((m) => ({
    referenceLocation: m.referenceLocation as { lat: number; lng: number } | null,
    budgetCeiling: m.budgetCeiling,
    sessionCuisinePreferences: m.sessionCuisinePreferences as string[] | null,
  }));

  return results.slice(0, 10).map((place) => {
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
}

async function insertNoResultsActivity(
  sessionId: string,
  message: string,
): Promise<void> {
  await db.insert(activityFeed).values({
    id: nanoid(),
    sessionId,
    type: ACTIVITY_TYPE.system_recommendation,
    metadata: { message },
  });
  revalidatePath(`/sessions/${sessionId}`);
}

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

  // Security: reject non-https URLs to prevent XSS via javascript: or data: schemes
  if (params.socialLinkUrl && !params.socialLinkUrl.startsWith("https://")) {
    return { ok: false, error: "Link harus https://" };
  }

  const [session] = await db
    .select({ status: bukberSessions.status })
    .from(bukberSessions)
    .where(eq(bukberSessions.id, params.sessionId))
    .limit(1);

  if (!session) return { ok: false, error: "Session ga ditemukan" };
  if (session.status === SESSION_STATUS.confirmed || session.status === SESSION_STATUS.completed) {
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
  broadcastSessionEvent({ event: "venue_suggested", sessionId: params.sessionId, venueName: params.name }).catch(() => {});
  return { ok: true };
}

// ── Discover Venues ────────────────────────────────────────────────────────────

async function validateDiscoverSession(
  sessionId: string,
  userId: string,
) {
  const [session] = await db
    .select()
    .from(bukberSessions)
    .where(eq(bukberSessions.id, sessionId))
    .limit(1);

  if (!session) return { error: "Session ga ditemukan" } as const;
  if (session.hostId !== userId) return { error: "Cuma host yang bisa" } as const;
  if (session.status !== SESSION_STATUS.discovering) return { error: "Session belum di fase discovering" } as const;
  return { session } as const;
}

async function hasExistingSystemVenues(sessionId: string): Promise<boolean> {
  const existing = await db
    .select({ id: venues.id })
    .from(venues)
    .where(and(eq(venues.sessionId, sessionId), isNull(venues.suggestedByMemberId)))
    .limit(1);
  return existing.length > 0;
}

async function fetchSessionMembers(sessionId: string) {
  return db
    .select({
      flexibilityScore: sessionMembers.flexibilityScore,
      referenceLocation: sessionMembers.referenceLocation,
      budgetCeiling: sessionMembers.budgetCeiling,
      sessionCuisinePreferences: sessionMembers.sessionCuisinePreferences,
      proximityTolerance: sessionMembers.proximityTolerance,
    })
    .from(sessionMembers)
    .where(eq(sessionMembers.sessionId, sessionId));
}

async function insertDiscoveredVenues(
  results: GooglePlaceResult[],
  members: DiscoverMember[],
  centroid: { lat: number; lng: number } | null,
  sessionId: string,
): Promise<number> {
  const venueInserts = buildVenueInserts(results, members, centroid, sessionId);
  await db.insert(venues).values(venueInserts);

  await db.insert(activityFeed).values({
    id: nanoid(),
    sessionId,
    type: ACTIVITY_TYPE.system_recommendation,
    metadata: { message: `${venueInserts.length} venue ditemukan di sekitar lu!` },
  });

  revalidatePath(`/sessions/${sessionId}`);
  broadcastSessionEvent({ event: "venues_discovered", sessionId }).catch(() => {});
  return venueInserts.length;
}

export async function discoverVenues(sessionId: string): Promise<ActionResult & { count?: number; skipped?: boolean }> {
  const authSession = await auth();
  const userId = authSession?.user?.id;
  if (!userId) return { ok: false, error: "Harus login dulu" };

  const validation = await validateDiscoverSession(sessionId, userId);
  if ("error" in validation) return { ok: false, error: validation.error as string };

  if (await hasExistingSystemVenues(sessionId)) return { ok: true, skipped: true };

  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { ok: false, error: "Google Places API ga dikonfigurasi" };

  const members = await fetchSessionMembers(sessionId);
  const centroid = calculateCentroid(
    members.map((m) => ({
      flexibilityScore: m.flexibilityScore,
      referenceLocation: m.referenceLocation as { lat: number; lng: number } | null,
    })),
  );

  const searchLocation = resolveSearchLocation(validation.session, members, centroid);
  if (!searchLocation) {
    await insertNoResultsActivity(sessionId, "Ga ada data lokasi, venue discovery diskip");
    return { ok: true, skipped: true };
  }

  let results: GooglePlaceResult[];
  try {
    results = await fetchNearbyPlaces(searchLocation, apiKey);
  } catch (err) {
    logError("discoverVenues:fetchNearbyPlaces", err, { sessionId });
    return { ok: false, error: "Google Places request gagal, coba lagi ya" };
  }

  if (results.length === 0) {
    await insertNoResultsActivity(sessionId, "Ga ketemu venue di sekitar lokasi");
    return { ok: true, count: 0 };
  }

  const count = await insertDiscoveredVenues(results, members, centroid, sessionId);
  return { ok: true, count };
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
  broadcastSessionEvent({ event: "reaction_changed", sessionId: params.sessionId }).catch(() => {});
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

// ── Vote for Venue ─────────────────────────────────────────────────────────────

export async function voteForVenue(params: {
  sessionId: string;
  venueId?: string | null;
  isTerserah?: boolean;
}): Promise<ActionResult> {
  const authSession = await auth();
  const userId = authSession?.user?.id;
  if (!userId) return { ok: false, error: "Harus login dulu" };

  const [session] = await db
    .select({ status: bukberSessions.status })
    .from(bukberSessions)
    .where(eq(bukberSessions.id, params.sessionId))
    .limit(1);

  if (!session) return { ok: false, error: "Session ga ditemukan" };
  if (session.status !== SESSION_STATUS.voting) {
    return { ok: false, error: "Session belum di fase voting" };
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

  const isTerserah = params.isTerserah ?? false;
  const venueId = isTerserah ? null : (params.venueId ?? null);

  if (!isTerserah && !venueId) {
    return { ok: false, error: "Pilih venue atau pilih 'Ikut aja'" };
  }

  // Validate venueId belongs to this session
  if (venueId) {
    const [venue] = await db
      .select({ id: venues.id })
      .from(venues)
      .where(and(eq(venues.id, venueId), eq(venues.sessionId, params.sessionId)))
      .limit(1);
    if (!venue) return { ok: false, error: "Venue ga valid" };
  }

  // Upsert: one vote per session per member
  await db
    .insert(venueVotes)
    .values({
      id: nanoid(),
      sessionId: params.sessionId,
      venueId,
      memberId: member.id,
      isTerserah,
    })
    .onConflictDoUpdate({
      target: [venueVotes.sessionId, venueVotes.memberId],
      set: { venueId, isTerserah },
    });

  revalidatePath(`/sessions/${params.sessionId}`);
  broadcastSessionEvent({ event: "venue_voted", sessionId: params.sessionId }).catch(() => {});
  return { ok: true };
}
