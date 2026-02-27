import { FLEXIBILITY_SCORE_MIN, MARITAL_STATUS } from "@/lib/constants";

/**
 * Calculates a member's flexibility score.
 * Higher score = more flexible = less tiebreaker power in date scoring.
 *
 * Formula: (marital * 0.3) + (distance * 0.4) + (schedule * 0.3)
 * If member has no location: redistributed as (marital * 0.45) + (schedule * 0.55)
 */
export function calculateFlexibilityScore(params: {
  maritalStatus: string | null;
  hasLocation: boolean;
  totalDates: number;
  availableDates: number; // strongly_prefer + can_do
}): number {
  const maritalWeight =
    params.maritalStatus === MARITAL_STATUS.single
      ? 1.0
      : params.maritalStatus === MARITAL_STATUS.married
        ? 0.5
        : 0.75; // not provided

  const scheduleWeight =
    params.totalDates > 0 ? params.availableDates / params.totalDates : 0.5;

  let score: number;

  if (!params.hasLocation) {
    // Redistribute: skip distance factor
    score = maritalWeight * 0.45 + scheduleWeight * 0.55;
  } else {
    // Use neutral distance (0.5) — centroid computed separately during venue discovery
    const distanceWeight = 0.5;
    score = maritalWeight * 0.3 + distanceWeight * 0.4 + scheduleWeight * 0.3;
  }

  return Math.max(score, FLEXIBILITY_SCORE_MIN);
}

// ── Geo helpers ───────────────────────────────────────────────────────────────

/** Haversine distance between two lat/lng points (km). */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface MemberForCentroid {
  flexibilityScore: number | null;
  referenceLocation: { lat: number; lng: number } | null;
}

/**
 * Weighted geographic centroid of members (weight = 1 / flexibility_score).
 * Applies cluster snapping: if >60% of members are within 5km of centroid, snaps to cluster mean.
 * Returns null if fewer than 2 members have location data.
 */
export function calculateCentroid(
  members: MemberForCentroid[],
): { lat: number; lng: number } | null {
  const withLocation = members.filter((m) => m.referenceLocation != null);
  if (withLocation.length < 2) return null;

  let totalWeight = 0;
  let sumLat = 0;
  let sumLng = 0;

  for (const m of withLocation) {
    const score = Math.max(m.flexibilityScore ?? 0.5, FLEXIBILITY_SCORE_MIN);
    const weight = 1 / score;
    sumLat += m.referenceLocation!.lat * weight;
    sumLng += m.referenceLocation!.lng * weight;
    totalWeight += weight;
  }

  const centroid = { lat: sumLat / totalWeight, lng: sumLng / totalWeight };

  // Cluster snapping: >60% within 5km → snap to cluster center
  const near = withLocation.filter(
    (m) =>
      haversineKm(
        centroid.lat,
        centroid.lng,
        m.referenceLocation!.lat,
        m.referenceLocation!.lng,
      ) <= 5,
  );
  if (near.length / withLocation.length > 0.6) {
    return {
      lat: near.reduce((s, m) => s + m.referenceLocation!.lat, 0) / near.length,
      lng: near.reduce((s, m) => s + m.referenceLocation!.lng, 0) / near.length,
    };
  }

  return centroid;
}

// ── Venue scoring ─────────────────────────────────────────────────────────────

interface VenueForScore {
  location: { lat: number; lng: number } | null;
  rating: number | null;
  priceLevel: number | null;
  cuisineType: string | null;
  socialLinkUrl: string | null;
  suggestedByMemberId: string | null;
}

interface MemberForVenueScore {
  referenceLocation: { lat: number; lng: number } | null;
  budgetCeiling: number | null;
  sessionCuisinePreferences: string[] | null;
}

/**
 * Composite venue score (0–1):
 * proximity (30%) + rating (20%) + price_fit (20%) + cuisine_match (15%) + social_proof (15%)
 */
export function calculateVenueScore(
  venue: VenueForScore,
  members: MemberForVenueScore[],
  centroid: { lat: number; lng: number } | null,
): number {
  // Proximity (0–1): 0–2km = 1.0, linear decay to 0 at 10km
  let proximityScore = 0.5;
  if (venue.location && centroid) {
    const distKm = haversineKm(
      centroid.lat,
      centroid.lng,
      venue.location.lat,
      venue.location.lng,
    );
    proximityScore = Math.max(0, 1 - distKm / 10);
  }

  // Rating (0–1): Google rating / 5
  const ratingScore = venue.rating != null ? venue.rating / 5 : 0.5;

  // Price fit (0–1): fraction of members whose budget covers the venue
  let priceFitScore = 0.5;
  const membersWithBudget = members.filter((m) => m.budgetCeiling != null);
  if (venue.priceLevel != null && membersWithBudget.length > 0) {
    const PRICE_ESTIMATES: Record<number, number> = {
      1: 50_000,
      2: 100_000,
      3: 200_000,
      4: 400_000,
    };
    const estimatedCost = PRICE_ESTIMATES[venue.priceLevel] ?? 100_000;
    const fits = membersWithBudget.filter((m) => m.budgetCeiling! >= estimatedCost);
    priceFitScore = fits.length / membersWithBudget.length;
  }

  // Cuisine match (0–1)
  let cuisineScore = 0.5;
  if (venue.cuisineType) {
    const membersWithPref = members.filter(
      (m) => m.sessionCuisinePreferences && m.sessionCuisinePreferences.length > 0,
    );
    if (membersWithPref.length > 0) {
      const matches = membersWithPref.filter((m) =>
        m.sessionCuisinePreferences!.some(
          (c) => c.toLowerCase() === venue.cuisineType!.toLowerCase(),
        ),
      );
      cuisineScore = matches.length / membersWithPref.length;
    }
  }

  // Social proof (0–1): base 0.5 + 0.25 for social link + 0.25 for member suggestion
  const socialProofScore =
    0.5 +
    (venue.socialLinkUrl ? 0.25 : 0) +
    (venue.suggestedByMemberId ? 0.25 : 0);

  return (
    proximityScore * 0.3 +
    ratingScore * 0.2 +
    priceFitScore * 0.2 +
    cuisineScore * 0.15 +
    socialProofScore * 0.15
  );
}
