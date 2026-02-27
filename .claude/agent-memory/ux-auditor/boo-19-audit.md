# BOO-19 Audit Notes — Attendee Join Flow
Audited: 2026-02-27. Flow not yet implemented — design plan review only.
Full audit delivered in conversation. Summary of all findings below.

## Critical (High) Issues

1. **callbackUrl not preserved in middleware** — `middleware.ts` line 17 drops the original URL on redirect to `/login`. Every unauthenticated user who clicks a share link is permanently stranded at `/home` after auth. Fix: append `?callbackUrl=encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)` to the redirect URL, then handle in login page post-auth.

2. **"Unset = unavailable" default** — dates not explicitly toggled silently submit as `unavailable`. User gets no warning and no review step. Fix: render a distinct "Belum diisi" state visually (dashed border, grey) and add a confirmation prompt before submit if any dates remain unset: "Masih ada tanggal yang belum lu jawab — unset = Gabisa. Lanjut?"

3. **3-way segmented toggle fails mobile touch targets** — 3 segments at 44pt minimum = 132pt per card. Labels like "Bisa banget!" are too long to fit. At 10+ dates the scroll becomes unmanageable. Fix: replace with single-tap cycling pattern on the full card (unset → strongly_prefer → can_do → unavailable → unset). Full-width card = single tap target.

4. **"Skip dulu" for geolocation must always be visible** — never conditionally shown. Must appear from initial render, persist through permission dialog, persist through error state. Geolocation button handles its own loading/error states; skip button is static.

5. **sessionStorage key collision** — join wizard must use `"bookburr-join-${sessionId}"` not a global key. Multi-session users opening two join wizards in the same browser will otherwise corrupt each other's state.

## Medium Issues

6. **Budget: preset + free-text simultaneously** causes dual-modality confusion and unresolved value authority. Fix: show only presets initially; reveal custom input via "Nominal lain..." option (progressive disclosure). Custom input auto-focuses, deselects presets; preset tap clears custom input.

7. **Budget null semantics undefined** — `budget_ceiling: integer, nullable` has no documented contract. `null` must be explicitly documented as "no constraint, not zero." Add comments to schema.ts and constants.ts before implementing join action.

8. **Single date edge case** — 1 date option makes Step 1 a binary yes/no, not a scheduling vote. Detect `dateOptions.length === 1` and replace heading with "Lu bisa tanggal ini ga?" and a confirm/decline card.

9. **15+ dates: no pagination/grouping** — 30 dates = 2,160pt scroll. CTA scrolls off screen. Fix: group by week with sticky week headers; use sticky bottom bar for CTA (fixed `bottom-0 inset-x-0` with cream fade).

10. **Cross-session conflict warning missing** — PRD 6.3 specifies inline warning during date selection. After marking strongly_prefer or can_do, query for same-date votes in other sessions. Show non-blocking inline warning: "Heads up bestie, lu udah ada bukber lain di tanggal ini 👀"

11. **Submit button underperforms emotionally** — "Join Bukber!" is flat. Fix: "Gue ikut Bukber ini!" → pending: "Lagi join..." → post-submit: full-screen micro-celebration + "Nice, udah! Tinggal tunggu yang lain join ya" → route to dashboard.

## Low Issues

12. **Progress dots lack step labels** — add `labels?: string[]` prop to `WizardProgress`. Show "Tanggal / Lokasi / Budget" below dots at 10px/foreground-40.

13. **Geolocation error copy not specified** — three distinct error codes need distinct Jaksel copy: PERMISSION_DENIED = "Lu nolak akses lokasi. Tulis area lu manual aja ya"; POSITION_UNAVAILABLE = "GPS lu lagi ga aktif. Tulis nama area aja"; TIMEOUT = "Lama banget dapetinnya. Coba lagi atau tulis manual?"

14. **"rb" abbreviation** — add one-line subtitle on Step 3: "Per orang ya, bukan total 💸 (rb = ribu rupiah)" — disappears after 3s or first interaction.

15. **Copy drift from PRD Section 9** — Step 1 heading "Kapan lu bisa?" does not match PRD canonical: "Which day yang lu available, bestie?" Use PRD copy. Same drift exists in host wizard step-date-picker.tsx ("Kapan aja bisa bukber?").
