# V1 Launch Mega Plan — Remaining Coding Gaps

**Date:** 2026-08-06
**For:** a fresh Claude Code session (Opus recommended given the scope) picking
this up in one sitting.
**Status:** planning only — nothing in this doc has been implemented yet.

---

## Paste-ready prompt for that session

```
Read docs/V1_LAUNCH_MEGA_PLAN.md in full before doing anything else. It's a
prioritized list of every remaining coding gap between the current state and
a full v1 deploy of Rank Anything, based on a live audit (not assumptions —
things were actually screenshotted/measured before being listed here).

Work the gaps in the priority order given (Gap 1 first — it's a correctness
bug, not polish: drag-to-reorder is very likely non-functional on real mobile
touch devices across all of site/'s generic engine, not just one view).

Ground rules from CLAUDE.md (read it too):
- big-board.html is FROZEN: bug fixes only, no new features, no touching it
  for anything in this doc unless a gap explicitly says otherwise.
- site/ stays zero bundler, zero npm runtime dependency, native ES modules.
- Nothing merges with the e2e gate red. Run `cd e2e && npm test` (or
  `node ../site/build.mjs && npx playwright test`) before calling any gap
  done. Add new specs for new behavior — don't just eyeball it.
- Use Playwright screenshots (mcp__playwright__browser_* tools, or the
  Playwright test runner's screenshot capability) to visually verify mobile
  AND desktop before/after for any layout-affecting change. This was
  explicitly asked for last session and should stay standard practice here.
- Invoke Skill(scope-creep-guard) before starting each gap. Invoke
  Skill(mobile-interaction-patterns) before Gap 1 specifically — it exists
  because of the exact class of bug Gap 1 describes.
- Log each gap's work in logging/progress_log.md per existing entry format
  (see Entries 010-015 for the pattern this repo expects).
- Do not commit or push without explicit confirmation.

Do NOT touch, propose, or attempt any of the "Explicitly excluded" items
below — they're deferred by deliberate user decision, not oversight.
```

---

## Explicitly excluded (do not touch)

These are real remaining items but were intentionally deferred by the user
in prior sessions — they are decisions waiting on the user, not coding work
waiting on an agent:

- **Custom domain purchase** (`rankanything.net` via Cloudflare Registrar) —
  costs real money, user does the actual purchase click. See
  `docs/DOMAIN_DECISION.md` / `docs/NEXT_SESSION_HANDOFF.md`.
- **AdSense application + privacy policy/consent banner** — gated on the
  domain purchase above (a bare `.pages.dev` subdomain hurts approval odds).
- **Analytics wiring (GA4)** — the `track()` calls already exist end-to-end
  in both `big-board.html` and `site/src/js/engine.js`, already shaped for
  GA4's `window.dataLayer` format. All that's missing is a real GA4
  Measurement ID, which the user doesn't have yet ("save that for later").
  When they do, this is a genuinely small task: drop the `gtag.js` snippet
  into the `<!-- ANALYTICS PLACEHOLDER -->` blocks in `big-board.html`,
  `site/src/pages/index.html`, `board.html`, `sort.html`, `embed.html`
  (check for the comment in each), and add the ID as a build-time env var
  for `site/` (mirroring the existing `SITE_ORIGIN` pattern in
  `site/build.mjs`) since `site/` has a build step and `big-board.html`
  doesn't.
- **Player headshots, live in-season stats** — both explicitly scoped to v2
  in `docs/FOOTBALL_V1_LAUNCH_GAPS.md` (licensing/reliability risk for
  headshots; needs a paid stats API or the same build-time-refresh
  infrastructure as ADP for live stats). Not v1.
- **ESPN/Yahoo rankings scrape** — ruled out entirely, not just deferred.
  Both sites' `robots.txt` explicitly `Disallow: /` for `anthropic-ai`
  (Yahoo also names `Claude-Web`/`ClaudeBot`). Do not attempt this via a
  spoofed User-Agent or any other route-around — that's evasion of a named
  access control, not a legitimate gap to close.

---

## Gap 1 (highest priority — likely a correctness bug, not polish): mobile UX pass for `site/`'s generic engine

### What's wrong, verified live (not assumed)

`big-board.html` got a full mobile UX audit and fix in Entries 010-011
(`docs/MOBILE_UX_PLAN.md`) specifically because native HTML5 drag-and-drop
(`draggable="true"` + `dragstart`/`dragover`/`drop` events) **does not fire
on touch devices at all** — it's a platform limitation, not a bug in one
implementation. `big-board.html` was fixed with a hand-rolled
`touchstart`/`touchmove`/`touchend` handler gated to a drag-handle.

`site/src/js/views/board.js` and `site/src/js/views/tiers.js` — the generic
engine that now powers 13 templates plus custom boards — use the exact same
native `draggable` attribute and drag events, **with zero touch handlers**
(verified: `grep -n "touchstart\|touchmove\|touchend" site/src/js/views/*.js`
returns nothing). This means drag-to-reorder — the core interaction of a
ranking tool — is very likely **completely non-functional on a real phone**
across every `site/` template and custom board. Keyboard reorder exists as a
fallback (Space/arrows) but that's an accessibility path, not the natural
mobile-touch interaction users will actually reach for.

Additionally, content-rich templates overflow horizontally at mobile widths.
Measured directly (not assumed) at a 375px viewport:
- `nba-goats` (1 enum field, no number fields): `scrollWidth` 376 vs 375
  viewport — effectively fine.
- `fantasy-football-2026` (2 enum fields + 2 number fields — the template
  built two sessions ago): `body.scrollWidth` 570 vs 375 viewport,
  `.board-table` itself 550px wide. Real, visible horizontal page scroll.

`site/src/css/app.css` has exactly one mobile breakpoint
(`@media (max-width: 640px)`, line 625) and it only touches `.duel`
(pairwise view) and `.tier-lane` (tiers view) — **the main board table has
no responsive treatment at all.**

### Why this is Gap 1, not lower priority

This isn't cosmetic. If drag-to-reorder doesn't work on touch, the core
product doesn't work for anyone on a phone — which is most of the traffic a
ranking/sharing product should expect (P0 in the roadmap already flags
mobile/social as the primary use case). This should be treated as a
correctness bug on the level of "the button doesn't work," not a polish
pass, even though the fix shape (CSS + a touch handler) will look like the
`big-board.html` mobile pass.

### Suggested approach

Don't guess — `docs/MOBILE_UX_PLAN.md` is the proven template for this exact
class of work on this exact codebase. Repeat its structure for `site/`:

1. **Audit phase first, with live Playwright verification** at 320/375/414px
   on at least: `/t/fantasy-football-2026/` (worst case, most columns),
   `/t/nba-goats/` (simplest case), `/sort/nba-goats/` (pairwise), `/`
   (home/paste flow), `/embed/#...` (read-only). Screenshot each. Don't
   assume the fix needed — e.g. touch reorder might need a full hand-rolled
   handler like `big-board.html` got, or it might be simpler/harder
   depending on how `board.js`'s existing `dragstart`/`dragover`/`drop`
   listeners interact with a new touch layer. Verify before deciding.
2. Likely fix shape, subject to what the audit finds:
   - A touch handler in `board.js` (and `tiers.js` for chip dragging)
     mirroring `big-board.html`'s handle-gated `touchstart`/`touchmove`/
     `touchend` approach — probably needs its own drag handle affordance in
     the row template, not full-row touch-drag (full-row drag on touch
     fights with scroll, which is exactly what `big-board.html`'s audit
     found and fixed by gating to a handle).
   - Responsive table collapse or horizontal-scroll containment for content
     rich templates — check `mobile-interaction-patterns` skill's guidance
     on table-collapse strategies (card view vs. horizontal-scroll-container
     vs. column-hiding) rather than picking one arbitrarily.
   - Touch-target sizing audit (44px minimum) for row action buttons
     (star/note/delete), the new sort-select, and filter chips at mobile
     widths — `big-board.html`'s Entry 010 pass is the reference for what
     "done" looks like.
3. **New e2e coverage**: `e2e/tests/bigboard-mobile.spec.ts` is the pattern
   to port — a new `e2e/tests/engine-mobile.spec.ts` (or similar) covering
   the generic engine's board/tiers/pairwise views at mobile viewports, not
   just visual screenshots. Include an explicit touch-drag-reorder test
   (Playwright supports touch simulation via `page.touchscreen` or
   `dispatchEvent` for `touchstart`/`touchmove`/`touchend` — check how
   `bigboard-mobile.spec.ts`'s "touch reorder is gated behind the drag
   handle" test does it and reuse the pattern) so this can't silently
   regress again.
4. **Screenshot proof required**: before/after Playwright screenshots at
   320/375/414/768/1024px for at least the board view and one template with
   many columns, plus a desktop screenshot at the same states to confirm
   zero desktop regression (this is exactly what was asked for when this
   plan was requested — carry it into execution, not just this planning
   doc).
5. Full e2e suite must stay green throughout, including the existing
   `bigboard-mobile.spec.ts` (make sure nothing in shared CSS/engine code
   leaks a regression into the frozen football board).

### Acceptance criteria

- Touch-simulated drag-to-reorder works on `site/`'s board view and tiers
  view, verified by an e2e test that actually dispatches touch events (not
  just "the CSS looks different now").
- Zero horizontal page scroll at 320/375/414px on every existing template
  (all 13) plus custom boards — verified programmatically
  (`body.scrollWidth <= clientWidth`), not eyeballed on one template.
- All interactive controls meet 44px touch targets at mobile widths.
- axe: 0 critical/serious at the same mobile viewports (extend
  `a11y.spec.ts` or add a mobile-specific pass).
- Full e2e suite green, including a new mobile spec file.
- Before/after screenshots (mobile + desktop) attached to the session's
  final summary, per the user's explicit ask.

---

## Gap 2: Performance / Core Web Vitals baseline

### What's missing

Launch Gap #8 in `docs/FOOTBALL_V1_LAUNCH_GAPS.md`, and referenced in
`docs/RANK_ANYTHING_ROADMAP.md` §3.4 ("Perf budgets enforced via Lighthouse
CI on the built output") and §5 ("static surfaces LCP < 1.5s / TTI < 1s on
mid-tier mobile; bundle < 150KB gzipped for Step 1"). No Lighthouse run,
budget check, or CI gate exists anywhere in the repo today — the e2e suite
covers correctness and accessibility, not performance.

### Suggested approach

1. Run Lighthouse (CLI, `npx lighthouse` against the built `site/dist`
   served locally — same `e2e/server.mjs` static server works fine for
   this) against: `/`, `/football/`, one `/t/` page, `/sort/` page. Record
   actual numbers — don't assume "static site = automatically fast."
2. Compare against the roadmap's stated budgets (LCP < 1.5s, TTI < 1s,
   bundle < 150KB gzipped). Fix what's over budget. Two known Google Fonts
   CDN dependencies exist in every page shell
   (`fonts.googleapis.com/css2?family=DM+Sans...`) — that's a real,
   measurable render-blocking cost worth checking first since it's on
   every single page, football included.
3. If a real regression is found, fix it — don't just document it and move
   on. If everything's already within budget, still write up the numbers
   somewhere durable (a short doc or a progress_log entry) so "did we check
   performance" isn't an open question again next session.
4. Decide whether to wire this into an ongoing gate (e.g., a Lighthouse CI
   step in the e2e run) or leave it as a one-time baseline check — this is
   a real scope decision, flag it rather than silently picking one.

### Acceptance criteria

- Actual Lighthouse scores/metrics recorded for the 4 surfaces above,
  compared explicitly against the roadmap's stated budgets.
- Any budget violation found gets fixed, with a before/after number.
- Findings logged in `logging/progress_log.md`.

---

## Gap 3 (small, opportunistic): stale doc counts

Minor, but should be swept up while other e2e files are being touched for
Gap 1 anyway: `e2e/README.md`'s coverage table says "23 tests" — the suite
is actually at 37 (and will grow further after Gap 1's new mobile specs).
Update the count and the per-spec bullet list to match current reality once
Gap 1's new spec file(s) land. Not worth a dedicated session on its own —
fold it into Gap 1's wrap-up.

---

## What's explicitly NOT a gap (already verified done, don't redo)

To save the next session from re-auditing things already confirmed working
this cycle:

- Mobile UX for `big-board.html` specifically — done (Entries 010-011).
- OG share image + export watermark — done (Entry 012), ships correctly in
  the build.
- Notes → detail modal — already implemented in `site/`'s engine (discovered
  during this cycle, not built — see Entry 013's note on this).
- Real age/team/bye-week data for `big-board.html`'s default players, with a
  rerunnable refresh script — done (Entry 013).
- Build-time ADP fetch + a real consensus-vs-ADP ranking toggle in `site/`'s
  engine, including a generalized "sort by number field" control and
  multi-enum-column rendering — done (Entries 014-015).
- Accessibility (axe 0 critical/serious) on all shipped desktop routes —
  already enforced in `a11y.spec.ts`. (Gap 1 extends this to mobile
  viewports specifically, which is new, not a redo.)
