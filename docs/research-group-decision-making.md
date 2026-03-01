# Research: Group Decision-Making for Bukber Coordination

> BookBurr's core problem: groups can't reach consensus, so bukber never happens.
> The app must systemize human psychology to guide groups from chaos → decision.

---

## Table of Contents

1. [Voting Methods for Small Groups](#1-voting-methods-for-small-groups)
2. [Existing Scheduling Apps](#2-existing-scheduling-apps)
3. [Suggest + Vote Pattern](#3-suggest--vote-pattern)
4. [Decision Fatigue & Option Overload](#4-decision-fatigue--option-overload)
5. [Convergence Strategies](#5-convergence-strategies)
6. [Social Proof & Visible Votes](#6-social-proof--visible-votes)
7. [Conformity in Indonesian Culture](#7-conformity-in-indonesian-culture)
8. [The Abilene Paradox](#8-the-abilene-paradox)
9. [Sequential vs. Simultaneous Voting](#9-sequential-vs-simultaneous-voting)
10. [Cascade Effects (Music Lab)](#10-cascade-effects-music-lab)
11. [Mobile-First / Chat-Native Patterns](#11-mobile-first--chat-native-patterns)
12. [Design Principles for BookBurr](#12-design-principles-for-bookburr)

---

## 1. Voting Methods for Small Groups

### Best method: Approval Voting (multivoting)

A University of Washington study (2022) tested 93 groups and found:

- **Multivoting groups: 50% more likely** to identify the correct choice than plurality or ranked-choice
- Multivoting: 45% correct | Plurality: 31% | Ranked-choice: 32%
- The advantage emerged **before discussion even started** — distributing votes forces deeper cognitive processing

### Method comparison for BookBurr's context (5-20 people, casual decisions)

| Method | Pros | Cons | Fit |
| --- | --- | --- | --- |
| **Approval Voting** (yes/no per option) | Simple, low friction, no strategic gaming | Doesn't capture preference intensity | Strong for dates |
| **Multivoting** (distribute N votes) | Reveals intensity, forces prioritization | Slightly more complex UX | Strong for venues |
| **Ranked Choice** | Full preference ordering | Complex UX, cognitive load, no better outcomes | Weak |
| **Plurality** (pick one) | Simplest | Vote splitting, poor for >2 options | Weak |
| **Condorcet** (pairwise) | Theoretically fairest | O(n²) comparisons, confusing UX | Not viable |
| **Modified Delphi** | Iterative convergence, anonymous | Multiple rounds, slow | Partial fit |

### Confidence-Weighted Majority Voting (CWMV)

From cognitive research (Springer): give more weight to reliable/informed votes. BookBurr implements this via the `flexibility_score` — less flexible people (married, farther, fewer available dates) get MORE tiebreaker power, which is inverse-flexibility weighting that CWMV formalizes.

**Sources:**

- [UW Study: How Voting Methods Affect Group Decision-Making](https://www.washington.edu/news/2022/10/26/new-study-shows-how-voting-methods-affect-group-decision-making/)
- [Confidence Weighted Majority Voting (Springer)](https://cognitiveresearchjournal.springeropen.com/articles/10.1186/s41235-021-00279-0)
- [The Delphi Method (1000minds)](https://www.1000minds.com/decision-making/delphi-method)

---

## 2. Existing Scheduling Apps

### Availability Grid Pattern (When2Meet, LettuceMeet, Crab Fit)

**When2Meet:** Drag-to-select grid, heatmap of overlaps. Zero-account entry. But terrible on mobile — drag grid doesn't work on small screens. No calendar integration.

**LettuceMeet:** Modernized When2Meet clone with better mobile UX, same pattern.

**Crab Fit (open source):** Live-updating heatmap — "the darker the color, the more overlap." Asks *when people could possibly meet* rather than voting on preset options.

**Key insight:** Availability grid works for *time* but poorly for *venues/restaurants*. BookBurr correctly uses approval model for dates (can_do / strongly_prefer / unavailable) rather than a time grid.

### Poll Pattern (Doodle, Rallly)

**Doodle:** Organizer proposes dates → participants vote yes/maybe/no. Has reminder/nudge system and deadlines.

**Rallly (open source, Next.js):** No-account polls, real-time results. Stripped-down Doodle.

### Comparison

| App | Model | Account | Mobile UX | "Don't care" | Non-responders |
| --- | --- | --- | --- | --- | --- |
| When2Meet | Grid | No | Poor | No | None |
| LettuceMeet | Grid | No | Better | No | None |
| Crab Fit | Grid + heatmap | No | Good | No | None |
| Doodle | Poll (yes/maybe/no) | Yes | Good | "Maybe" | Reminders + deadlines |
| Rallly | Poll (yes/no) | No | Good | No | None |

**BookBurr's edge:** None of these handle "ikut aja" (genuine flexibility), none weight votes by constraint level, none have venue coordination, and none are culturally tuned for Indonesian group dynamics.

**Sources:**

- [Doodle vs When2Meet](https://doodle.com/en/when2meet/)
- [LettuceMeet Alternatives (Calday)](https://calday.com/blog/lettucemeet-alternatives)
- [Rallly](https://rallly.co/best-doodle-alternative)
- [When2Meet UX Analysis (TimeHaven)](https://timehaven.app/timehaven-vs-when2meet-availability-heatmaps)

---

## 3. Suggest + Vote Pattern

### What works

- **Seeded suggestions** (algorithm/host provides initial options) reduce the "blank page" problem
- **Member suggestions** create ownership and surface local knowledge
- **Approval voting** on the combined pool lets the group converge without proposer bias
- Dot voting (Lucidspark): "democratic and visual — each person gets a fixed number of votes"

### What fails

- **Pure crowd-sourcing** (everyone suggests, nobody curates) → option explosion, decision fatigue
- **Single proposer** (host picks, others vote) → resentment, "dictator problem"
- Feature voting analysis: "not a binding vote... simply one input into your decision-making system"

### Best: Hybrid

Algorithm seeds options → members can add → formal vote on curated shortlist. BookBurr already does this for venues. **Dates should follow the same pattern.**

**Sources:**

- [Dot Voting (Lucidspark)](https://lucid.co/blog/dot-voting)
- [Feature Voting (FeatureUpvote)](https://featureupvote.com/blog/feature-voting/)
- [Deferendum App](https://deferendum.com/)

---

## 4. Decision Fatigue & Option Overload

### Optimal number of final options: 3-5

**Hick's Law:** Decision time increases logarithmically with choices. 2→5 options adds meaningful deliberation; 5→10 adds proportionally less.

**Choice Overload (Iyengar jam study):** 24 jams attracted browsers, 6 jams generated purchases. Excessive options harm ability to choose AND diminish satisfaction.

**Miller's Law:** Working memory = 7 ± 2 items. Apple caps mobile nav at 5 tabs.

### Practical application

- **Discovering phase:** Show all venues with scoring/ranking
- **Voting phase:** Host shortlists to **3-5 venues max**
- **Date voting:** Already constrained by proposed dates (typically 3-7)

### When AI decides vs. humans decide

- **Algorithm should decide:** Aggregating quantifiable data (centroid, proximity, price fit, date overlap)
- **Humans should decide:** Subjective preferences, social dynamics, "vibes"
- **Best: Complementary AI** — algorithm narrows + recommends with reasoning, humans make final call
- Stanford GSB: "complementary algorithm offering selective recommendations made the most accurate decisions"

### Handling "Ikut Aja"

**It's valuable data, not a problem.**

1. Positive participation (not abstention) — the person IS committed to attending
2. Flexibility signal — amplifies preferences of people who care
3. Reduced tiebreaker power — consistent with `flexibility_score`
4. Display it proudly: "3 orang ikut aja" as a positive signal

**Sources:**

- [Choice Overload (Laws of UX)](https://lawsofux.com/choice-overload/)
- [Hick's Law (Laws of UX)](https://lawsofux.com/hicks-law/)
- [Miller's Law (Laws of UX)](https://lawsofux.com/millers-law/)
- [Paradox of Choice (The Decision Lab)](https://thedecisionlab.com/reference-guide/economics/the-paradox-of-choice)
- [Designing AI for Decision-Makers (Stanford GSB)](https://www.gsb.stanford.edu/insights/designing-ai-keeps-human-decision-makers-mind)

---

## 5. Convergence Strategies

### Double Diamond → BookBurr State Machine

```text
DIVERGE (collecting)  →  CONVERGE (discovering)  →  DIVERGE (voting)  →  CONVERGE (confirmed)
   Open suggestions        Algorithm narrows           Group deliberates      Decision locked
```

### Timeboxing (mandatory for async decisions)

Atlassian research: "Without a timebox, decisions linger in limbo as more input trickles in."

| Phase | Recommended Timebox | Rationale |
| --- | --- | --- |
| Collecting | 24-48 hours | Gather preferences, allow async participation |
| Discovering | 24 hours | Venue suggestions accumulate |
| Voting | 12-24 hours | Formal votes, urgency drives completion |

- Show countdown timers in UI
- Host can close any phase early if response rate is sufficient

### Progressive Narrowing

1. **Open suggestions:** Algorithm generates 10-20 venues + members add
2. **Auto-ranked shortlist:** Composite score ranks all; show top 5-7
3. **Host curates:** Selects 3-5 for formal voting
4. **Formal vote:** Approval/multivoting on shortlist
5. **Confirmation:** Host confirms winner or resolves ties

### Non-Responder Handling (tiered)

| Tier | Action | Mechanism |
| --- | --- | --- |
| 1. Passive nudge | WhatsApp/push at 50% and 75% of deadline | Social pressure |
| 2. Active nudge | "Waiting for: [names]" visible to group | Identifiability reduces loafing |
| 3. Auto-resolve | After deadline: treat as "ikut aja" | Their flexibility score increases |
| 4. Host override | Host can close phase and proceed | DRI authority |

### Satisficing > Maximizing

Paradox of Choice: "satisficers" (pick first good-enough option) are consistently happier than "maximizers."

- Show "Recommended" badge on algorithm's top pick
- Frame as "pick a great option" not "find the perfect restaurant"
- Jaksel copy: "Gak usah perfect, yang penting kumpul!"

**Sources:**

- [Async Decision-Making (Atlassian)](https://www.atlassian.com/blog/teamwork/async-practices-for-decision-making)
- [Async Decision-Making Failures (VoiceHubs)](https://www.voicehubs.io/blog/what-async-decision-making-gets-right-and-where-it-fails)
- [Social Loafing (Atlassian)](https://www.atlassian.com/blog/teamwork/avoid-social-loafing)
- [Social Loafing (Creately)](https://creately.com/guides/social-loafing/)
- [Double Diamond](https://medium.com/@i.shubhangich/design-thinking-divergence-and-convergence-cycles-3ce7a6f27815)

---

## 6. Social Proof & Visible Votes

### The core question: should we show others' date selections?

**Social proof (Cialdini, 1984):** People copy others when uncertain. A 61-million-person Facebook experiment showed social messages ("your friends voted") significantly drove behavior change.

**For scheduling:** Date availability is partially discretionary. People who are "kind of free" on March 15 will report as "available" when they see others selected it. This is both helpful (convergence) and distorting (suppresses true preferences).

### Anchoring Effect

Stanford GSB: When voters learned experts favored a position, opinions shifted by **11.3%**. "Opinions of people like me" shifted by **6.2%**. General polls shifted by **8.1%**.

**Margin size matters:** Small margins → bandwagon (join majority). Large margins → underdog effect. In groups of 5-20, margins always look large (e.g., "5 of 7 picked March 15").

### Bandwagon Effect

Online voting experiment (International Journal of Public Opinion Research): **votes for the most popular option increased by 7%** when results were visible. Voters were **unaware** they were being influenced — they underestimated their own change while overestimating others'.

**When bandwagon is GOOD:** Group needs to converge on any workable option, no objectively right answer, speed matters.

**When bandwagon is BAD:** Minority constraints are important (someone truly can't attend), early voters may pick suboptimally (cascade locks in bad choice), people stop expressing genuine preferences.

**Sources:**

- [61-million-person Facebook experiment (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3834737/)
- [Social Proof Nudges Without Clear Preferences (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7325907/)
- [How Polls Influence Behavior (Stanford GSB)](https://www.gsb.stanford.edu/insights/how-polls-influence-behavior)
- [Bandwagon Effect in Online Voting (Oxford Academic)](https://academic.oup.com/ijpor/article/33/2/412/5857291)
- [Bandwagon Effect (Psychology Today)](https://www.psychologytoday.com/us/blog/media-spotlight/201512/riding-the-bandwagon-effect)

---

## 7. Conformity in Indonesian Culture

### Asch conformity experiments

- **37% of responses** conformed to an obviously incorrect majority
- **75% of participants** conformed at least once
- Effect is **significantly stronger in collectivist cultures** (Bond & Smith 1996 meta-analysis, 17 countries)

### Indonesia is one of the most collectivist societies globally

Three cultural pillars amplify conformity:

- **Rukun (harmony):** Working in harmony is crucial; Indonesians are predisposed to be indirect, gentle, courteous — even when they disagree
- **Malu (face-saving):** Prioritizing saving face; openly disagreeing with visible consensus causes malu
- **Gotong royong (mutual cooperation):** Expectation of collective participation; individual dissent is culturally costly

### What this means for BookBurr

When Indonesian Gen-Z users see friends already voted for March 15, conformity pressure to also select March 15 — even if March 22 genuinely works better — is **stronger than in a Western user base**.

Even Jaksel-speaking, Westernized Gen-Z still operate within these deep cultural norms. The Asch effect is **amplified by friendship closeness**, and bukber groups are friend groups.

**This is the strongest argument for blind voting during the collection phase.**

**Sources:**

- [Asch Conformity (Simply Psychology)](https://www.simplypsychology.org/asch-conformity.html)
- [Collectivism in Indonesia (Lafayette)](https://scalar.lafayette.edu/individualism-and-collectivism-an-american-and-indonesian-comparison-and-analysis-on-federal-govern/a-history-of-collectivism-in-indonesia)
- [Indonesian Culture Core Concepts (Cultural Atlas)](https://culturalatlas.sbs.com.au/indonesian-culture/indonesian-culture-core-concepts)

---

## 8. The Abilene Paradox

A group collectively decides on something **nobody actually wants** because everyone assumes the others want it. Each individual assumes their private doubts are counter to the group's wishes — silence is mistaken for agreement.

### How visible votes amplify this

When early voters pick March 15 (perhaps because it was listed first), later voters see apparent consensus and suppress their own doubts. Feedback loop creates 8 people agreeing on March 15, but 5 would have preferred March 22.

### Anonymous voting as countermeasure

Research confirms anonymous voting reduces fear of speaking up and surfaces real opinions without social pressure.

### Especially relevant for Indonesian users

In a culture that prioritizes rukun and avoids direct disagreement, the Abilene Paradox is not theoretical — it's a **predictable outcome** of showing real-time vote tallies to a collectivist friend group.

**This is literally the pain point BookBurr solves: bukber never happens because the group Abilene-Paradoxes itself into inaction or a date nobody actually wants.**

**Sources:**

- [Abilene Paradox (Wikipedia)](https://en.wikipedia.org/wiki/Abilene_paradox)
- [Understanding the Abilene Paradox (Leadership IQ)](https://www.leadershipiq.com/blogs/leadershipiq/understanding-the-abilene-paradox-why-our-decisions-often-lead-us-astray)

---

## 9. Sequential vs. Simultaneous Voting

### Strongest evidence for blind collection

Emory Business School (2025), analyzing 17 years of FDA advisory committee meetings (500+ meetings):

- **Simultaneous voting: 2x less likely to be wrong** vs. sequential voting
- Produces **more vigorous discussion**, more questions, broader range of topics
- Sequential voting → shorter discussion, fewer opinions, people just follow the crowd
- Simultaneous voting → **less hierarchy**, greater confidence sharing views

### Consumer satisfaction

Malkoc & Zauberman (Journal of Consumer Research): people are **more satisfied and more committed** when options are presented simultaneously. Sequential presentation triggers "eternal quest for the best."

### Applied to BookBurr

When people vote blind and see aggregated results afterwards, they're more committed to the outcome because they expressed genuine preference without conformity pressure.

**Sources:**

- [Simultaneous Voting (Emory Business)](https://www.emorybusiness.com/2025/02/12/why-simultaneous-voting-makes-for-good-decisions/)
- [Sequential vs Simultaneous (ResearchGate)](https://www.researchgate.net/publication/228197139)

---

## 10. Cascade Effects (Music Lab)

### Salganik, Dodds & Watts (Science, 2006) — 14,341 participants

When download counts were **visible** (social influence condition):

- **Inequality** increased dramatically (popular songs got more popular)
- **Unpredictability** increased (which songs became popular varied wildly across parallel "worlds")
- Best songs rarely did poorly, worst rarely did well, but **any other result was possible**

### Follow-up: artificially inverted popularity rankings

Most songs experienced **self-fulfilling prophecies** — fake popularity became real over time.

### Applied to date selection

If March 15 gets 2 early votes by chance, cascade effect means it will likely end up with the most votes regardless of whether it's the best date. **The random choices of early voters have outsized influence.**

**Sources:**

- [Music Lab Experiment (Science)](https://www.science.org/doi/10.1126/science.1121066)
- [Leading the Herd Astray (Salganik & Watts)](https://journals.sagepub.com/doi/abs/10.1177/019027250807100404)
- [Information Cascade (Wikipedia)](https://en.wikipedia.org/wiki/Information_cascade)

---

## 11. Mobile-First / Chat-Native Patterns

### WhatsApp as primary channel

- **98% open rate** (vs. 21% email)
- **45-60% click-through rate**
- Best flow: one clear message → one RSVP link → submission → tracking

### Design principles

1. **One action per message** — don't combine dates AND venues AND tasks
2. **Button-based responses** — WhatsApp quick-reply: `[Bisa] [Gak bisa] [Ikut aja]`
3. **Deep links for complex interactions** — multi-date voting → PWA link
4. **Progress broadcasts** — "5/8 udah vote! Tinggal nunggu @Rina, @Budi"

### Telegram bot patterns

- Inline polls in chat thread
- Real-time vote updates
- Anonymous voting option
- Poll closing by creator

### Async-first principles

1. Inclusivity by default (any timezone, personality, schedule)
2. Structured input > free text (buttons, chips, sliders)
3. Explicit deadlines are mandatory
4. Document decisions automatically (activity feed)
5. Designate a DRI (host) with authority to advance

**Sources:**

- [WhatsApp for Event Planning (ChatReach)](https://chatreachmagnet.com/blog/whatsapp-automation-for-event-planning/)
- [Telegram Poll API](https://core.telegram.org/api/poll)

---

## 12. Design Principles for BookBurr

### The Meta-Principle

> Left to their own devices in a WhatsApp group, Indonesian friend groups will Abilene-Paradox themselves into inaction. BookBurr's job is to be the invisible facilitator that exploits behavioral psychology FOR the group, guiding them from chaos to decision.

### Core Design Rules

| # | Principle | Why | Implementation |
| --- | --- | --- | --- |
| 1 | **Collect blind, reveal aggregated** | Prevents cascade, anchoring, conformity (sections 6-10) | Hide selections during input; show heatmap after quorum/deadline |
| 2 | **Approval voting for dates** | 50% better outcomes than plurality/ranked (section 1) | can_do / strongly_prefer / unavailable per date |
| 3 | **"Ikut aja" is first-class participation** | Amplifies constrained members' voices (section 4) | Count as voted, boost others' preferences, display positively |
| 4 | **3-5 options for final decisions** | Choice overload kills conversion (section 4) | Host curates shortlist from algorithm's ranked list |
| 5 | **Timebox every phase** | Async decisions without deadlines never converge (section 5) | Countdown timers, auto-advance, host override |
| 6 | **Progressive narrowing (Double Diamond)** | Diverge→converge→diverge→converge prevents both option explosion and premature lock-in (section 5) | collecting → discovering → voting → confirmed |
| 7 | **Algorithm recommends, humans confirm** | Complementary AI produces best decisions (section 4) | Venue composite score + "Recommended" badge |
| 8 | **Social pressure through progress, not content** | "5/10 have voted" creates urgency; "5/10 picked March 15" creates conformity (section 7) | Progress ring with names, NOT vote tallies |
| 9 | **Inverse-flexibility weighting** | Constrained people's voices matter more for scheduling (section 1) | `flexibility_score` formula already in place |
| 10 | **Satisficing copy** | "Good enough" framing > perfectionism (section 5) | "Gak usah perfect, yang penting kumpul!" |

### The Two-Phase Voting Pattern

```text
PHASE 1: BLIND COLLECTION
├── Each person marks availability WITHOUT seeing others
├── Progress indicator: "5 of 10 have responded" (no content)
├── Creates genuine preference data
└── Duration: until quorum (60-70%) or deadline

PHASE 2: AGGREGATED REVEAL
├── Show heatmap: "7 of 10 can do this date" (no names)
├── Remaining members see the signal and converge
├── Bandwagon effect is acceptable HERE (convergence, not distortion)
└── Host can lock/confirm when satisfied
```

### Non-Responder Escalation Ladder

```text
T+0     Invitation sent
T+50%   Passive nudge: push notification / WhatsApp reminder
T+75%   Active nudge: "Grup nunggu lo nih!" + name visible in "waiting for" list
T+100%  Auto-resolve: treat non-response as "ikut aja" (flexibility score ↑)
T+any   Host override: can close phase and proceed
```

---

*Research compiled March 2026. Sources linked throughout.*
