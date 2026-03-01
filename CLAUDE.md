# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Status

BookBurr is in **active development**. Core scaffolding is complete: auth, database, session creation wizard, home page, and share screen are implemented. The app is runnable locally.

**What's been built (BOO-14 through BOO-32):**
- Email magic link auth (NextAuth v5 + Resend)
- Full database schema (Neon PostgreSQL + Drizzle ORM)
- Session creation wizard (typeform-style, 3–4 steps with Framer Motion transitions)
- Home page with live session list
- Success/share screen after session creation
- PWA manifest + icons
- Proxy-based route protection with `callbackUrl` preservation
- Attendee join flow — 3-step typeform wizard (date votes, location, budget)
- Session detail/dashboard page — full implementation with two-waterfall data fetch pattern
- Date voting results UI with optimistic updates + score badges
- Activity feed UI with cursor-based pagination + `activityPreview` on dashboard
- Session state machine + host controls (`collecting → discovering → voting → confirmed`)
- Profile page — profile form with marital status, dietary, cuisine preferences; stats
- Venue discovery via Google Places Nearby Search + composite scoring algorithm
- Venue cards with social embed preview, emoji reactions, vote/terserah buttons
- Real-time updates via Supabase broadcast channels (`useRealtimeSession` hook, `RealtimeDashboardWrapper`)
- Celebration overlay component (confetti on venue confirmation)
- Invite button + share panel with invite code / QR code
- Cross-session date conflict warnings in join wizard (BOO-29)
- Group progress ring with individual avatar segments + waiting-on list (BOO-30)
- Google Calendar .ics invites on session confirmation (BOO-31)
- WhatsApp shareable cards for invitation, voting open, confirmation moments (BOO-32)

**What's NOT built yet:**
- WhatsApp bot (join flow, core questions, reminders, voting, multi-session)
- TikTok/Instagram social link unfurling (schema + `social-embed-preview.tsx` exist; fetching real oEmbed metadata not wired up)
- Phone number / WhatsApp registration in profile (contact sharing)

## What This App Is

**BookBurr** ("Booktabbersama") — a Next.js PWA for coordinating Ramadan iftar gatherings (bukber) among Indonesian Gen-Z/millennials. Core problems it solves: scheduling chaos across 5-20 people, venue deadlock, and invisible constraints (flexibility varies by marital status, distance, schedule). The entire UI is written in **Jaksel slang** (casual Bahasa Indonesia + English mix).

---

## Tech Stack (Actual)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.3.4 |
| Runtime | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS v4 + `@tailwindcss/postcss` | 4.x |
| UI Library | HeroUI v3 (beta) | 3.0.0-beta.7 |
| Auth | NextAuth v5 (JWT + Resend email magic link) | 5.0.0-beta.30 |
| Database | Neon serverless PostgreSQL | `@neondatabase/serverless` 1.0.2 |
| ORM | Drizzle ORM + Drizzle Kit | 0.45.1 / 0.31.9 |
| Animations | Framer Motion | 12.34.3 |
| Data Fetching | TanStack React Query (client), RSC (server) | 5.90.21 |
| State | Zustand (installed, unused so far) | 5.0.11 |
| ID Generation | nanoid (ESM-only) | 5.1.6 |
| Email | Resend | 6.9.2 |
| Git Hooks | Husky + lint-staged | 9.1.7 / 16.2.7 |
| Package Manager | Bun | — |
| Hosting | Vercel | — |

**Planned but not yet integrated:** TikTok oEmbed, Lottie, WhatsApp Business API.

**Dev commands:**
```bash
bun install          # install dependencies
bun dev              # Next.js dev server
bun build            # production build
bun lint             # ESLint
bun db:generate      # generate Drizzle migrations from schema changes
bun db:migrate       # apply migrations to Neon
bun db:studio        # open Drizzle Studio (DB browser)
```

**Required env vars (`.env.local`):**
```
DATABASE_URL=        # Neon PostgreSQL pooled connection string (sslmode=require)
AUTH_SECRET=         # NextAuth JWT secret (generate with `openssl rand -hex 32`)
AUTH_RESEND_KEY=     # Resend API key for magic link emails
AUTH_URL=            # Full auth URL (http://localhost:3000 in dev)
```

**Optional env vars:**
```
AUTH_EMAIL_FROM=     # From address (defaults to "BookBurr <noreply@bookburr.com>")
NEXT_PUBLIC_BASE_URL= # Public base URL for share links (defaults to https://bookburr.com)
```

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                  # Layout group WITH header
│   │   ├── layout.tsx          # Shared header + avatar
│   │   ├── home/               # Session list (main page after login)
│   │   │   └── _components/    # session-card.tsx, empty-state.tsx
│   │   ├── sessions/[id]/      # Session detail (stub)
│   │   │   ├── join/           # Join session flow
│   │   │   └── success/        # Post-creation share screen
│   │   │       └── _components/ # share-panel.tsx
│   │   └── profile/            # Profile page (stub)
│   ├── (wizard)/               # Layout group WITHOUT header (full-screen)
│   │   └── sessions/
│   │       ├── new/            # Session creation wizard
│   │       │   └── _components/ # session-wizard.tsx, step-*.tsx
│   │       └── [id]/join/      # Attendee join wizard
│   │           └── _components/ # join-wizard.tsx, step-date-votes.tsx, step-location.tsx, step-budget.tsx
│   ├── api/auth/[...nextauth]/ # NextAuth route handler
│   ├── login/                  # Login + verify pages
│   ├── layout.tsx              # Root layout (fonts, providers)
│   └── globals.css             # Tailwind v4 + HeroUI + theme tokens
├── lib/
│   ├── auth.ts                 # NextAuth v5 config
│   ├── env.ts                  # Environment variable validation
│   ├── constants.ts            # All enum-like constants (as const maps)
│   ├── actions/
│   │   ├── helpers.ts          # requireAuth, mapActionError, lockSessionForUpdate, insertHostActivity
│   │   ├── sessions.ts         # createSession() server action
│   │   ├── members.ts          # joinSession() server action
│   │   ├── session-status.ts   # advanceSessionStatus(), confirmSession()
│   │   ├── date-votes.ts       # updateDateVotes()
│   │   └── venues.ts           # suggestVenue(), discoverVenues(), reactToVenue(), voteForVenue()
│   ├── algorithms/
│   │   ├── scoring.ts          # calculateFlexibilityScore, calculateCentroid, calculateVenueScore
│   │   └── venue-sub-scores.ts # calcProximityScore, calcRatingScore, calcPriceFitScore, etc.
│   ├── hooks/
│   │   ├── use-wizard.ts       # Shared wizard step/state/history hook
│   │   └── use-realtime-session.ts # Supabase Realtime subscription hook
│   ├── queries/
│   │   ├── sessions.ts         # getSessionsByUserId(), getSessionById(), getMemberByUserAndSession()
│   │   └── dashboard.ts        # getSessionWithMembers(), getDatesWithVoteCounts(), getVenuesForSession()
│   └── db/
│       ├── index.ts            # Neon Pool + Drizzle instance (singleton)
│       └── schema.ts           # Drizzle ORM schema (mirrors db/schema.sql)
├── components/
│   └── providers.tsx           # SessionProvider + QueryClientProvider
├── types/
│   ├── index.ts                # LatLng, SocialLinkMetadata interfaces
│   └── next-auth.d.ts          # NextAuth type augmentation
├── proxy.ts                   # Route protection + auth redirects
└── instrumentation.ts          # localStorage SSR polyfill (Node.js 25)
db/
└── schema.sql                  # CANONICAL database schema (single source of truth)
drizzle/
└── *.sql                       # Generated migration files (do NOT edit directly)
```

### Key Architectural Patterns

- **Route groups:** `(app)` has shared header layout; `(wizard)` is full-screen without header. Login pages are outside both groups.
- **Route-specific components:** Use `_components/` subdirectory under each route, not a global `components/` folder.
- **Server-first data fetching:** Use RSC + async server components for reads. `@tanstack/react-query` is available for client-side needs but RSC is preferred.
- **Server actions:** All mutations go through `src/lib/actions/`. Each action validates input, runs DB operations, and revalidates paths. Shared helpers (`requireAuth`, `mapActionError`, `lockSessionForUpdate`, `insertHostActivity`) live in `src/lib/actions/helpers.ts`.
- **Constants:** All domain enums live in `src/lib/constants.ts` as `as const` maps. Always import from there, never hardcode strings.
- **IDs:** All primary keys are `text` type generated with `nanoid()`, not UUIDs.
- **Timestamps:** `timestamp with time zone` in SQL, Drizzle `mode: "date"` for JS Date objects.
- **JSONB:** Used for flexible structured data (locations, preferences, metadata).

---

## Architecture Overview

### Auth Flow
Email magic link via Resend → verification token → JWT session. No OAuth/Google currently (switched from Google OAuth to email magic link in BOO-14).
- Config: `src/lib/auth.ts`
- Proxy: `src/proxy.ts` (protects all routes except `/login`, `/api/auth`)
- Type augmentation: `src/types/next-auth.d.ts`

### Session State Machine
`collecting → discovering → voting → confirmed → completed`
- **Collecting:** attendees joining, entering preferences
- **Discovering:** venue suggestions appear, real-time re-ranking as preferences trickle in
- **Voting:** host opens formal vote on shortlist
- **Confirmed:** date/venue locked, Google Calendar invites sent

### Dual Entry Points
Users join sessions via **web** (link/QR code) or **WhatsApp bot** (invite code). Both collect identical core data.

### Multi-Session First
The home screen is a session list, not a single session view. Users juggle multiple concurrent bukber groups.

### Real-Time Activity Feed
Implemented via **Supabase Realtime** broadcast channels. Server actions fire `broadcastSessionEvent()` (fire-and-forget). Client subscribes via `useRealtimeSession` hook inside `RealtimeDashboardWrapper`. Feed entries slide in from top (300ms fade). Activity preview on dashboard with cursor-based pagination for full feed.

---

## Known Issues

These are known bugs/gaps that should be fixed when working in related areas:

1. **`date_options` table missing UNIQUE constraint** — Should have `UNIQUE(session_id, date)` to prevent duplicate dates per session.
2. **`office_location` type mismatch** — Schema comment says `{lat, lng}` JSON but v1 only collects an address string in the wizard.
3. **nanoid v5 is ESM-only** — Works in Next.js but may cause issues in certain test/script contexts.

---

## Key Algorithms (implement these carefully)

### Flexibility Score
```
flexibility_score = (marital_weight * 0.3) + (distance_weight * 0.4) + (schedule_weight * 0.3)
# marital_weight: 1.0 single | 0.5 married | 0.75 not provided
# distance_weight: 1.0 - (distance_from_centroid / max_distance_in_group)
# schedule_weight: available_dates / total_candidate_dates
```
Higher score = more flexible = **less** tiebreaker power. Gracefully degrades when optional data is missing.

### Date Scoring
```
date_score(d) = SUM(1 / flexibility_score(attendee)) * preference_multiplier
# preference_multiplier: 1.5 strongly_prefer | 1.0 can_do | 0 unavailable
```

### Venue Composite Score
```
venue_score = (proximity * 0.30) + (rating_normalized * 0.20) + (price_fit * 0.20) + (cuisine_match * 0.15) + (social_proof * 0.15)
# social_proof = 0.5 base + 0.25 if has TikTok/IG link + 0.25 if member-suggested
```

### Geographic Centroid (Personal mode)
```
centroid = weighted_mean(attendee_locations, weight = 1/flexibility_score)
```
If >60% of attendees cluster within 5km, snap centroid to cluster center.

---

## Critical UX Constraints

### Social Embed Handling
- **TikTok:** server-side fetch via `tiktok.com/oembed?url=`
- **Instagram:** requires Meta Graph API auth or fall back to Open Graph scraping
- Render rich preview cards (4:5 thumbnail, play overlay, creator + caption)
- Platform accents: TikTok = `#000000` left-border, Instagram = gradient `#E1306C -> #F77737` left-border

### Voting Must Be Anonymous Until Finalized
All votes hidden from peers until host confirms. `is_terserah` on VenueVotes = "Ikut aja" neutral vote — counts as participation, never blocks consensus.

### Onboarding is Typeform-Style
One question per screen, full-screen, smooth slide-left transitions (Framer Motion). Core attendee flow is exactly 3 questions (date, location, budget). Session creation wizard is 3 steps (personal) or 4 steps (work mode adds office location). Uses `sessionStorage` for persistence + browser history integration.

### Jaksel Copy
Product experience copy (session names, CTAs, status labels, activity feed, onboarding wizard) is in Jaksel (Jakarta Selatan slang). Refer to copy tables in `docs/prd.md`.

**System flows** (auth/login, error pages, profile form labels/helpers, sign-out) use **proper Bahasa Indonesia** — not Jaksel. This keeps system-level copy accessible and professional while preserving the app's personality in product-facing surfaces.

### Visual Design Tokens
```
Primary:     #D4A843  (warm gold)
Secondary:   #1B5E3C  (deep green)
Background:  #FFF8F0  (cream/ivory)
Accent CTA:  #FF6B6B  (coral)
Accent 2:    #2DD4BF  (teal)
Font:        Plus Jakarta Sans
```
Theme tokens are defined in `src/app/globals.css` using oklch() format within `@theme`.

---

## HeroUI v3 Usage

HeroUI v3 (beta) uses different patterns than v2:
- **Compound components:** `<Card><Card.Header><Card.Title>...` (not `<CardHeader>`)
- **Event handlers:** Use `onPress` on HeroUI `<Button>`, not `onClick`. Native `<button>` elements do NOT accept `onPress` — use `onClick` on those.
- **Input onChange:** Standard `onChange` works (confirmed)
- **No Provider needed** (unlike v2)
- **Requires Tailwind CSS v4** (not v3)
- **Built on React Aria Components**
- **`Input` has no `label` prop** — use a separate `<label>` element or `<Label>` from `@heroui/react` above the `<Input>`
- **`Input` has no `startContent`/`endContent` props** — use a wrapper `<div>` with flex layout to add prefix/suffix elements
- **`Spinner` color values:** only `"current" | "warning" | "accent" | "danger" | "success"` — `"white"` is not valid

---

## MVP Scope

**In scope (v1):** Session creation, attendee onboarding, date voting, venue discovery + voting, activity feed, share/invite, WhatsApp bot.

**Out of scope for v1:** in-app booking, Grab API, chat/messaging, payment splitting/QRIS, planning streak counter, traktir badge, native mobile app, swipe-to-vote.

---

## Way of Working

### Linear Issue Tracking

All work is tracked in **Linear** under the **BookBurr** team. Before starting any task:

1. **Find or create** the corresponding Linear issue
2. **Move the issue to "In Progress"** when you begin work
3. **Commit after completing each phase/issue** — do not batch multiple phases into one commit
4. **Move the issue to "Done"** after the commit succeeds
5. **Reference the Linear issue identifier** (e.g., `BOO-5`) in the commit message

Commit message format:
```
BOO-XX: Short description of what was done

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Schema-First Database Migrations

For **any database change**, follow the schema-first migration skill at `.agents/skills/schema-first-migration/SKILL.md`:

1. **Read** `db/schema.sql` first — this is the single source of truth for the current DB state
2. **Edit** `db/schema.sql` to reflect the desired end state
3. **Construct** the migration SQL from the diff
4. **Also maintain** `src/lib/db/schema.ts` (Drizzle ORM) — keep it in sync with `db/schema.sql`
5. **Never** write a migration without updating `db/schema.sql` first
6. **Never** use migration files as reference for current schema

### Coding Conventions

- Functional, declarative TypeScript — no classes
- Interfaces over types; avoid TS enums, use `as const` maps from `src/lib/constants.ts`
- Lowercase-with-dashes for directories (e.g., `components/session-card/`)
- Named exports for components
- Minimize `"use client"` — favor React Server Components
- Wrap client components in `<Suspense>` with fallbacks
- Mobile-first responsive design
- HeroUI v3 compound components for UI primitives
- Plus Jakarta Sans font
- Route-specific components in `_components/` subdirectories, not global `components/`
- Server actions in `src/lib/actions/`, queries in `src/lib/queries/`
- All domain constants imported from `src/lib/constants.ts`

### Frontend Design Philosophy

Avoid generic "AI-generated" UI. No symmetrical hero sections, no glassmorphism without reason, no default Tailwind shadows everywhere. Instead:
- **Layout:** Strong asymmetry, overlapping elements, unusual grid breaks
- **Color:** Commit to the gold/green/cream palette with coral as high-contrast accent. Break rules intentionally.
- **Motion:** Micro-interactions, scroll-triggered reveals, Framer Motion spring physics
- **Personality:** Jaksel energy — playful, irreverent, youthful Indonesian vibe in every pixel
- **Typography:** Plus Jakarta Sans with confident weight variation
