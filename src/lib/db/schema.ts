import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  real,
  date,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// § Auth ---------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date", withTimezone: true }),
  image: text("image"),
  phoneNumber: text("phone_number"),
  whatsappRegistered: boolean("whatsapp_registered").notNull().default(false),
  maritalStatus: text("marital_status"),
  dietaryPreferences: jsonb("dietary_preferences"),
  defaultCuisinePreferences: jsonb("default_cuisine_preferences"),
  favoriteVenues: jsonb("favorite_venues").notNull().default([]),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.token] }),
  ],
);

// § Sessions -----------------------------------------------------------

export const bukberSessions = pgTable(
  "bukber_sessions",
  {
    id: text("id").primaryKey(),
    hostId: text("host_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    mode: text("mode").notNull(),
    sessionShape: text("session_shape").notNull().default("need_both"),
    officeLocation: jsonb("office_location"),
    inviteCode: text("invite_code").notNull().unique(),
    status: text("status").notNull().default("collecting"),
    expectedGroupSize: integer("expected_group_size"),
    dateRangeStart: date("date_range_start"),
    dateRangeEnd: date("date_range_end"),
    datesLocked: boolean("dates_locked").notNull().default(false),
    confirmedVenueId: text("confirmed_venue_id"),
    confirmedDateOptionId: text("confirmed_date_option_id"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_bukber_sessions_invite_code").on(table.inviteCode),
    index("idx_bukber_sessions_host_id").on(table.hostId),
  ],
);

// § Session Members ----------------------------------------------------

export const sessionMembers = pgTable(
  "session_members",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => bukberSessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    referenceLocation: jsonb("reference_location"),
    proximityTolerance: real("proximity_tolerance"),
    budgetCeiling: integer("budget_ceiling"),
    sessionCuisinePreferences: jsonb("session_cuisine_preferences"),
    sessionDietaryPreferences: jsonb("session_dietary_preferences"),
    flexibilityScore: real("flexibility_score"),
    joinedVia: text("joined_via").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_session_members_session_user").on(
      table.sessionId,
      table.userId,
    ),
    index("idx_session_members_session_id").on(table.sessionId),
  ],
);

// § Date Options -------------------------------------------------------

export const dateOptions = pgTable(
  "date_options",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => bukberSessions.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    uniqueIndex("uq_date_options_session_date").on(table.sessionId, table.date),
    index("idx_date_options_session_id").on(table.sessionId),
  ],
);

// § Date Votes ---------------------------------------------------------

export const dateVotes = pgTable(
  "date_votes",
  {
    id: text("id").primaryKey(),
    dateOptionId: text("date_option_id")
      .notNull()
      .references(() => dateOptions.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => sessionMembers.id, { onDelete: "cascade" }),
    preferenceLevel: text("preference_level").notNull(),
  },
  (table) => [
    uniqueIndex("uq_date_votes_option_member").on(
      table.dateOptionId,
      table.memberId,
    ),
    index("idx_date_votes_date_option_id").on(table.dateOptionId),
  ],
);

// § Venues -------------------------------------------------------------

export const venues = pgTable(
  "venues",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => bukberSessions.id, { onDelete: "cascade" }),
    googlePlaceId: text("google_place_id"),
    name: text("name").notNull(),
    location: jsonb("location"),
    rating: real("rating"),
    priceLevel: integer("price_level"),
    cuisineType: text("cuisine_type"),
    capacity: integer("capacity"),
    compositeScore: real("composite_score").notNull().default(0),
    socialLinkUrl: text("social_link_url"),
    socialLinkPlatform: text("social_link_platform"),
    socialLinkMetadata: jsonb("social_link_metadata"),
    suggestedByMemberId: text("suggested_by_member_id").references(
      () => sessionMembers.id,
    ),
    aiInsight: jsonb("ai_insight"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_venues_session_id").on(table.sessionId),
  ],
);

// § Venue Reactions ----------------------------------------------------

export const venueReactions = pgTable(
  "venue_reactions",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => sessionMembers.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
  },
  (table) => [
    uniqueIndex("uq_venue_reactions_venue_member_emoji").on(
      table.venueId,
      table.memberId,
      table.emoji,
    ),
    index("idx_venue_reactions_venue_id").on(table.venueId),
  ],
);

// § Venue Votes --------------------------------------------------------
// One vote per member per session. venueId is nullable when isTerserah = true.

export const venueVotes = pgTable(
  "venue_votes",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => bukberSessions.id, { onDelete: "cascade" }),
    venueId: text("venue_id").references(() => venues.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => sessionMembers.id, { onDelete: "cascade" }),
    isTerserah: boolean("is_terserah").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_venue_votes_session_member").on(
      table.sessionId,
      table.memberId,
    ),
    index("idx_venue_votes_venue_id").on(table.venueId),
  ],
);

// § Activity Feed ------------------------------------------------------

export const activityFeed = pgTable(
  "activity_feed",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => bukberSessions.id, { onDelete: "cascade" }),
    memberId: text("member_id").references(() => sessionMembers.id),
    type: text("type").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_activity_feed_session_created").on(
      table.sessionId,
      table.createdAt,
    ),
  ],
);
