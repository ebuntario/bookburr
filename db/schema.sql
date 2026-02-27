-- BookBurr Database Schema
-- This is the SINGLE SOURCE OF TRUTH for the database state.
-- Always edit this file first, then construct migrations from the diff.
-- See .agents/skills/schema-first-migration/SKILL.md

-- § Auth ---------------------------------------------------------------

CREATE TABLE users (
    id text PRIMARY KEY,
    name text,
    email text UNIQUE NOT NULL,
    "emailVerified" timestamp with time zone,
    image text,
    phone_number text,
    whatsapp_registered boolean NOT NULL DEFAULT false,
    marital_status text, -- 'single' | 'married'
    dietary_preferences jsonb,
    default_cuisine_preferences jsonb,
    favorite_venues jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
    "userId" text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    PRIMARY KEY (provider, "providerAccountId")
);

CREATE TABLE verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp with time zone NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- § Sessions -----------------------------------------------------------

CREATE TABLE bukber_sessions (
    id text PRIMARY KEY,
    host_id text NOT NULL REFERENCES users(id),
    name text NOT NULL,
    mode text NOT NULL, -- 'personal' | 'work'
    office_location jsonb, -- {address: string, lat?: number, lng?: number}
    invite_code text UNIQUE NOT NULL,
    status text NOT NULL DEFAULT 'collecting', -- 'collecting' | 'discovering' | 'voting' | 'confirmed' | 'completed'
    expected_group_size integer,
    confirmed_venue_id text,
    confirmed_date_option_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_bukber_sessions_invite_code ON bukber_sessions(invite_code);
CREATE INDEX idx_bukber_sessions_host_id ON bukber_sessions(host_id);

-- § Session Members ----------------------------------------------------

CREATE TABLE session_members (
    id text PRIMARY KEY,
    session_id text NOT NULL REFERENCES bukber_sessions(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES users(id),
    reference_location jsonb, -- {lat, lng}
    proximity_tolerance real, -- work mode
    budget_ceiling integer,
    session_cuisine_preferences jsonb,
    session_dietary_preferences jsonb,
    flexibility_score real, -- computed, updated on relevant changes
    joined_via text NOT NULL, -- 'web' | 'whatsapp'
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (session_id, user_id)
);

CREATE INDEX idx_session_members_session_id ON session_members(session_id);

-- § Date Options -------------------------------------------------------

CREATE TABLE date_options (
    id text PRIMARY KEY,
    session_id text NOT NULL REFERENCES bukber_sessions(id) ON DELETE CASCADE,
    date date NOT NULL,
    created_by text NOT NULL REFERENCES users(id),
    UNIQUE (session_id, date)
);

CREATE INDEX idx_date_options_session_id ON date_options(session_id);

-- § Date Votes ---------------------------------------------------------

CREATE TABLE date_votes (
    id text PRIMARY KEY,
    date_option_id text NOT NULL REFERENCES date_options(id) ON DELETE CASCADE,
    member_id text NOT NULL REFERENCES session_members(id) ON DELETE CASCADE,
    preference_level text NOT NULL, -- 'strongly_prefer' | 'can_do' | 'unavailable'
    UNIQUE (date_option_id, member_id)
);

CREATE INDEX idx_date_votes_date_option_id ON date_votes(date_option_id);

-- § Venues -------------------------------------------------------------

CREATE TABLE venues (
    id text PRIMARY KEY,
    session_id text NOT NULL REFERENCES bukber_sessions(id) ON DELETE CASCADE,
    google_place_id text,
    name text NOT NULL,
    location jsonb, -- {lat, lng}
    rating real,
    price_level integer,
    cuisine_type text,
    capacity integer,
    composite_score real NOT NULL DEFAULT 0,
    social_link_url text,
    social_link_platform text, -- 'tiktok' | 'instagram'
    social_link_metadata jsonb,
    suggested_by_member_id text REFERENCES session_members(id), -- null = system-suggested
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_venues_session_id ON venues(session_id);

-- § Venue Reactions ----------------------------------------------------

CREATE TABLE venue_reactions (
    id text PRIMARY KEY,
    venue_id text NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    member_id text NOT NULL REFERENCES session_members(id) ON DELETE CASCADE,
    emoji text NOT NULL,
    UNIQUE (venue_id, member_id, emoji)
);

-- § Venue Votes --------------------------------------------------------
-- One vote per member per session. venue_id is nullable when is_terserah = true.

CREATE TABLE venue_votes (
    id text PRIMARY KEY,
    session_id text NOT NULL REFERENCES bukber_sessions(id) ON DELETE CASCADE,
    venue_id text REFERENCES venues(id) ON DELETE CASCADE,
    member_id text NOT NULL REFERENCES session_members(id) ON DELETE CASCADE,
    is_terserah boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (session_id, member_id)
);

CREATE INDEX idx_venue_votes_venue_id ON venue_votes(venue_id);

-- § Activity Feed ------------------------------------------------------

CREATE TABLE activity_feed (
    id text PRIMARY KEY,
    session_id text NOT NULL REFERENCES bukber_sessions(id) ON DELETE CASCADE,
    member_id text REFERENCES session_members(id), -- null for system events
    type text NOT NULL, -- 'session_created' | 'joined' | 'voted' | 'suggested_venue' | 'added_preference' | 'system_recommendation' | 'milestone' | 'confirmed'
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_feed_session_created ON activity_feed(session_id, created_at DESC);

-- § Deferred FK Constraints -------------------------------------------
-- Added after all tables are created to avoid forward-reference issues

ALTER TABLE bukber_sessions
    ADD CONSTRAINT fk_bukber_sessions_confirmed_venue
        FOREIGN KEY (confirmed_venue_id) REFERENCES venues(id),
    ADD CONSTRAINT fk_bukber_sessions_confirmed_date_option
        FOREIGN KEY (confirmed_date_option_id) REFERENCES date_options(id);

-- § Missing Indexes ----------------------------------------------------

CREATE INDEX idx_venue_reactions_venue_id ON venue_reactions(venue_id);
