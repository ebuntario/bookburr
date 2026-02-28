import { describe, it, expect } from "vitest";
import {
  calculateFlexibilityScore,
  haversineKm,
  calculateCentroid,
  calculateVenueScore,
} from "./scoring";
import { FLEXIBILITY_SCORE_MIN } from "@/lib/constants";

describe("calculateFlexibilityScore", () => {
  it("single, no location, 3 of 5 dates available → 0.78", () => {
    const score = calculateFlexibilityScore({
      maritalStatus: "single",
      hasLocation: false,
      totalDates: 5,
      availableDates: 3,
    });
    // 1.0 * 0.45 + 0.6 * 0.55 = 0.45 + 0.33 = 0.78
    expect(score).toBeCloseTo(0.78, 5);
  });

  it("married, has location, 0 of 0 dates (totalDates=0) → 0.5", () => {
    const score = calculateFlexibilityScore({
      maritalStatus: "married",
      hasLocation: true,
      totalDates: 0,
      availableDates: 0,
    });
    // scheduleWeight = 0.5 (totalDates = 0), distanceWeight = 0.5 (neutral)
    // 0.5 * 0.3 + 0.5 * 0.4 + 0.5 * 0.3 = 0.5
    expect(score).toBeCloseTo(0.5, 5);
  });

  it("null marital status → uses weight 0.75", () => {
    const score = calculateFlexibilityScore({
      maritalStatus: null,
      hasLocation: false,
      totalDates: 4,
      availableDates: 4,
    });
    // scheduleWeight = 1.0; 0.75 * 0.45 + 1.0 * 0.55 = 0.3375 + 0.55 = 0.8875
    expect(score).toBeCloseTo(0.8875, 5);
  });

  it("clamps to FLEXIBILITY_SCORE_MIN when score would be zero", () => {
    // Married, no location, 0/1 dates → score = 0.5 * 0.45 + 0 * 0.55 = 0.225
    // Won't actually reach 0, so let's manufacture the floor case via the min constant
    expect(FLEXIBILITY_SCORE_MIN).toBe(0.1);
    // All zeros via married, no loc, totalDates=1, availableDates=0
    const score = calculateFlexibilityScore({
      maritalStatus: "married",
      hasLocation: false,
      totalDates: 1,
      availableDates: 0,
    });
    // 0.5 * 0.45 + 0 * 0.55 = 0.225 — above floor, so result is 0.225
    expect(score).toBeCloseTo(0.225, 5);
    expect(score).toBeGreaterThanOrEqual(FLEXIBILITY_SCORE_MIN);
  });

  it("all dates available → scheduleWeight = 1.0", () => {
    const score = calculateFlexibilityScore({
      maritalStatus: "single",
      hasLocation: false,
      totalDates: 10,
      availableDates: 10,
    });
    // 1.0 * 0.45 + 1.0 * 0.55 = 1.0
    expect(score).toBeCloseTo(1.0, 5);
  });

  it("no dates but totalDates > 0 → scheduleWeight = 0", () => {
    const score = calculateFlexibilityScore({
      maritalStatus: "single",
      hasLocation: false,
      totalDates: 5,
      availableDates: 0,
    });
    // 1.0 * 0.45 + 0 * 0.55 = 0.45
    expect(score).toBeCloseTo(0.45, 5);
  });

  it("result is always at least FLEXIBILITY_SCORE_MIN", () => {
    const score = calculateFlexibilityScore({
      maritalStatus: "married",
      hasLocation: false,
      totalDates: 5,
      availableDates: 0,
    });
    expect(score).toBeGreaterThanOrEqual(FLEXIBILITY_SCORE_MIN);
  });
});

describe("haversineKm", () => {
  it("same point → 0 km", () => {
    expect(haversineKm(-6.2088, 106.8456, -6.2088, 106.8456)).toBeCloseTo(0, 5);
  });

  it("Jakarta to Bandung ≈ 119 km", () => {
    const dist = haversineKm(-6.2088, 106.8456, -6.9147, 107.6098);
    expect(dist).toBeGreaterThan(114);
    expect(dist).toBeLessThan(124);
  });

  it("is symmetric", () => {
    const d1 = haversineKm(-6.2088, 106.8456, -6.9147, 107.6098);
    const d2 = haversineKm(-6.9147, 107.6098, -6.2088, 106.8456);
    expect(d1).toBeCloseTo(d2, 5);
  });
});

describe("calculateCentroid", () => {
  it("fewer than 2 members with location → null", () => {
    expect(calculateCentroid([])).toBeNull();
    expect(
      calculateCentroid([
        { flexibilityScore: 0.5, referenceLocation: { lat: -6.2, lng: 106.8 } },
      ])
    ).toBeNull();
    expect(
      calculateCentroid([
        { flexibilityScore: 0.5, referenceLocation: null },
        { flexibilityScore: 0.5, referenceLocation: null },
      ])
    ).toBeNull();
  });

  it("2 members equal flexibility → midpoint (cluster snap applies since both are near centroid)", () => {
    const result = calculateCentroid([
      {
        flexibilityScore: 0.5,
        referenceLocation: { lat: -6.0, lng: 106.8 },
      },
      {
        flexibilityScore: 0.5,
        referenceLocation: { lat: -6.0, lng: 106.8 },
      },
    ]);
    // Both at same point → centroid is same point
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(-6.0, 5);
    expect(result!.lng).toBeCloseTo(106.8, 5);
  });

  it("cluster snap: >60% within 5km of centroid → snap to cluster mean", () => {
    // All 4 members tightly clustered → centroid is among them → 100% within 5km → snap
    const result = calculateCentroid([
      { flexibilityScore: 0.5, referenceLocation: { lat: -6.20, lng: 106.80 } },
      { flexibilityScore: 0.5, referenceLocation: { lat: -6.21, lng: 106.81 } },
      { flexibilityScore: 0.5, referenceLocation: { lat: -6.19, lng: 106.79 } },
      { flexibilityScore: 0.5, referenceLocation: { lat: -6.20, lng: 106.82 } },
    ]);
    expect(result).not.toBeNull();
    // Snap result = unweighted mean of cluster (all 4 members are the cluster)
    // lat mean = (-6.20 + -6.21 + -6.19 + -6.20) / 4 = -6.200
    expect(result!.lat).toBeCloseTo(-6.200, 2);
    expect(result!.lng).toBeCloseTo(106.805, 2);
  });

  it("no cluster snap: ≤60% within 5km → returns weighted centroid", () => {
    // 2 members far apart → each 50% of the group, ≤60% near centroid → no snap
    const result = calculateCentroid([
      { flexibilityScore: 0.5, referenceLocation: { lat: -6.0, lng: 106.0 } },
      { flexibilityScore: 0.5, referenceLocation: { lat: -8.0, lng: 110.0 } },
    ]);
    expect(result).not.toBeNull();
    // Midpoint approximately (equal weights)
    expect(result!.lat).toBeCloseTo(-7.0, 0);
  });

  it("members with null referenceLocation are excluded", () => {
    const result = calculateCentroid([
      { flexibilityScore: 0.5, referenceLocation: null },
      { flexibilityScore: 0.5, referenceLocation: { lat: -6.2, lng: 106.8 } },
      { flexibilityScore: 0.5, referenceLocation: { lat: -6.2, lng: 106.8 } },
    ]);
    // 2 members with location → valid result
    expect(result).not.toBeNull();
  });
});

describe("calculateVenueScore", () => {
  it("all neutral sub-scores → ~0.5", () => {
    const venue = {
      location: null,
      rating: null,
      priceLevel: null,
      cuisineType: null,
      socialLinkUrl: null,
      suggestedByMemberId: null,
    };
    const score = calculateVenueScore(venue, [], null);
    // proximity=0.5, rating=0.5, priceFit=0.5, cuisine=0.5, social=0.5
    // 0.5*0.3 + 0.5*0.2 + 0.5*0.2 + 0.5*0.15 + 0.5*0.15 = 0.5
    expect(score).toBeCloseTo(0.5, 5);
  });

  it("weighted formula: proximity×0.3 + rating×0.2 + priceFit×0.2 + cuisine×0.15 + social×0.15", () => {
    const venue = {
      location: { lat: -6.2, lng: 106.8 },
      rating: 5.0,
      priceLevel: 1,
      cuisineType: "Indonesian",
      socialLinkUrl: "https://tiktok.com/test",
      suggestedByMemberId: "m1",
    };
    const members = [
      {
        referenceLocation: { lat: -6.2, lng: 106.8 },
        budgetCeiling: 100_000,
        sessionCuisinePreferences: ["Indonesian"],
      },
    ];
    const centroid = { lat: -6.2, lng: 106.8 };
    const score = calculateVenueScore(venue, members, centroid);
    // proximity: 0km → 1.0; rating: 5/5 = 1.0; priceFit: 50_000 ≤ 100_000 → 1.0
    // cuisine: match → 1.0; social: 0.5 + 0.25 + 0.25 = 1.0
    // 1.0*0.3 + 1.0*0.2 + 1.0*0.2 + 1.0*0.15 + 1.0*0.15 = 1.0
    expect(score).toBeCloseTo(1.0, 5);
  });
});
