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
