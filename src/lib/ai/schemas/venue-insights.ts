import { z } from "zod";

export const VenueInsightSchema = z.object({
  oneLiner: z.string(),
  fitLevel: z.enum(["strong", "decent", "poor"]),
  pros: z.array(z.string()).max(2),
  cons: z.array(z.string()).max(2),
});

export type VenueInsight = z.infer<typeof VenueInsightSchema>;

export const VenueInsightsResponseSchema = z.object({
  venues: z.array(
    z.object({
      googlePlaceId: z.string(),
      insight: VenueInsightSchema,
    }),
  ),
  groupSummary: z.string(),
});

export type VenueInsightsResponse = z.infer<typeof VenueInsightsResponseSchema>;

/** JSON Schema for OpenRouter structured output. */
export const VENUE_INSIGHTS_JSON_SCHEMA = {
  name: "venue_insights",
  strict: true,
  schema: {
    type: "object",
    required: ["venues", "groupSummary"],
    additionalProperties: false,
    properties: {
      venues: {
        type: "array",
        items: {
          type: "object",
          required: ["googlePlaceId", "insight"],
          additionalProperties: false,
          properties: {
            googlePlaceId: { type: "string" },
            insight: {
              type: "object",
              required: ["oneLiner", "fitLevel", "pros", "cons"],
              additionalProperties: false,
              properties: {
                oneLiner: { type: "string" },
                fitLevel: { type: "string", enum: ["strong", "decent", "poor"] },
                pros: { type: "array", items: { type: "string" }, maxItems: 2 },
                cons: { type: "array", items: { type: "string" }, maxItems: 2 },
              },
            },
          },
        },
      },
      groupSummary: { type: "string" },
    },
  },
} as const;
