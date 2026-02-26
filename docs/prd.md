# BookBurr — Product Requirements Document

**Version:** 2.0  
**Author:** Ethan  
**Date:** February 2026  
**Status:** Draft

---

## 1. Overview

BookBurr (short for *Booktabbersama*) is a lightweight web-based coordination app that eliminates the two biggest pain points of organizing iftar gatherings during Ramadan: finding a time that works for everyone and picking a place where the whole group actually wants to go.

Built as a Next.js Progressive Web App with an optional WhatsApp bot entry point, BookBurr requires no app install — users join via a shared link, QR code, or WhatsApp invite code. The onboarding is Typeform-style (one question at a time, full-screen) and stripped to the absolute minimum. The UI speaks Jaksel language throughout and treats TikTok/Instagram video links as first-class content for restaurant discovery.

**Core insight:** No app replaces WhatsApp in Indonesia — the best ones extend it. With 87%+ penetration and group-chat-driven bukber coordination already happening there, BookBurr is the structured coordination layer between "Bukber yuk!" and "See you there" that WhatsApp handles poorly.

---

## 2. Problem Statement

Organizing iftar gatherings (bukber) with friends or coworkers during Ramadan is a recurring coordination nightmare:

- **Scheduling chaos:** Aligning 5–20 people's schedules across multiple evenings devolves into endless WhatsApp polls where messages get buried.
- **Venue deadlock:** Everyone has different preferences for location, cuisine, budget, and dietary needs — and sungkan culture (reluctance to disagree) means people agree to restaurants they don't actually want.
- **Invisible constraints:** Some attendees have far less flexibility (married, live far away, tight schedules) but their constraints aren't surfaced, leading to unfair compromises.
- **Multi-group juggling:** Most people have multiple bukber commitments (work, college friends, family, community) with no central place to manage them.
- **No social proof:** Restaurant decisions happen without the TikTok/Instagram food content that Gen-Z actually trusts more than star ratings.

---

## 3. Target Users

- Indonesian professionals and students (20–35 years old) organizing bukber with friends or coworkers.
- Groups of 2–20 people per session.
- Primarily urban areas (Jakarta, Bandung, Surabaya, etc.).
- Users who participate in multiple bukber sessions across different groups simultaneously.
- Digital-native users who discover restaurants via TikTok and Instagram before Google Maps.

---

## 4. Design Principles

### 4.1 Typeform-Style Onboarding

The attendee onboarding flow presents **one question at a time**, full-screen, with smooth transitions between steps. The core flow is stripped to the absolute minimum — only what's needed to generate recommendations. Everything else is optional and can be added later via progressive disclosure.

### 4.2 Progressive Disclosure & Smart Nudging

Advanced preferences (marital status, dietary restrictions, cuisine mood, favorite venues) live in optional profile/session settings. The system uses smart nudging — waiting until enough people join, then prompting: "Oke 12 orang udah join! Sebelum gue suggest tempat, ada yang punya preference ga?" This mirrors the natural WhatsApp group dynamic.

### 4.3 Dual Entry Points

Users can join sessions via the web app (link/QR code) OR via a WhatsApp bot (invite code). Both funnels collect the same core data through conversational flows.

### 4.4 Multi-Session First

Users can participate in multiple active sessions simultaneously. The app's home screen is a session list with cross-session conflict detection, not a single session view.

### 4.5 TikTok-Forward Restaurant Discovery

Social video links (TikTok, Instagram Reels) are first-class content. Venue suggestion cards prominently feature rich video previews because in Indonesia, a 15-second food review video is the primary credibility signal that drives dining decisions.

### 4.6 Sungkan-Friendly Decision Making

All voting is anonymous until finalized. A dedicated "Ikut aja 😊" option respects Indonesian musyawarah culture where direct disagreement causes discomfort. The app navigates consensus-seeking without forcing confrontation.

### 4.7 WhatsApp-Native Distribution

Every key moment (invitation, voting reminder, decision confirmation) generates a beautifully formatted WhatsApp-shareable card. The app complements WhatsApp, never competes with it.

### 4.8 Celebration-Rich Interactions

Collective decisions should feel like shared victories. Confetti, haptics, and celebratory animations turn coordination from logistical chore into social experience.

---

## 5. Core User Flows

### 5.1 Host Creates a Session (Typeform Flow)

1. Host logs in via Google.
2. Host creates a new session, one question per screen:
   - **Q1:** "Mau bikin bukber apa nih?" → Session name (e.g., "Bukber Geng SMA 😎")
   - **Q2:** "Ini buat siapa?" → Mode: **Personal** (friends/family) or **Work** (coworkers)
   - **Q3 (Work only):** "Kantor lu dimana?" → Office location via map pin or address search
   - **Q4:** "Kapan aja yang available?" → Calendar picker, multi-select candidate dates
3. Host receives shareable link, QR code, and invite code (for WhatsApp bot).
4. **Optional (anytime):** Set default budget range, cuisine preferences, suggest initial venues with TikTok/Instagram links.

### 5.2 Attendee Joins via Web (Typeform Flow)

1. Attendee clicks link or scans QR code.
2. Attendee logs in via Google.
3. **Core onboarding — 3 questions, one at a time, full-screen:**
   - **Q1:** "Which day yang lu available, bestie?" → Multi-select from host's candidate dates. Single tap = "can do," double-tap/long-press = "strongly prefer." Visual: selected dates glow with brand color, strongly preferred dates get a ⭐ badge.
   - **Q2:** "Lu mau bukber di sekitar mana?" → Map with pin drop, address search, or "Use my location" auto-detect button. Work mode shows office pin and asks for proximity tolerance slider instead ("Mau sejauh apa dari kantor?").
   - **Q3:** "Budget lu per orang berapa nih? Be honest ya 💸" → Slider with preset ranges in Rupiah (e.g., <50rb, 50-100rb, 100-200rb, 200rb+) or custom input.
4. **Done.** Attendee lands on the session dashboard with a celebration micro-animation. Total onboarding time target: under 60 seconds.
5. **Optional enrichment (accessible anytime from session/profile):**
   - Dietary preferences (halal-certified, no seafood, vegetarian, etc.)
   - Cuisine mood (Korean BBQ, Japanese, Padang, Arab, etc.)
   - Marital status (affects flexibility weighting)
   - Phone number (unlocks WhatsApp bot + contact sharing)
   - Suggest venues from Google Places with TikTok/Instagram links
   - Save favorite venues

### 5.3 Attendee Joins via WhatsApp Bot (TangTingTung Architecture)

1. User messages the BookBurr WhatsApp bot.
2. Bot greets in Jaksel: "Halo bestie! Mau join bukber? Kirim invite code-nya dong 🙏"
3. User sends invite code.
4. Bot walks through the same 3 core questions conversationally:
   - Dates available → bot lists options, user replies with numbers (e.g., "1, 3, 5")
   - Location reference → user shares WhatsApp location pin or types address
   - Budget → user types amount or picks from quick-reply buttons
5. Bot confirms: "Done! Lu udah join [Session Name]. Gue bakal remind lu kalau ada update ya 🫡"
6. **Ongoing bot interactions:**
   - Reminders when voting opens
   - Notification when venue is confirmed
   - Multi-session management ("Ketik LIST buat liat semua bukber lu")
   - Voting via bot ("Ketik VOTE [nomor] buat vote venue")
   - Session status checks ("Ketik STATUS [session name]")

**WhatsApp architecture:** Reuses TangTingTung pattern. Phone number registration is optional but unlocks WhatsApp bot access. Users who register can see each other's contact info within shared sessions. Bot maintains context per user across multiple active sessions.

### 5.4 Progressive Venue Discovery Flow

This is the core UX innovation — how venue recommendations evolve from cold start to consensus.

#### Phase 1: System Cold Start (Core Data Only)

Once enough attendees have completed onboarding (minimum 3 or 50% of expected group), the system generates initial venue suggestions purely from geographic centroid + budget filtering + Google Places ratings. These are "smart defaults" — decent restaurants near the group's center point.

**UI:** Venue cards appear in the session feed with a system avatar: "Gue udah cari beberapa tempat yang strategis buat semua orang nih 🔍" Activity feed shows this as the first recommendation event.

#### Phase 2: Smart Nudge for Preferences

The system sends a nudge to all members: "Oke [X] orang udah join! Sebelum voting, ada yang punya preference ga? Cuisine, dietary, atau tempat yang udah di-bookmark?"

**UI:** A dismissible card appears with quick-action buttons: "Add Cuisine Preference," "Add Dietary Need," "Suggest a Venue." This mirrors the natural WhatsApp moment where someone asks "mau makan apa?"

#### Phase 3: Preferences Trickle In — Live Re-ranking

As attendees add preferences (cuisine mood, dietary restrictions), the venue list re-ranks in real-time with spring-physics position animations. Rising venues get a brief golden glow; displaced venues slide down smoothly. A small activity badge shows: "Updated based on 3 people's preferences ✨"

**UI:** The activity feed shows lightweight updates: "Sarah added Korean BBQ preference 🍖" — creating the TikTok-like sense of liveness.

#### Phase 4: Venue Suggestions with Social Proof

Attendees can suggest specific venues by:

1. Searching Google Places within the app
2. **Attaching a TikTok or Instagram video link** as social proof

When a user pastes a social media URL, the app renders a **rich preview card** (Slack-style link unfurling):

- Video thumbnail (4:5 aspect ratio) with centered play button overlay
- Creator name and avatar
- Caption snippet (2 lines max)
- Platform badge (TikTok black / Instagram gradient pink left-border accent)
- Below: Google Places data (name, rating, price range, halal badge, distance, capacity)
- Suggester attribution: "[Avatar] Aldi nemu ini di TikTok, katanya worth it banget!"
- Vote button at the bottom

Tapping the thumbnail plays video inline. Tapping the platform logo deep-links to native app.

**Technical:** Server-side fetch via TikTok oEmbed endpoint (`tiktok.com/oembed?url=`). Instagram requires Meta Graph API authentication — fall back to Open Graph scraping. Lazy-load previews, cache OG metadata on CDN, use low-res thumbnails (~50KB), never auto-download video.

#### Phase 5: Emoji Reactions (Pre-Vote Sentiment)

Before formal voting, attendees can react to venue suggestions with emoji:

- 🔥 = "pengen banget!" (really want this)
- 😐 = "biasa aja" (meh)
- 💸 = "kemahalan" (too expensive)
- 📍 = "kejauhan" (too far)

These function as low-commitment signals with Slack-style bounce-in animations. Reaction counts help surface group preferences before formal voting begins.

#### Phase 6: Formal Voting

Host triggers voting when the shortlist is ready. Each attendee gets one vote. An "Ikut aja 😊" option is always available as a non-blocking neutral vote (the "Terserah" escape valve). Votes are anonymous until the host finalizes.

**Vote interaction:** Selected venue scales up (1.0→1.15→1.0, spring easing, ~400ms), fills with brand color, emits 5-8 colored particles. Vote counter uses odometer-style rolling animation. Haptic feedback fires on iOS.

#### Phase 7: Consensus & Celebration

When a clear winner emerges (or host decides), confirmation triggers:

- Full-screen confetti (canvas-based, 1.5 seconds, auto-dismissing)
- Custom haptic pattern (three ascending pulses)
- Celebratory card: "🎉 Kita sepakat! Bukber di Arab Steak, Jumat jam 18:15!"
- One-tap WhatsApp share button
- Email + Google Calendar invite sent automatically

---

## 6. Multi-Session Management

### 6.1 Session List (Home Screen)

After login, users see a list of all active sessions sorted by next upcoming date. Each card shows: session name, mode badge (Personal/Work), attendee count with avatar stack, current status (collecting/voting/confirmed), and confirmed date/venue if applicable.

### 6.2 Session States

- **Collecting:** Host created session, attendees joining and inputting core preferences.
- **Discovering:** System has enough data to show venue suggestions; preferences and venue suggestions trickling in.
- **Voting:** Host opened formal voting on the shortlist.
- **Confirmed:** Host locked in the date and venue. Calendar invites sent.
- **Completed:** The bukber happened (or the date passed).

### 6.3 Cross-Session Awareness

The system detects date conflicts across a user's sessions and surfaces warnings: "Heads up bestie, lu udah ada bukber lain di tanggal ini 👀" This appears during date selection in onboarding and in the session dashboard.

---

## 7. Real-Time Activity Feed

The session dashboard features a compact, reverse-chronological activity feed that creates liveness — inspired by Partiful's event pages and TikTok's layered activity signals.

### 7.1 Activity Types

- "[Avatar] Sarah just joined! 🎉" (slide-in from top, 300ms fade)
- "[Avatar] Aldi suggested Arab Steak 📍" (with TikTok preview card)
- "[Avatar] Dina added Korean BBQ preference 🍖"
- "System updated venue recommendations ✨" (with system avatar)
- "[Avatar] Reza just voted 🗳️"
- "3 orang udah vote — tinggal 4 lagi!" (progress milestone)
- "🎉 Venue confirmed: Arab Steak, Jumat 18:15!"

### 7.2 Liveness Signals

- RSVP/vote count badge pulses (scale 1→1.15→1) on each increment
- Milestone confetti bursts at thresholds (5 joined, 10 joined, voting 50%, voting complete)
- Subtle haptic pulse for users with the app open when new activity arrives
- Progress ring with individual avatar segments filling as each person responds
- "Waiting on" soft accountability: pulsing ring animations on pending avatars

### 7.3 Cold Start Prevention

The page never looks empty:

- Host's creation event is the first activity entry
- Share CTAs fill the space where responses will appear
- Empty state message: "Kamu yang pertama! Share ke grup buat mulai voting 🚀" with prominent WhatsApp share button

---

## 8. Gamification & Social Mechanics

### 8.1 Cooperative Over Competitive

All gamification is cooperative (shared progress) not competitive (leaderboards). Indonesian musyawarah culture values the process of reaching agreement — individual scoring or surfacing who voted "wrong" would create resentment.

### 8.2 Core Gamification Elements (Ordered by Impact)

1. **Group progress ring** — Avatar segments fill as each person completes onboarding/votes. The single most important visual element. Empty segments labeled with friend avatars create soft social accountability.

2. **"Waiting on" list** — "Tinggal Reza sama Budi nih 👀" Names specific non-responders. Leverages Indonesian social dynamics where being the holdout creates gentle social pressure. Organizer can tap to send WhatsApp reminder.

3. **Consensus celebration** — Full-screen confetti + haptics when the group reaches a decision. The dopamine reward for collective action. Instantly shareable to WhatsApp.

4. **Commitment probability** — "Lu 73% committed. Effort level: medium sih." Surfaced playfully per attendee. Makes flexibility scoring feel fun rather than judgmental.

5. **Planning streak** — "Geng kalian udah planning 3 bukber berturut-turut! 🔥" Across multiple sessions during Ramadan. Retention mechanic leveraging loss aversion.

6. **"Traktir" badge** — Celebrates the person who treats the group. Acknowledges Indonesian treating culture with a fun visual reward and animation.

### 8.3 The "Terserah" Escape Valve

A dedicated "Ikut aja 😊" button is always available during voting. It counts as a neutral, non-blocking participation signal. This respects sungkan culture while still collecting data. Doodle's "if need be" option is the closest Western equivalent.

---

## 9. Jaksel Language UI Copy

The entire UI is written in Jaksel (Jakarta Selatan slang) — a casual mix of Bahasa Indonesia and English that feels natural to the target audience.

| Context | Copy |
| --- | --- |
| Welcome | "Yooo welcome to BookBurr! Mau plan bukber yang ga ribet? Let's go 🔥" |
| Session name prompt | "Mau bikin bukber apa nih?" |
| Mode selection | "Ini buat siapa? Friends or coworkers?" |
| Date prompt | "Which day yang lu available, bestie?" |
| Strongly prefer | "This day tuh literally the best buat gue ⭐" |
| Can do | "Yaudah, bisa sih tp ga prefer" |
| Location prompt | "Lu mau bukber di sekitar mana?" |
| Proximity prompt (Work) | "Mau sejauh apa dari kantor?" |
| Budget input | "Budget lu per orang berapa nih? Be honest ya 💸" |
| Onboarding done | "Nice, udah! Tinggal tunggu yang lain join ya ✨" |
| Nudge for preferences | "Oke [X] orang udah join! Ada yang punya preference ga?" |
| Suggest venue | "Ada venue yang lu mau suggest ga? Spill aja!" |
| Attach TikTok | "Punya link TikTok/IG-nya? Tambahin biar makin convincing 🎬" |
| Venue suggested | "[Name] nemu ini di TikTok, katanya worth it banget!" |
| Commitment score | "Lu 73% committed. Effort level: medium sih." |
| Waiting on | "Tinggal Reza sama Budi nih 👀" |
| Almost consensus | "Kita hampir sepakat! ⭐ Pilihan Favorit: [Venue]" |
| Venue confirmed | "YESSS bestie, venue-nya udah fix! Check calendar lu ya 🎉" |
| Consensus celebration | "🎉 Kita sepakat! Bukber di [Venue], [Day] jam [Time]!" |
| Married tag | "Oke noted, lu married — gue kasih extra weight buat preference lu 🫡" |
| Savings insight | "FYI opsi A literally save 50rb per orang vs opsi B" |
| No overlap | "Aduh, literally ga ada date yang overlap semua 😭 Tapi ini yang paling banyak bisa:" |
| Date conflict | "Heads up bestie, lu udah ada bukber lain di tanggal ini 👀" |
| Terserah vote | "Ikut aja 😊" |
| Planning streak | "Geng kalian udah planning 3 bukber berturut-turut! 🔥" |
| Traktir badge | "[Name] nraktir semua! Legend banget sih 👑" |
| Empty state | "Kamu yang pertama! Share ke grup buat mulai voting 🚀" |
| WhatsApp greeting | "Halo bestie! Mau join bukber? Kirim invite code-nya dong 🙏" |
| WhatsApp confirmed | "Done! Lu udah join [Session]. Gue bakal remind lu kalau ada update ya 🫡" |
| Session list | "Ini semua bukber lu yang masih active:" |
| Emoji react hint | "🔥 pengen banget · 😐 biasa aja · 💸 kemahalan · 📍 kejauhan" |
| Counting votes | "Ngitung suara... 🧮" |
| Thinking together | "Bentar ya, lagi mikir bareng... 🤔" |

---

## 10. Visual Design Direction

### 10.1 Typography

**Plus Jakarta Sans** — designed by an Indonesian foundry, with rounded, bold weight that Gen-Z finds approachable. Used for all headings and body text.

### 10.2 Color Palette (Ramadan Context)

- **Primary:** Warm gold (#D4A843)
- **Secondary:** Deep green (#1B5E3C)
- **Background:** Cream/ivory (#FFF8F0)
- **Accent 1:** Coral (#FF6B6B) — interactive elements, CTAs
- **Accent 2:** Teal (#2DD4BF) — secondary actions
- **System:** Neutral grays for non-interactive text

### 10.3 Illustration Style

Sticker-style illustrations of diverse friend groups and food items. Aligned with Indonesian visual culture (WhatsApp stickers, LINE stickers). Inclusive representation of hijab-wearing and non-hijab-wearing users.

### 10.4 Platform Accent Colors (Social Embeds)

- TikTok: Black (#000000) left-border accent
- Instagram: Gradient pink (#E1306C → #F77737) left-border accent
- Google Maps: Blue/red left-border accent

---

## 11. Microinteractions Specification

### 11.1 Vote Submission

- Visual: Selected option scales 1.0→1.15→1.0 (spring easing, ~400ms), fills with brand color, emits 5-8 colored particles drifting outward
- Counter: Odometer-style rolling animation (old number scrolls up, new slides in from below)
- Haptic: iOS `UIImpactFeedbackGenerator.medium`
- Reference: Twitter/X heart animation

### 11.2 Venue Re-ranking

- Spring-physics position animations at 300-400ms
- Rising venue gets brief golden glow
- Displaced venue slides down smoothly
- Small "↑" / "↓" indicator arrows appear briefly
- Reference: Slido/Mentimeter live poll results

### 11.3 Consensus Confirmation

- Full-screen confetti (canvas-based particle system, 1.5 seconds, auto-dismissing)
- Custom haptic pattern (three ascending pulses)
- Celebratory card with venue details
- One-tap WhatsApp share
- Reference: iMessage screen effects

### 11.4 Activity Feed Updates

- New entries slide in from top with 300ms fade
- Count badges pulse (scale 1→1.15→1) on increment
- Milestone confetti at thresholds
- Subtle haptic pulse for open-app users

### 11.5 Emoji Reactions

- Slack-style bounce-in animation on add
- Reaction counts animate with odometer roll
- Reference: Slack emoji reactions

### 11.6 Onboarding Transitions

- Full-screen questions with smooth slide-left transitions
- Selected options glow with brand color
- Completion triggers a small celebration burst
- Progress dots at bottom (3 total for core flow)

### 11.7 Waiting States

- Completed voters: checkmark with green fill animation
- Pending voters: pulsing ring animation
- Rotating playful copy underneath
- Reference: Slack's personality-infused loading messages

### 11.8 Social Link Unfurling

- URL detected via regex → skeleton shimmer card appears (1-2 seconds)
- Metadata populates with fade-in
- User can dismiss with X button
- Reference: Slack link unfurling + iMessage link previews

---

## 12. Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js (React), Tailwind CSS |
| Auth | Google OAuth 2.0 |
| Database | PostgreSQL (via Supabase or Neon) |
| APIs | Google Places API, Google Calendar API, Google Maps JavaScript API |
| Social Embeds | TikTok oEmbed API, Meta Graph API (Instagram), Open Graph fallback |
| WhatsApp Bot | WhatsApp Business API (TangTingTung architecture) |
| Notifications | Google Calendar invites, email (Resend), WhatsApp messages |
| Animations | Lottie (celebration moments), Framer Motion (UI transitions) |
| Hosting | Vercel |
| State Management | React hooks + Context (or Zustand) |
| Real-time | Supabase Realtime (for live activity feed + vote updates) |

---

## 13. Data Model (High-Level)

### Users

`id`, `google_id`, `email`, `name`, `phone_number` (optional), `whatsapp_registered` (boolean), `favorite_venues` (google_place_ids[]), `marital_status` (optional), `dietary_preferences` (optional), `default_cuisine_preferences` (optional)

### Sessions

`id`, `host_id`, `name`, `mode` (personal/work), `office_location` (lat/lng, work mode only), `invite_code` (unique), `status` (collecting/discovering/voting/confirmed/completed), `created_at`

### SessionMembers

`id`, `session_id`, `user_id`, `reference_location` (lat/lng), `proximity_tolerance` (work mode), `budget_ceiling`, `flexibility_score` (calculated), `session_cuisine_preferences` (optional), `session_dietary_preferences` (optional), `joined_via` (web/whatsapp), `joined_at`

### DateOptions

`id`, `session_id`, `date`, `created_by` (host)

### DateVotes

`id`, `date_option_id`, `member_id`, `preference_level` (strongly_prefer / can_do / unavailable)

### Venues

`id`, `session_id`, `google_place_id`, `name`, `location` (lat/lng), `rating`, `price_level`, `cuisine_type`, `capacity`, `suggested_by` (system / member_id), `composite_score`, `social_link_url` (optional), `social_link_platform` (tiktok/instagram/null), `social_link_metadata` (JSON: thumbnail_url, creator_name, caption)

### VenueReactions

`id`, `venue_id`, `member_id`, `emoji` (🔥/😐/💸/📍)

### VenueVotes

`id`, `venue_id`, `member_id`, `is_terserah` (boolean — true if "Ikut aja" vote)

### ActivityFeed

`id`, `session_id`, `member_id` (nullable for system events), `type` (joined/voted/suggested_venue/added_preference/system_recommendation/milestone/confirmed), `metadata` (JSON), `created_at`

---

## 14. Algorithms

### 14.1 Flexibility Score

```text
flexibility_score = 
  (marital_weight × 0.3) + 
  (distance_weight × 0.4) + 
  (schedule_weight × 0.3)

Where:
  marital_weight = 1.0 (single) | 0.5 (married) | 0.75 (not provided)
  distance_weight = 1.0 - (distance_from_centroid / max_distance_in_group)
  schedule_weight = available_dates / total_candidate_dates
```

Higher score = more flexible = less tiebreaker power. When optional data is missing, defaults to neutral weights. The system gracefully degrades — it never blocks on incomplete data.

### 14.2 Date Scoring

```text
date_score(d) = Σ (1 / flexibility_score(attendee)) × preference_multiplier

Where:
  preference_multiplier = 1.5 (strongly_prefer) | 1.0 (can_do) | 0 (unavailable)
```

Less flexible attendees contribute more to a date's score.

### 14.3 Venue Composite Score

```text
venue_score = 
  (proximity_score × 0.30) + 
  (rating_normalized × 0.20) + 
  (price_fit × 0.20) + 
  (cuisine_match × 0.15) + 
  (social_proof × 0.15)

Where:
  proximity_score = 1.0 - (distance_from_centroid / max_acceptable_distance)
  rating_normalized = venue_rating / 5.0
  price_fit = 1.0 if within all budgets, scaled down proportionally
  cuisine_match = % of attendees whose preferences match (1.0 if no prefs)
  social_proof = 0.5 (base) + 0.25 (has TikTok/IG link) + 0.25 (suggested by member vs system)
```

### 14.4 Progressive Refinement

Venue scores recalculate in real-time whenever new data arrives (preferences, suggestions, reactions). The recommendation list is live — not a one-time snapshot. Emoji reactions (🔥/😐/💸/📍) serve as lightweight preference signals that influence re-ranking before formal voting.

### 14.5 Geographic Centroid (Personal Mode)

```text
centroid = weighted_mean(attendee_locations)

Where weight = 1 / flexibility_score(attendee)
```

Less flexible attendees pull the centroid toward them. If a clear cluster exists (>60% of attendees within 5km), the centroid snaps to the cluster center rather than being pulled by outliers.

---

## 15. Venue Suggestion Card Specification

The venue card is the most important UI component. It stacks three layers:

### Layer 1: Social Proof (if TikTok/IG link attached)

- Video thumbnail at 4:5 aspect ratio
- Semi-transparent dark scrim with centered play button
- Creator name + avatar (small, bottom-left)
- Caption snippet (2 lines max, bottom overlay)
- Platform badge with colored left-border accent
- Tap thumbnail → play inline; tap platform logo → deep-link to native app

### Layer 2: Restaurant Metadata

- Restaurant name (bold, Plus Jakarta Sans)
- Star rating + review count
- Cuisine type tag
- Price range (Rupiah symbols: 💰💰)
- Halal badge (if applicable)
- Distance from group centroid ("12 min dari titik tengah")
- Group capacity indicator ("Muat 20 orang ✓")

### Layer 3: Social + Action

- Suggester attribution: "[Avatar] Suggested by Aldi"
- Emoji reaction bar (🔥 😐 💸 📍) with counts
- Vote button (during voting phase)
- "Ikut aja 😊" secondary option

---

## 16. WhatsApp Shareable Cards

Every key moment generates a formatted card optimized for WhatsApp sharing:

### Invitation Card

"🌙 [Name] ngajak lu bukber! [Session Name] — [Date options]. Klik link ini buat join & vote tempat: [URL]"

### Voting Open Card

"🗳️ Voting udah dibuka buat [Session Name]! Ada [X] pilihan tempat. Vote sekarang: [URL]"

### Confirmation Card

"🎉 Bukber [Session Name] udah fix! 📍 [Venue Name] 📅 [Date] ⏰ [Time] 📍 [Google Maps link]. See you there bestie!"

---

## 17. MVP Scope (v1)

### In Scope

- Session creation with Personal/Work mode (Typeform flow)
- Google login
- 3-question Typeform onboarding for attendees
- Multi-session dashboard with session states
- Date availability with "strongly prefer" / "can do"
- Location reference (manual + geolocation)
- Budget input (slider + presets)
- Progressive venue discovery flow (Phases 1-7)
- Google Places API venue matching
- Attendee venue suggestions with TikTok/Instagram rich previews
- Emoji reactions on venue cards (pre-vote sentiment)
- Anonymous voting with "Ikut aja" option
- Real-time activity feed
- Flexibility scoring (graceful degradation)
- Group progress ring with avatar segments
- "Waiting on" list with WhatsApp reminder tap
- Consensus celebration (confetti + haptics + shareable card)
- Cross-session date conflict warnings
- Email + Google Calendar notifications
- WhatsApp bot (join, core questions, reminders, voting, multi-session)
- WhatsApp shareable cards for all key moments
- Jaksel language UI throughout
- Optional profile enrichment (marital status, dietary, cuisine, phone)
- Contact sharing (phone opt-in)
- Favorite venues

### Out of Scope (v1)

- In-app venue booking
- Grab API integration
- Chat / messaging within sessions
- Payment splitting / QRIS integration
- Traktir badge
- Planning streak counter
- Multi-language support
- Native mobile app
- Swipe-to-vote (Tinder-style) — consider for v1.5
- Iftar countdown timer
- Ramadan-specific venue curation

---

## 18. Success Metrics

- **Sessions created per Ramadan season**
- **Average attendees per session**
- **Sessions per user** (multi-session adoption)
- **WhatsApp vs Web join ratio**
- **Vote participation rate** (% who actually vote)
- **"Ikut aja" vote rate** (Terserah adoption — too high may indicate UX friction)
- **TikTok/IG link attachment rate** on venue suggestions
- **Time from session creation to confirmed booking** (target: < 24 hours)
- **Optional profile completion rate**
- **Emoji reaction usage rate**
- **User retention** (returning hosts across sessions)
- **WhatsApp share rate** per session
- **NPS / qualitative feedback**

---

## 19. Future Considerations (v2+)

- **Swipe-to-vote** — Tinder-style anonymous venue voting for larger groups
- **Iftar countdown timer** — Auto-calculated from location + Islamic calendar
- **Ramadan venue curation** — "Bukber-ready" badges, takjil menus, viral Ramadan food collections
- **Planning streak** — "Geng kalian udah planning X bukber berturut-turut! 🔥"
- **Traktir badge** — Celebrating the person who treats the group
- **Payment splitting** — QRIS integration, "Traktir Semua 🎁" option
- **Grab API integration** — Delivery-based iftar options
- **In-app venue booking** — Restaurant reservation APIs
- **AI venue summaries** — Generated reviews in Jaksel from aggregated social content
- **Halal Bihalal mode** — Post-Eid gathering planning (extends beyond Ramadan)
- **Charity prompt** — "Yuk sedekah bareng 🤲" post-bukber
- **Expansion beyond Ramadan** — General group dining coordination

---

<!-- markdownlint-disable-next-line MD036 -->
*"Literally the easiest way to plan bukber, no cap. 🫶"*
