# UX Auditor Memory — BookBurr

## Key Files
- Wizard pattern: `/src/app/(wizard)/sessions/new/_components/session-wizard.tsx`
- Step components: `/src/app/(wizard)/sessions/new/_components/step-*.tsx`
- Join flow (stub only): `/src/app/(app)/sessions/[id]/join/page.tsx`
- Constants (PREFERENCE_LEVEL etc): `/src/lib/constants.ts`
- Copy reference: `/docs/prd.md` Section 9 (Jaksel copy table)
- UX patterns research: `/docs/ux-patterns.md`
- Design tokens: `/src/app/globals.css` — gold, green, cream, coral, teal

## Established Patterns (from session-wizard.tsx)
- sessionStorage key: `"bookburr-new-session"` — join wizard should use a separate per-session key
- Slide variants: x: ±300, opacity 0→1, duration 0.25s easeInOut
- History integration: `history.pushState` on goNext, `popstate` listener on goBack
- Progress bar: dots in WizardProgress component (current = wide gold, past = narrow gold/40, future = narrow foreground/15)
- Error toast: absolute bottom-6 inset-x-6, bg-coral/10 text-coral
- `if (!mounted) return null` pattern to prevent SSR hydration flash

## Jaksel Copy Patterns
- Good: "Aduh, gagal bikin bukber. Coba lagi ya", "Lu belum login nih", "Lagi bikin...", "Bikin Bukber!"
- PRD canonical copy: "Which day yang lu available, bestie?", "Budget lu per orang berapa nih? Be honest ya 💸"
- Implemented copy deviates from PRD in some places — always check prd.md Section 9 as source of truth
- The step-date-picker.tsx uses "Kapan aja bisa bukber?" — the PRD says "Which day yang lu available, bestie?" — misalignment exists in host wizard too

## Recurring Issues Found
- **Unset = unavailable risk**: The host wizard uses calendar tap-to-toggle with no explicit 3-way state. The attendee join flow (BOO-19) is planned to have 3-way toggle but the implicit default is dangerous.
- **StepOfficeLocation skip bug**: Both "Lanjut" and "Skip dulu" call `onNext` — skip doesn't differentiate from filled. Same data (empty string) flows either way. Need to decide if skip should clear or pass empty.
- **Missing cross-session conflict detection**: Middleware has no callbackUrl preservation logic — `return Response.redirect(new URL("/login", req.nextUrl))` drops the original URL. BOO-19 join flow depends on this working.
- **Touch targets on month nav arrows**: ← → buttons in step-date-picker use `px-3 py-1.5` — likely under 44pt. Arrow characters also unclear for small screens.

## Design Token Adherence
- All step components use `bg-coral` for primary CTA — correct
- `bg-gold` for selected states — correct
- `text-foreground/60` for subtitles — consistent
- `rounded-xl` on CTAs, `rounded-2xl` on cards — consistent
- White (`bg-white`) used for input fields against cream background — correct

## BOO-19 Audit (IMPLEMENTED — verified 2026-02-27)
Join flow IS live at `/src/app/(wizard)/sessions/[id]/join/`. Resolved from plan:
- sessionStorage key is `bookburr-join-${session.id}` — correct namespacing
- 3-pill segmented pattern (not cycling) used in step-date-votes.tsx — Bisa banget/Bisa/Ga
- Budget null handled as "Flexible aja" ghost button in step-budget.tsx — correct
- Middleware DOES preserve callbackUrl on redirect to login — verified in middleware.ts
- callbackUrl drops search params but preserves pathname — acceptable for join flow
Remaining issues in live join flow:
- step-date-votes.tsx: unvoted dates silently become "unavailable" in handleSubmit — no user confirmation
- step-location.tsx: "Skip dulu" passes empty string, no downstream indicator that location is missing
- "Lanjut" button on step-date-votes disabled when ALL dates are zero-voted, but if host adds 30 dates, the scroll list is very long with no sticky CTA

## BOO-20–27 Audit (plan audit — 2026-02-27)
See full audit response in session. Key blockers:
- BOO-20: Dashboard IA misses session header's host identity signal; host needs to see "host badge" not just a share button
- BOO-21: date-voting-results.tsx must handle 0-voter and 30-date edge cases; stacked bars collapse to zero width and become invisible
- BOO-22: Feed message "voted" hides WHO and for WHAT — anonymous policy creates a usability gap in activity feed
- BOO-23: discoverVenues() triggers on state transition — user has no visibility into how long discovery takes; no skeleton/loading state planned
- BOO-24: venue-vote-button.tsx — "Ikut aja" placement conflict: plan shows it as a separate component (terserah-button.tsx) but PRD says it should be inline with venue cards, not a global escape
- BOO-25: host-controls.tsx CTA "Mulai Cari Venue" requires ≥2 members — plan does not specify what the host sees when only 1 member (themselves) has joined
- BOO-25: confirm-session-sheet.tsx has no undo/back from confirmation — once tapped it fires confirmSession() immediately
- BOO-26: "New updates" toast has no dismiss interaction specified; and no max-height/scroll for activity feed overflow
- Session card (home) shows `createdAt` date — should show next candidate date or confirmed date instead
