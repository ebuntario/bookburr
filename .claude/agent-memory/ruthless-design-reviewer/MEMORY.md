# BookBurr Design Review Memory

## Project Architecture
- Next.js 15 App Router + React 19 + Tailwind CSS v4 + HeroUI v3 (beta)
- Auth: NextAuth v5 (JWT strategy, email magic link via Resend, DrizzleAdapter)
- DB: Neon serverless Postgres via `@neondatabase/serverless` Pool + Drizzle ORM
- Canonical schema: `db/schema.sql` (schema-first migration workflow)
- Drizzle schema: `src/lib/db/schema.ts`
- Constants/enums: `src/lib/constants.ts` (as const maps, not TS enums)
- Types: `src/types/index.ts`

## Critical Patterns
- Server actions: `db.transaction()`, write `activity_feed` in same tx, return `{ok: true/false}` discriminated unions
- TOCTOU prevention: re-check session status inside transaction (see `members.ts` L68-81)
- PG error 23505 handling for UNIQUE constraint violations (see `members.ts` L143, `sessions.ts` L134)
- HeroUI v3: compound components, `onPress` not `onClick`, no Provider needed
- RSC page.tsx does `Promise.all([auth(), params])`, access control, then renders client components in `<Suspense>`
- `@tanstack/react-query` + `SessionProvider` in providers.tsx, RSC preferred for reads
- QueryClient created with NO custom config (no staleTime, gcTime) in `providers.tsx`
- `env.ts` uses lazy getters -- does NOT validate at startup, only on first access

## Schema Details (as of 2026-02-27)
- `venue_votes` UNIQUE on (venue_id, member_id) -- one vote per venue per member, NOT one vote per session
- `venue_reactions` UNIQUE on (venue_id, member_id, emoji) -- allows multiple emojis per member per venue
- `activity_feed.member_id` is nullable (for system events)
- `bukber_sessions` does NOT yet have confirmed_venue_id or confirmed_date_option_id
- `session_members.flexibility_score` is nullable real (stored, not computed on-the-fly)
- No index on `venue_reactions.venue_id` -- potential perf issue for reaction count queries
- `date_options` HAS `UNIQUE(session_id, date)` constraint

## Known Issues
- `office_location` schema comment says `{lat, lng}` but v1 only collects address string
- nanoid v5 is ESM-only -- works in Next.js but may cause issues in test/script contexts
- Missing ACTIVITY_TYPE entries for status transitions ("status_changed" not in constants)

## Recurring Review Themes
- Server actions need runtime validation of all inputs (Zod or manual)
- Always use existing constants from `src/lib/constants.ts`
- Date serialization: always ISO strings "YYYY-MM-DD", never Date objects across boundaries
- Race conditions on UNIQUE constraints: handle via INSERT ON CONFLICT or catch PG 23505
- TOCTOU on status checks: always re-check inside the transaction
- JSONB column shapes must be defined as TypeScript interfaces upfront

## Reusable Code Locations
- STATUS_CONFIG + MODE_ICON: `src/app/(app)/home/_components/session-card.tsx` L16-33
- slideVariants: `src/app/(wizard)/sessions/new/_components/session-wizard.tsx` L57-67
- WizardProgress: `src/app/(wizard)/sessions/new/_components/wizard-progress.tsx`
- SharePanel: `src/app/(app)/sessions/[id]/success/_components/share-panel.tsx`
- getSessionById: `src/lib/queries/sessions.ts` L34-42
- RSC auth+params parallel: `src/app/(app)/sessions/[id]/success/page.tsx` L11

## File Structure
- Actions: `src/lib/actions/` (sessions.ts, members.ts)
- Queries: `src/lib/queries/` (sessions.ts)
- Route components: `_components/` subdirectory under each route
- Wizard group: `src/app/(wizard)/` -- full-screen, no header
- App group: `src/app/(app)/` -- shared header layout
