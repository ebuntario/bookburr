# BookBurr Codebase Patterns

## File Organization
- Route groups: `(app)` has shared header layout, login pages are outside
- Actions: planned at `src/lib/actions/` (none exist yet)
- Queries: planned at `src/lib/queries/` (none exist yet)
- Component convention: `_components/` subdirectory under route for route-specific components
- Naming: lowercase-with-dashes for directories

## Database Patterns
- All IDs are `text` (nanoid generated), not UUIDs
- Timestamps: `timestamp with time zone`, Drizzle `mode: "date"`
- JSONB for flexible/optional structured data (locations, preferences, metadata)
- Schema-first workflow: edit `db/schema.sql` first, then construct migration

## Auth Pattern (NextAuth v5)
- JWT strategy with DrizzleAdapter
- Current auth.ts at `src/lib/auth.ts` — NEEDS jwt+session callbacks for user.id
- Type augmentation needed at `src/types/next-auth.d.ts`
- Middleware at `src/middleware.ts` protects all routes except /login and /api/auth

## UI Patterns
- HeroUI v3 compound components: `<Card><Card.Header><Card.Title>...`
- Buttons: always `onPress`, never `onClick`
- Inputs: `onChange` works (confirmed)
- Error page: `src/app/(app)/error.tsx` uses HeroUI Button with onPress
- Loading: `src/app/(app)/loading.tsx` uses HeroUI Spinner
- Theme colors: gold, green, cream, coral, teal (defined in globals.css @theme)
- Copy language: Jaksel slang (Indonesian/English mix)

## Neon/Drizzle Patterns
- Pool driver (supports transactions, unlike HTTP-only neon() driver)
- `db` singleton at `src/lib/db/index.ts`
- Schema imports: `import * as schema from "./schema"`
- No transactions exist in codebase yet — first usage needs connection timeout config
