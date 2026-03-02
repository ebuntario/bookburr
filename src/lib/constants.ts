export const SESSION_STATUS = {
  collecting: "collecting",
  discovering: "discovering",
  voting: "voting",
  confirmed: "confirmed",
  completed: "completed",
} as const;

export type SessionStatus =
  (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export const SESSION_MODE = {
  personal: "personal",
  work: "work",
} as const;

export type SessionMode = (typeof SESSION_MODE)[keyof typeof SESSION_MODE];

export const SESSION_SHAPE = {
  need_both: "need_both",
  date_known: "date_known",
  venue_known: "venue_known",
} as const;

export type SessionShape =
  (typeof SESSION_SHAPE)[keyof typeof SESSION_SHAPE];

/** Eid al-Fitr 2026 — update annually */
export const EID_2026 = "2026-03-30";

export const PREFERENCE_LEVEL = {
  strongly_prefer: "strongly_prefer",
  can_do: "can_do",
  unavailable: "unavailable",
} as const;

export type PreferenceLevel =
  (typeof PREFERENCE_LEVEL)[keyof typeof PREFERENCE_LEVEL];

export const VENUE_EMOJI = {
  fire: "\u{1F525}",
  meh: "\u{1F610}",
  expensive: "\u{1F4B8}",
  far: "\u{1F4CD}",
} as const;

export type VenueEmoji = (typeof VENUE_EMOJI)[keyof typeof VENUE_EMOJI];

export const SOCIAL_PLATFORM = {
  tiktok: "tiktok",
  instagram: "instagram",
} as const;

export type SocialPlatform =
  (typeof SOCIAL_PLATFORM)[keyof typeof SOCIAL_PLATFORM];

export const JOINED_VIA = {
  web: "web",
  whatsapp: "whatsapp",
} as const;

export type JoinedVia = (typeof JOINED_VIA)[keyof typeof JOINED_VIA];

export const ACTIVITY_TYPE = {
  session_created: "session_created",
  joined: "joined",
  voted: "voted",
  suggested_venue: "suggested_venue",
  added_preference: "added_preference",
  system_recommendation: "system_recommendation",
  milestone: "milestone",
  status_changed: "status_changed",
  confirmed: "confirmed",
  calendar_sent: "calendar_sent", // TODO: wire up activity entry when calendar invites are sent
  date_suggested: "date_suggested",
  date_removed: "date_removed",
  dates_locked_changed: "dates_locked_changed",
} as const;

export type ActivityType =
  (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE];

export const SESSION_STATUS_TRANSITIONS: Record<
  string,
  string | null
> = {
  collecting: "discovering",
  discovering: "voting",
  voting: "confirmed",
  confirmed: "completed",
  completed: null,
} as const;

/** Per-shape transition overrides. venue_known skips discovering entirely. */
export const SHAPE_STATUS_TRANSITIONS: Record<
  string,
  Record<string, string | null>
> = {
  need_both: {
    collecting: "discovering",
    discovering: "voting",
    voting: "confirmed",
    confirmed: "completed",
    completed: null,
  },
  date_known: {
    collecting: "discovering",
    discovering: "voting",
    voting: "confirmed",
    confirmed: "completed",
    completed: null,
  },
  venue_known: {
    collecting: "voting",
    voting: "confirmed",
    confirmed: "completed",
    completed: null,
  },
} as const;

export const FLEXIBILITY_SCORE_MIN = 0.1;

/** Google Places price_level → estimated IDR per person */
export const PRICE_ESTIMATES: Record<number, number> = {
  1: 50_000,
  2: 100_000,
  3: 200_000,
  4: 400_000,
};

// ── AI ──────────────────────────────────────────────────────────────────────
export const AI_MODEL = "google/gemini-3-flash-preview" as const;
export const AI_TIMEOUT_MS = 10_000;

export const AI_FIT_LEVEL = {
  strong: "strong",
  decent: "decent",
  poor: "poor",
} as const;

export type AiFitLevel = (typeof AI_FIT_LEVEL)[keyof typeof AI_FIT_LEVEL];

export const MARITAL_STATUS = {
  single: "single",
  married: "married",
} as const;

export type MaritalStatus =
  (typeof MARITAL_STATUS)[keyof typeof MARITAL_STATUS];
