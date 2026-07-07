# Rank Anything — Focused Pass Proposal & Two-Step Roadmap

**Date:** 2026-07-07
**Author:** Claude Fable 5
**Current state:** `big-board.html` — a genuinely polished single-file fantasy-football big board (drag ranking, tiers, filters, notes, CSV round-trip, undo/redo, autosave). Zero backend, zero sign-up. Deploy path (S3/CloudFront) documented but the product is football-only and has no sharing, no templates, no second ranking mode, and no keyboard-accessible drag.

**The standard for everything below:** each phase has explicit acceptance criteria and an automated verification gate. Nothing ships on "looks done." A feature that can't state its acceptance test doesn't enter the phase. Anything that would make the core experience slower than the budgets in §5 gets cut or deferred, not shipped-and-hoped.

---

## 1. Where this sits against competitors (and where the gap actually is)

| Competitor | What they own | Their weakness we exploit |
|---|---|---|
| **TierMaker** | The "tier list" verb; enormous SEO moat from user-created templates (millions of template landing pages) | Dated, cluttered UX; image-first (no data attributes, no filters, no notes); no ordered big-board view; no comparison mode; ranking is a toy, not a tool |
| **Ranker** | Crowdsourced "best of" lists with vote aggregation | You vote on *their* lists; no personal board ownership, no craft |
| **Letterboxd (+ Serializd etc.)** | Domain-specific ranking + social done right — the model for Step 2 | Single domain. Nobody has built "Letterboxd for ranking anything" |
| **Fan sorters** (character/kpop/anime pairwise sorters) | Pairwise "this-or-that" ranking — massively viral in fandoms | Thousands of one-off, ugly, unmaintained pages; no persistence, no profile, no general tool |
| **StrawPoll / polls** | Quick group opinion | Polls aren't rankings; no artifact you keep |

**The strategic read:** TierMaker won on *template SEO*, sorters won on *the pairwise mechanic*, Letterboxd won on *identity + social*. No product combines a professional ranking editor + template landing pages + pairwise mode + (later) social identity. That combination is the standout position, and the current codebase already has the hardest part — a ranking editor that feels professional — built.

**What does NOT differentiate us and should not absorb effort:** more filters, more themes, more CSV dialects, AI-generated rankings. The moat is editor quality × template distribution × the share loop.

---

## 2. Focused pass on the current product (pre-pivot, 1 short phase)

Do this first regardless of Steps 1–2 — it hardens the asset both steps are built on.

| # | Item | Why it clears the bar | Acceptance criteria |
|---|---|---|---|
| P0-1 | **Shareable state in the URL** (compress full board state — order, tiers, stars, notes — with lz-string into `#fragment`) | The single highest-leverage missing feature: every shared board is an acquisition channel, and it needs zero backend | Round-trip test: export → open URL in fresh profile → identical board. URL < 8KB for 300 players |
| P0-2 | **Image export** (canvas-render the board/tiers to PNG with branding footer) | Shared *images* are how rankings travel on social; TierMaker's core loop | Playwright: exported PNG exists, correct dimensions, deterministic for fixed state |
| P0-3 | **Keyboard-accessible reordering** (focus row → Space to lift → arrows to move → Space to drop; `aria-live` announcements) | Drag-only reordering is an accessibility failure and blocks the "professional tool" claim; today there is exactly one ARIA role in the file | axe: 0 critical/serious; Playwright keyboard-only spec reorders a row with zero mouse APIs |
| P0-4 | **Playwright gate** (mirroring the insta_prompt e2e pattern: drag reorder, tier insert/label, CSV round-trip, undo/redo depth, URL-state round-trip, autosave restore) | The file is 2,600 lines with no tests; both pivots refactor it heavily. Refactoring untested code is how polish dies | Suite green in CI; every P0 feature has a spec |
| P0-5 | **Ship it** — finish the documented S3/CloudFront deploy, wire the analytics placeholder | An unshipped polished product is worth exactly $0; Step 1's template bet needs live traffic data | Live URL, uptime check, analytics events: board_created, csv_import, share_url, image_export |

Explicitly **cut** from this pass: more football data columns, ADP/projections integrations, light-theme work beyond the existing toggle. Those are niche-deepening, and the strategy is niche-*escaping*.

---

## 3. Step 1 — Generalize: "rank anything" as a template-driven static site

### Architecture decision (made, not open)

Keep **zero backend, zero sign-up** — it's a genuine differentiator (instant, private, free to run) and nothing in Step 1 needs a server. But **relax "single file" to "single static bundle"**: template landing pages are the SEO play, and prerendering them requires a build step. Concretely: Vite multi-page static build; `big-board.html` is frozen as-is and keeps serving football (its brand, URL, and any inbound links stay intact — it becomes one template among many, and the reference implementation the engine is extracted from).

### 3.1 The engine: schema-driven items instead of players

The current model hardcodes `{name, team, position, age, byeWeek}`. Replace with:

```js
item:     { id, rank, name, attrs: {<schema-defined>}, starred, note, tiersAbove, tierLabel }
template: { slug, title, description, schema: [{key, label, type: "enum"|"number"|"text", filter: bool}],
            items: [...], defaultView: "board"|"tiers", og: {...} }
```

Filters, columns, and CSV headers **generate from the schema** — the existing position/team/age/bye filters become the football template's schema, not app code. Acceptance: the football template rendered through the generic engine is pixel-comparable to today's `big-board.html` (Playwright screenshot diff, ±1px layout tolerance), and its CSV round-trips unchanged.

### 3.2 New paths (each one is a product surface AND an SEO surface)

| Path | What it is |
|---|---|
| `/` | Instant start: paste a list (one item per line) → board in one keystroke; or pick a template. The "time-to-first-ranking < 10 seconds" promise is the homepage |
| `/t/<slug>` | Template landing pages, prerendered at build time with full OG/Twitter meta — this is the TierMaker moat, rebuilt with a better editor. Launch with ~25 curated, genuinely good templates across verticals (films of the decade, NBA GOATs, Pokémon gen 1, fast-food chains, programming languages, kpop groups, Marvel movies, …). Curated > user-generated at this stage: quality is the brand |
| `/sort/<slug>` | **Pairwise mode**: "this or that" choices drive a merge-insertion sort into a full ranking (~n·log n comparisons, progress bar, undo). This is the sorter-fandom mechanic as a first-class polished mode — and its result lands in the same board editor for refinement |
| `/b/#<state>` | Any shared board URL (from P0-1), now template-aware |
| `/embed/#<state>` | Read-only iframe widget for blogs/newsletters — a distribution channel competitors don't serve |

### 3.3 The three views are one state

Big-board (ordered list), tier grid (TierMaker-style), and pairwise are **views over the same board state**, switchable without data loss. That's the product sentence: *"Rank anything — drag it, tier it, or let this-or-that decide — then share it as a link or image."* Acceptance: switching views preserves order/tiers/stars/notes exactly (property-based Playwright spec).

### 3.4 Step 1 verification gate

- Playwright: template load → rank → share-URL round-trip → image export, for 3 templates including football; pairwise completes and its ranking matches the choices made (seeded deterministic run); paste-a-list creates a board in ≤ 2 interactions.
- axe 0 critical/serious on `/`, one `/t/` page, `/sort/` page.
- Perf budgets (§5) enforced via Lighthouse CI on the built output.
- SEO: every `/t/` page has unique title/description/OG image at build time; sitemap generated.

---

## 4. Step 2 — Social: from tool to identity ("Letterboxd for ranking")

**Hard gate to even start Step 2:** Step 1 live for ≥ 4–6 weeks with evidence the loop works — shared-URL opens per created board (target ≳ 0.3), and ≥ 1 template with meaningful organic search impressions. Social layered on a tool nobody shares is dead weight; this gate is the difference between a roadmap and a wish.

### 4.1 What changes architecturally

First real backend: **Supabase** (auth + Postgres + RLS — the stack already proven in insta_prompt) or Cloudflare D1/Workers if staying all-edge. Boards remain local-first: sign-up is required to *publish*, never to *rank*. The no-friction editor stays the top of the funnel forever.

### 4.2 Feature ladder (strictly in order, each with its own gate)

**S2a — Publish & identity (the minimum that creates a network)**
- Publish a board → stable URL `/u/<user>/<board>`, view counts, creator profile listing their boards.
- **Clone/remix**: one tap on any published board → your own copy to re-rank. Remix count on the original.
- **Consensus**: every template/published board aggregates its remixes into a community ranking, and every user sees their **delta vs consensus** ("you have Dune 14 spots higher than everyone else"). This is the standout feature of the whole roadmap: it's personal, argument-starting, and inherently shareable — and none of the competitors have it. The OG image for a published board shows the user's hottest takes vs consensus.
- Gate: publish→clone→consensus loop covered by integration tests; RLS verified (no cross-user writes); consensus recomputation is O(remix) incremental, not full-table.

**S2b — The social layer (only after S2a shows remix activity)**
- Follow creators; home feed = new boards + notable remixes from follows; reactions and short comments (comments on *rank positions*, not just boards — "you put THIS at #3?" is the native conversation unit).
- Weekly official prompts ("rank this week's releases") — programmatic content calendar that keeps the feed alive without depending on user creativity.
- Versus mode: send a pairwise duel link; both rankings diff side-by-side at the end.
- Gate: feed p95 < 300ms server time; report/block/moderation tooling live **before** comments open (non-negotiable — comments without moderation is a standard, well-documented failure).

### 4.3 Monetization (kept honest)
- Already-slotted ads on free web surfaces.
- Pro (later, only post-S2a): unlimited published boards, watermark-free image export, custom themes/board branding, CSV/API export of consensus data.
- Never: paywalling the core editor or selling ranking data.

---

## 5. Cross-cutting standards (apply to every phase, no exceptions)

- **Performance budgets:** static surfaces LCP < 1.5s / TTI < 1s on mid-tier mobile; board interactions (drag frame, filter apply) < 16ms/frame at 300 items; bundle < 150KB gzipped for Step 1 (the current single file is the proof it's possible).
- **Accessibility:** axe 0 critical/serious on every shipped route; all ranking mechanics keyboard-operable; `prefers-reduced-motion` respected (already a repo standard).
- **Testing:** no phase merges without its Playwright gate green. The e2e harness pattern (fixture pages, hermetic, headed-under-xvfb) is already built and proven in insta_prompt — port the pattern, don't reinvent it.
- **Design:** the existing dark, professional aesthetic is the brand; ui-ux-pro-max / frontend-design skills govern new surfaces. TierMaker's visual clutter is the anti-reference.
- **Scope discipline:** each phase's cut-list is as binding as its feature list. New ideas go to the backlog section below, not into the running phase.

## 6. Backlog (explicitly not scheduled)

Native mobile app (PWA install prompt ships in Step 1 instead; native only if S2b retention proves demand) · AI-assisted seeding of template items · live collaborative ranking sessions · Letterboxd/Spotify/IMDb importers (revisit at S2a when identity exists) · user-generated public templates (revisit once curated templates prove the SEO channel — UGC without moderation staffing is TierMaker's clutter problem imported).
