import { haversineKm } from "./scoring";
import { PRICE_ESTIMATES } from "@/lib/constants";

export interface VenueForScore {
  location: { lat: number; lng: number } | null;
  rating: number | null;
  priceLevel: number | null;
  cuisineType: string | null;
  socialLinkUrl: string | null;
  suggestedByMemberId: string | null;
}

export interface MemberForVenueScore {
  referenceLocation: { lat: number; lng: number } | null;
  budgetCeiling: number | null;
  sessionCuisinePreferences: string[] | null;
}

export function calcProximityScore(
  venue: Pick<VenueForScore, "location">,
  centroid: { lat: number; lng: number } | null,
): number {
  if (!venue.location || !centroid) return 0.5;
  const distKm = haversineKm(
    centroid.lat,
    centroid.lng,
    venue.location.lat,
    venue.location.lng,
  );
  return Math.max(0, 1 - distKm / 10);
}

export function calcRatingScore(rating: number | null): number {
  return rating != null ? rating / 5 : 0.5;
}

export function calcPriceFitScore(
  venue: Pick<VenueForScore, "priceLevel">,
  members: MemberForVenueScore[],
): number {
  const membersWithBudget = members.filter((m) => m.budgetCeiling != null);
  if (venue.priceLevel == null || membersWithBudget.length === 0) return 0.5;
  const estimatedCost = PRICE_ESTIMATES[venue.priceLevel] ?? 100_000;
  const fits = membersWithBudget.filter((m) => m.budgetCeiling! >= estimatedCost);
  return fits.length / membersWithBudget.length;
}

export function calcCuisineMatchScore(
  venue: Pick<VenueForScore, "cuisineType">,
  members: MemberForVenueScore[],
): number {
  if (!venue.cuisineType) return 0.5;
  const membersWithPref = members.filter(
    (m) => m.sessionCuisinePreferences && m.sessionCuisinePreferences.length > 0,
  );
  if (membersWithPref.length === 0) return 0.5;
  const matches = membersWithPref.filter((m) =>
    m.sessionCuisinePreferences!.some(
      (c) => c.toLowerCase() === venue.cuisineType!.toLowerCase(),
    ),
  );
  return matches.length / membersWithPref.length;
}

export function calcSocialProofScore(
  venue: Pick<VenueForScore, "socialLinkUrl" | "suggestedByMemberId">,
): number {
  return (
    0.5 +
    (venue.socialLinkUrl ? 0.25 : 0) +
    (venue.suggestedByMemberId ? 0.25 : 0)
  );
}
