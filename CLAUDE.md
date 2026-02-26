# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Status

BookBurr is in **pre-development phase**. The repository currently contains only planning documents (`docs/prd.md`, `docs/ux-patterns.md`). No code exists yet.

## What This App Is

**BookBurr** ("Booktabbersama") — a Next.js PWA for coordinating Ramadan iftar gatherings (bukber) among Indonesian Gen-Z/millennials. Core problems it solves: scheduling chaos across 5–20 people, venue deadlock, and invisible constraints (flexibility varies by marital status, distance, schedule). The entire UI is written in **Jaksel slang** (casual Bahasa Indonesia + English mix).

---

## Planned Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React), Tailwind CSS |
| Auth | Google OAuth 2.0 |
| Database | PostgreSQL via **Neon** (serverless Postgres) |
| Realtime | Supabase Realtime (for live activity feed + vote updates) |
| APIs | Google Places, Google Maps JS, Google Calendar |
| Social Embeds | TikTok oEmbed, Meta Graph API (Instagram), Open Graph fallback |
| Animations | Framer Motion (UI transitions), Lottie (celebration moments) |
| State | React hooks + Context or Zustand |
| Notifications | Google Calendar invites, Resend (email), WhatsApp messages |
| WhatsApp Bot | WhatsApp Business API |
| Hosting | Vercel |

**Expected dev commands once scaffolded:**
```bash
bun install         # or npm install
bun dev             # Next.js dev server
bun build           # production build
bun lint            # ESLint
bun test            # Jest / Vitest
```

**Required env vars (create `.env.local`):**
```
DATABASE_URL=        # Neon PostgreSQL connection string (pooled, sslmode=require)
```

---

## Architecture Overview

### Dual Entry Points
Users join sessions via **web** (link/QR code) or **WhatsApp bot** (invite code). Both collect identical core data. The WhatsApp bot architecture follows the "TangTingTung" pattern — maintain per-user context across multiple active sessions.

### Session State Machine
`collecting → discovering → voting → confirmed → completed`
- **Collecting:** attendees joining, entering preferences
- **Discovering:** venue suggestions appear, real-time re-ranking as preferences trickle in
- **Voting:** host opens formal vote on shortlist
- **Confirmed:** date/venue locked, Google Calendar invites sent

### Multi-Session First
The home screen is a session list, not a single session view. Users juggle multiple concurrent bukber groups. Cross-session date conflict detection is required at the data layer.

### Real-Time Activity Feed
Powered by **Supabase Realtime**. Feed entries slide in from top (300ms fade). Vote counts animate with odometer-style rolls. Milestone thresholds trigger confetti bursts. This feed is the primary liveness signal — it should never appear empty (host creation event is always the first entry).

---

## Key Algorithms (implement these carefully)

### Flexibility Score
```
flexibility_score = (marital_weight × 0.3) + (distance_weight × 0.4) + (schedule_weight × 0.3)
# marital_weight: 1.0 single | 0.5 married | 0.75 not provided
# distance_weight: 1.0 - (distance_from_centroid / max_distance_in_group)
# schedule_weight: available_dates / total_candidate_dates
```
Higher score = more flexible = **less** tiebreaker power. Gracefully degrades when optional data is missing — never block on incomplete data.

### Date Scoring
```
date_score(d) = Σ (1 / flexibility_score(attendee)) × preference_multiplier
# preference_multiplier: 1.5 strongly_prefer | 1.0 can_do | 0 unavailable
```
Less flexible attendees count more toward date selection.

### Venue Composite Score
```
venue_score = (proximity × 0.30) + (rating_normalized × 0.20) + (price_fit × 0.20) + (cuisine_match × 0.15) + (social_proof × 0.15)
# social_proof = 0.5 base + 0.25 if has TikTok/IG link + 0.25 if member-suggested (not system)
```
Recalculates in real-time as preferences/reactions arrive — not a one-time snapshot.

### Geographic Centroid (Personal mode)
```
centroid = weighted_mean(attendee_locations, weight = 1/flexibility_score)
```
If >60% of attendees cluster within 5km, snap centroid to cluster center rather than letting outliers pull it.

---

## Core Data Model

```
Users: google_id, email, name, phone_number?, whatsapp_registered, favorite_venues[]
Sessions: host_id, name, mode(personal|work), office_location?, invite_code, status
SessionMembers: session_id, user_id, reference_location, budget_ceiling, flexibility_score, joined_via(web|whatsapp)
DateOptions: session_id, date
DateVotes: date_option_id, member_id, preference_level(strongly_prefer|can_do|unavailable)
Venues: session_id, google_place_id, composite_score, social_link_url?, social_link_platform(tiktok|instagram|null), social_link_metadata(JSON)
VenueReactions: venue_id, member_id, emoji(🔥|😐|💸|📍)
VenueVotes: venue_id, member_id, is_terserah(boolean)
ActivityFeed: session_id, member_id?, type, metadata(JSON), created_at
```

---

## Critical UX Constraints

### Social Embed Handling
- **TikTok:** server-side fetch via `tiktok.com/oembed?url=`
- **Instagram:** requires Meta Graph API auth — plan for this or fall back to Open Graph scraping
- Render rich preview cards (4:5 thumbnail, play overlay, creator + caption), never auto-download video
- Lazy-load previews, cache OG metadata on CDN, use ~50KB low-res thumbnails initially

### Voting Must Be Anonymous Until Finalized
All votes hidden from peers until host confirms. The `is_terserah` flag on VenueVotes marks the "Ikut aja 😊" neutral vote — counts as participation, never blocks consensus.

### Onboarding is Typeform-Style
One question per screen, full-screen, smooth slide-left transitions. Core attendee flow is exactly 3 questions (date, location, budget). Target completion: under 60 seconds. Do not add required steps.

### Jaksel Copy
All UI copy is in Jaksel (Jakarta Selatan slang). Refer to the copy table in `BookBurr_PRD_v2.md` Section 9 for the full string set. Do not substitute with standard Bahasa Indonesia or English.

### Visual Design Tokens
```
Primary:     #D4A843  (warm gold)
Secondary:   #1B5E3C  (deep green)
Background:  #FFF8F0  (cream/ivory)
Accent CTA:  #FF6B6B  (coral)
Accent 2:    #2DD4BF  (teal)
Font:        Plus Jakarta Sans
```
Platform accents for embed cards: TikTok = `#000000` left-border, Instagram = gradient `#E1306C → #F77737` left-border.

---

## MVP Scope

**In scope (v1):** Everything in `BookBurr_PRD_v2.md` Section 17 in-scope list, including full WhatsApp bot.

**Explicitly out of scope for v1:** in-app booking, Grab API, chat/messaging, payment splitting/QRIS, planning streak counter, traktir badge, native mobile app, swipe-to-vote.
