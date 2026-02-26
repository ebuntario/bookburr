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
  joined: "joined",
  voted: "voted",
  suggested_venue: "suggested_venue",
  added_preference: "added_preference",
  system_recommendation: "system_recommendation",
  milestone: "milestone",
  confirmed: "confirmed",
} as const;

export type ActivityType =
  (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE];

export const MARITAL_STATUS = {
  single: "single",
  married: "married",
} as const;

export type MaritalStatus =
  (typeof MARITAL_STATUS)[keyof typeof MARITAL_STATUS];
