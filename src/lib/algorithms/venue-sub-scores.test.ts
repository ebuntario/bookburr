import { describe, it, expect } from "vitest";
import {
  calcProximityScore,
  calcRatingScore,
  calcPriceFitScore,
  calcCuisineMatchScore,
  calcSocialProofScore,
} from "./venue-sub-scores";

describe("calcProximityScore", () => {
  it("no venue location → 0.5", () => {
    expect(calcProximityScore({ location: null }, { lat: -6.2, lng: 106.8 })).toBe(0.5);
  });

  it("no centroid → 0.5", () => {
    expect(calcProximityScore({ location: { lat: -6.2, lng: 106.8 } }, null)).toBe(0.5);
  });

  it("venue at centroid (0 km) → 1.0", () => {
    const loc = { lat: -6.2, lng: 106.8 };
    expect(calcProximityScore({ location: loc }, loc)).toBeCloseTo(1.0, 5);
  });

  it("venue 5 km from centroid → 0.5", () => {
    // 5km distance → 1 - 5/10 = 0.5
    // Use Jakarta centroid, move ~5km (approx 0.045 degrees lat)
    const centroid = { lat: -6.2, lng: 106.8 };
    // From Jakarta, ~5km north is roughly -6.155, 106.8
    const score = calcProximityScore({ location: { lat: -6.155, lng: 106.8 } }, centroid);
    expect(score).toBeGreaterThan(0.45);
    expect(score).toBeLessThan(0.6);
  });

  it("venue 10+ km from centroid → clamp to 0.0", () => {
    const centroid = { lat: -6.2, lng: 106.8 };
    // 15km away → 1 - 15/10 = -0.5 → clamped to 0
    const score = calcProximityScore({ location: { lat: -6.335, lng: 106.8 } }, centroid);
    expect(score).toBe(0);
  });
});

describe("calcRatingScore", () => {
  it("null rating → 0.5", () => {
    expect(calcRatingScore(null)).toBe(0.5);
  });

  it("5.0 → 1.0", () => {
    expect(calcRatingScore(5.0)).toBeCloseTo(1.0, 5);
  });

  it("3.5 → 0.7", () => {
    expect(calcRatingScore(3.5)).toBeCloseTo(0.7, 5);
  });

  it("0 → 0.0", () => {
    expect(calcRatingScore(0)).toBe(0.0);
  });

  it("2.5 → 0.5", () => {
    expect(calcRatingScore(2.5)).toBeCloseTo(0.5, 5);
  });
});

describe("calcPriceFitScore", () => {
  it("no priceLevel → 0.5", () => {
    const members = [{ referenceLocation: null, budgetCeiling: 100_000, sessionCuisinePreferences: null }];
    expect(calcPriceFitScore({ priceLevel: null }, members)).toBe(0.5);
  });

  it("no members with budget → 0.5", () => {
    const members = [
      { referenceLocation: null, budgetCeiling: null, sessionCuisinePreferences: null },
    ];
    expect(calcPriceFitScore({ priceLevel: 2 }, members)).toBe(0.5);
  });

  it("empty members array → 0.5", () => {
    expect(calcPriceFitScore({ priceLevel: 2 }, [])).toBe(0.5);
  });

  it("all members can afford → 1.0", () => {
    // priceLevel 1 = 50_000 IDR
    const members = [
      { referenceLocation: null, budgetCeiling: 100_000, sessionCuisinePreferences: null },
      { referenceLocation: null, budgetCeiling: 75_000, sessionCuisinePreferences: null },
    ];
    expect(calcPriceFitScore({ priceLevel: 1 }, members)).toBe(1.0);
  });

  it("no members can afford → 0.0", () => {
    // priceLevel 4 = 400_000 IDR
    const members = [
      { referenceLocation: null, budgetCeiling: 50_000, sessionCuisinePreferences: null },
      { referenceLocation: null, budgetCeiling: 100_000, sessionCuisinePreferences: null },
    ];
    expect(calcPriceFitScore({ priceLevel: 4 }, members)).toBe(0.0);
  });

  it("half members can afford → 0.5", () => {
    // priceLevel 2 = 100_000 IDR
    const members = [
      { referenceLocation: null, budgetCeiling: 200_000, sessionCuisinePreferences: null },
      { referenceLocation: null, budgetCeiling: 50_000, sessionCuisinePreferences: null },
    ];
    expect(calcPriceFitScore({ priceLevel: 2 }, members)).toBe(0.5);
  });

  it("unknown priceLevel falls back to 100_000 estimate", () => {
    // priceLevel 99 (not in map) → estimatedCost = 100_000
    const members = [
      { referenceLocation: null, budgetCeiling: 200_000, sessionCuisinePreferences: null },
    ];
    expect(calcPriceFitScore({ priceLevel: 99 }, members)).toBe(1.0);
  });
});

describe("calcCuisineMatchScore", () => {
  it("no cuisineType → 0.5", () => {
    const members = [
      { referenceLocation: null, budgetCeiling: null, sessionCuisinePreferences: ["Indonesian"] },
    ];
    expect(calcCuisineMatchScore({ cuisineType: null }, members)).toBe(0.5);
  });

  it("no members with preferences → 0.5", () => {
    const members = [
      { referenceLocation: null, budgetCeiling: null, sessionCuisinePreferences: null },
      { referenceLocation: null, budgetCeiling: null, sessionCuisinePreferences: [] },
    ];
    expect(calcCuisineMatchScore({ cuisineType: "Indonesian" }, members)).toBe(0.5);
  });

  it("all members match → 1.0", () => {
    const members = [
      {
        referenceLocation: null,
        budgetCeiling: null,
        sessionCuisinePreferences: ["Indonesian", "Chinese"],
      },
      {
        referenceLocation: null,
        budgetCeiling: null,
        sessionCuisinePreferences: ["Indonesian"],
      },
    ];
    expect(calcCuisineMatchScore({ cuisineType: "Indonesian" }, members)).toBe(1.0);
  });

  it("no members match → 0.0", () => {
    const members = [
      {
        referenceLocation: null,
        budgetCeiling: null,
        sessionCuisinePreferences: ["Chinese"],
      },
      {
        referenceLocation: null,
        budgetCeiling: null,
        sessionCuisinePreferences: ["Japanese"],
      },
    ];
    expect(calcCuisineMatchScore({ cuisineType: "Indonesian" }, members)).toBe(0.0);
  });

  it("case-insensitive match", () => {
    const members = [
      {
        referenceLocation: null,
        budgetCeiling: null,
        sessionCuisinePreferences: ["INDONESIAN"],
      },
    ];
    expect(calcCuisineMatchScore({ cuisineType: "indonesian" }, members)).toBe(1.0);
  });
});

describe("calcSocialProofScore", () => {
  it("no link, no suggestion → 0.5", () => {
    expect(calcSocialProofScore({ socialLinkUrl: null, suggestedByMemberId: null })).toBe(0.5);
  });

  it("has social link, no suggestion → 0.75", () => {
    expect(
      calcSocialProofScore({ socialLinkUrl: "https://tiktok.com/test", suggestedByMemberId: null })
    ).toBe(0.75);
  });

  it("no link, has suggestion → 0.75", () => {
    expect(
      calcSocialProofScore({ socialLinkUrl: null, suggestedByMemberId: "m1" })
    ).toBe(0.75);
  });

  it("has both link and suggestion → 1.0", () => {
    expect(
      calcSocialProofScore({
        socialLinkUrl: "https://instagram.com/p/abc",
        suggestedByMemberId: "m1",
      })
    ).toBe(1.0);
  });
});
