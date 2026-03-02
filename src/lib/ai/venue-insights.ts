import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { venues } from "@/lib/db/schema";
import { AI_MODEL, AI_TIMEOUT_MS, PRICE_ESTIMATES } from "@/lib/constants";
import { logError, logWarn } from "@/lib/logger";
import { getAIClient } from "./client";
import {
  VenueInsightsResponseSchema,
  VENUE_INSIGHTS_JSON_SCHEMA,
  type VenueInsight,
} from "./schemas/venue-insights";

// ── Types ────────────────────────────────────────────────────────────────────

interface VenueInput {
  id: string;
  googlePlaceId: string | null;
  name: string;
  rating: number | null;
  priceLevel: number | null;
  compositeScore: number;
  location: { lat: number; lng: number } | null;
}

interface MemberContext {
  budgetCeiling: number | null;
  sessionCuisinePreferences: string[] | null;
  sessionDietaryPreferences: string[] | null;
  referenceLocation: { lat: number; lng: number } | null;
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are BookBurr's venue analyst. Your job is to evaluate restaurant venues for an Indonesian group planning an iftar (bukber) gathering.

You will receive:
- A list of venues with their Google Places data and composite scores
- Group member preferences (budgets, cuisine, dietary, locations)

For each venue, produce:
- oneLiner: A short, punchy insight in Jaksel slang (Jakarta Selatan casual Indonesian, like "Deket, murah, tapi ratingnya biasa aja" or "Harganya agak mehong tapi worth it sih"). Max 15 words. No emojis.
- fitLevel: "strong" (great fit for most members), "decent" (workable with tradeoffs), or "poor" (significant mismatches)
- pros: 1-2 short reasons this venue works for the group (in Jaksel). Max 8 words each.
- cons: 1-2 short reasons this venue might not work (in Jaksel). Max 8 words each. Empty array if none.

Also produce a groupSummary: One sentence in Jaksel summarizing what's available (e.g., "Banyak pilihan affordable di deket sini" or "Agak susah nyari yang pas budget semua orang"). Max 20 words.

Rules:
- Never mention specific member names or identifiers
- Keep language casual and natural — this should feel like a friend giving advice, not an AI
- Focus on practical group fit: budget alignment, location convenience, cuisine match
- If dietary preferences exist (halal, vegetarian, etc.), factor them into your assessment
- Price context: $$$$=400k IDR, $$$=200k, $$=100k, $=50k per person`;

function buildUserMessage(
  venueList: VenueInput[],
  members: MemberContext[],
): string {
  const memberSummary = {
    count: members.length,
    budgets: members
      .filter((m) => m.budgetCeiling != null)
      .map((m) => m.budgetCeiling),
    cuisinePrefs: [
      ...new Set(members.flatMap((m) => m.sessionCuisinePreferences ?? [])),
    ],
    dietaryPrefs: [
      ...new Set(members.flatMap((m) => m.sessionDietaryPreferences ?? [])),
    ],
    membersWithLocation: members.filter((m) => m.referenceLocation != null).length,
  };

  const venueData = venueList.map((v) => ({
    googlePlaceId: v.googlePlaceId,
    name: v.name,
    rating: v.rating,
    priceLevel: v.priceLevel,
    estimatedCostIDR: v.priceLevel ? PRICE_ESTIMATES[v.priceLevel] ?? null : null,
    compositeScore: Math.round(v.compositeScore * 100) / 100,
  }));

  return JSON.stringify({ members: memberSummary, venues: venueData });
}

// ── Main Function ────────────────────────────────────────────────────────────

/**
 * Generates AI insights for discovered venues and writes them to the DB.
 * Fire-and-forget — errors are logged, never thrown.
 */
export async function generateVenueInsights(
  sessionId: string,
  venueList: VenueInput[],
  members: MemberContext[],
): Promise<void> {
  const client = getAIClient();
  if (!client) {
    logWarn("ai:venueInsights", "OpenRouter not configured, skipping AI insights", { sessionId });
    return;
  }

  if (venueList.length === 0) return;

  // Only process venues with googlePlaceId (system-discovered)
  const systemVenues = venueList.filter((v) => v.googlePlaceId != null);
  if (systemVenues.length === 0) return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    const response = await client.chat.send({
      chatGenerationParams: {
        model: AI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(systemVenues, members) },
        ],
        responseFormat: {
          type: "json_schema",
          jsonSchema: VENUE_INSIGHTS_JSON_SCHEMA,
        },
        stream: false,
      },
    });

    clearTimeout(timeout);

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      logWarn("ai:venueInsights", "Empty AI response", { sessionId });
      return;
    }

    const parsed = VenueInsightsResponseSchema.parse(JSON.parse(content));

    // Build a map of googlePlaceId → insight
    const insightMap = new Map<string, VenueInsight>();
    for (const v of parsed.venues) {
      insightMap.set(v.googlePlaceId, v.insight);
    }

    // Write insights to each venue row
    const updates = systemVenues
      .filter((v) => v.googlePlaceId && insightMap.has(v.googlePlaceId))
      .map((v) =>
        db
          .update(venues)
          .set({ aiInsight: insightMap.get(v.googlePlaceId!) })
          .where(eq(venues.id, v.id)),
      );

    await Promise.all(updates);
  } catch (err) {
    // Never throw — AI is an enhancement, not a dependency
    logError("ai:venueInsights", err, { sessionId, venueCount: systemVenues.length });
  }
}
