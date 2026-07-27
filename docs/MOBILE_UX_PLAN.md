# Big Board — Mobile UX Fix Plan (Launch Gap #1)

**Date:** 2026-07-25
**Status:** IMPLEMENTED 2026-07-25 (Phases 0–5). See §5 results and the
residual note on a mobile filter drawer (deferred to `site/`).
**Scope:** `big-board.html` only. This is Launch Gap item 1 ("Truly professional
mobile UX") from `FOOTBALL_V1_LAUNCH_GAPS.md`. Per that doc's frozen-file
ruling, this stays a **bug fix** (existing mobile behavior is broken, not a
new feature) so it's in-bounds for the frozen file per `CLAUDE.md`.

---

## 1. Audit — verified, not assumed

Loaded a local server and drove real Playwright at 375×812 (iPhone SE/13
mini width) against `big-board.html` as-is. Findings below are measured, not
guessed.

### Finding A — Page-wide horizontal scroll (CRITICAL)
`document.body.scrollWidth` = **774px** on a **375px** viewport. `.app` and
`.board`/`table` render at ~728–730px regardless of viewport width. Root
cause: `.page`'s grid collapses to `1fr` at 980px (`big-board.html:951`), but
nothing constrains `.app`'s or `.board`'s width — they size to their content
(a 10-column table with a 160px-min-width name column), so the grid track
itself stretches, dragging the whole page wider than the viewport. This is
the exact anti-pattern flagged in `ui-ux-pro-max`'s Priority-5 checklist
("no horizontal scroll", `horizontal-scroll` rule).

### Finding B — Table columns cut off, not collapsed (CRITICAL)
Confirmed visually: Team/Age/Bye/Draft/Note/Star columns run off the right
edge of the viewport with no way to reach them (no scroll container, no
collapse). This matches `FOOTBALL_V1_LAUNCH_GAPS.md` item 1's existing
diagnosis ("filter panel and secondary table columns just get narrower
rather than collapsing") — narrower was actually generous; verified behavior
is content getting truncated off-screen inside a page that itself
overflows.

### Finding C — Touch drag works, but HIJACKS list scrolling (CRITICAL) — corrected 2026-07-25
**Initial audit was wrong and is corrected here.** The native HTML5 DnD
(`draggable`/`dragstart`/`dragover`, `:1732`/`:1833`/`:1847`) is indeed
mouse-only, BUT the file also ships a complete hand-rolled touch fallback:
`touchstart`/`touchmove`/`touchend` handlers (`:1884`–`:1951`) with a
`findRowFromPoint` hit-test (`:1804`). **Verified by driving a synthetic
touch drag in a `hasTouch` Playwright context at 375px: it reorders
correctly** (moved rank 1 past rank 3). So touch reorder is NOT missing, and
the SortableJS CDN tag (`:1157`) — though genuinely never instantiated
(`grep "new Sortable"` = 0) — is not needed; wiring it in would be
gratuitous churn in a frozen file. **No SortableJS rewrite.**

The real defect, found by reading the touch handler: its `touchstart` guard
keys off the whole `tr.player-row` with **no drag-handle requirement**
(`:1887`), and `touchmove` promotes any >8px vertical finger movement into a
drag with `preventDefault()` (`:1913`–`:1918`). Consequence: on a phone,
**any vertical swipe that begins on a player row is captured as a reorder,
so the user cannot scroll the list by swiping** — with 425 rows filling the
screen, the board becomes nearly impossible to scroll. Compounding it, the
`.col-handle` header is hidden below 768px (`:985`) so there's no visible
grab affordance either.

**Corrected fix (replaces the SortableJS plan):** gate the *touch* drag path
behind the drag handle — `touchstart` only initiates a drag when it begins
inside `.drag-handle` — so a plain swipe scrolls the list and only a
deliberate handle-grab reorders. Keep the existing engine and the desktop
mouse/keyboard paths untouched. Make `.drag-handle` a visible ≥44px target
on the mobile card. This is a small JS guard + CSS, far lower risk than
swapping the reorder engine.

### Finding D — Toolbar layout has an unexplained rendering fault
At 375px, `.search-zone` measures 696×**240px** for a control that should be
one ~40px-tall row (search input + mode badge). Needs isolated repro before
scoping a fix — flagged as a "diagnose first" item, not pre-diagnosed, so it
doesn't get a fix prescribed before the cause is confirmed.

### Finding E — No sub-480px breakpoint
Only two breakpoints exist (`980px`, `768px` — `:950`, `:964`). Nothing
targets small phones (iPhone SE = 375px, older Android = 360px, `320px`
floor). Button rows (`.actions-zone`, 8 buttons), filter groups (Age/Bye
min-max pairs), and position-filter chips all need a below-480px pass, not
just a 768px one.

### Finding F — Touch target sizing unaudited
`ui-ux-pro-max`'s Priority-2 rule requires 44×44px minimum touch targets
with 8px+ spacing. Star icon-button, tier `+` button, theme toggle (32×32px
today — under the minimum), and the drag-handle glyph have not been audited
against this. Theme toggle at `:315` is explicitly 32×32, which fails the
44px minimum as written.

---

## 2. Fix plan — phased, each with acceptance criteria

Per `scope-creep-guard`: allow-list for every phase below is `big-board.html`
+ `logging/progress_log.md` (+ new/edited specs in `e2e/`) only. Nothing in
`site/` changes — this is the frozen file's own mobile pass, independent of
the `site/` engine migration.

### Phase 0 — Diagnose Finding D
Isolate why `.search-zone` renders at 240px tall at narrow widths before
prescribing a fix (likely a flex-wrap interaction with `.mode-badge` or an
implicit wrap from `.toolbar-top { flex-direction: column }` at 768px
combined with the search-input's `min-width: 120px` inside a `flex: 1 1
240px` parent narrower than that). Acceptance: root cause identified and
written down; fix folded into Phase 1.

### Phase 1 — Contain the page (fixes Finding A)
- Constrain `.app` to `min-width: 0` and `width: 100%` inside its grid
  track so content can shrink instead of stretching the track.
- Constrain `.board` similarly; anything wider than the viewport moves
  inside a dedicated horizontally-scrollable region, never the page.
- **Acceptance:** `document.body.scrollWidth === window.innerWidth` at
  320px, 375px, 414px, 768px (Playwright assertion, zero tolerance —
  this is the `horizontal-scroll` anti-pattern and it's binary).

### Phase 2 — Collapse the table on mobile (fixes Finding B)
Two real options researched; recommendation below.

| Option | What it is | Trade-off |
|---|---|---|
| **A — Row-to-card collapse** (recommended) | Below ~600px, each `<tr>` becomes a card: name + position badge as the card header, rank/team/age/bye/draft/note as labeled key-value pairs stacked inside. CSS-only via `display: block` on `tr`/`td` + `td::before { content: attr(data-label) }`. | No horizontal scroll at all; every field reachable by vertical scroll only (thumb-friendly). Costs some vertical density — 425 players become a longer scroll, mitigated by keeping cards compact (~72–88px each vs. today's 44px row). |
| B — Horizontal scroll with frozen first column(s) | Keep the table, wrap it in `overflow-x: auto`, pin rank/name via `position: sticky; left:`. | Preserves table semantics and row density; still requires the user to swipe sideways to see Age/Bye/Draft/Note — "movable table" pattern, weaker for a share-and-glance mobile session. |
| C — Priority+ column hiding | Hide Age/Bye/Draft columns below 768px entirely, no way to reveal them on mobile. | Simplest, but silently removes data the user may want (age/bye matter for draft decisions) — fails the "professional tool" bar the launch-gaps doc set. |

**Recommendation: Option A**, informed by current (2026) responsive-table
guidance: collapsing rows into cards is the standard mobile pattern when
records are read individually rather than compared in bulk, which matches
how a board is used on a phone (scan-and-tap, not spreadsheet-style
scanning). Detail fields land in the existing player-detail concept from
`FOOTBALL_V1_LAUNCH_GAPS.md` item 12 for `site/`, but that's the generic
engine's modal — this phase only needs a CSS-only card collapse in the
frozen file, no new JS structures.
- **Acceptance:** at ≤600px, every column's data is visible on-screen for a
  card with zero horizontal scroll; axe: 0 critical/serious on the
  collapsed layout (table semantics via `role`/`aria` preserved per the
  chosen collapse technique — this needs care since visually hiding
  `<td>`/`<th>` display can strip table semantics for screen readers if
  done carelessly).

### Phase 3 — Fix touch-drag scroll hijack (corrected Finding C)
The existing hand-rolled touch DnD already reorders correctly; the bug is
that it captures plain swipes. Fix, keeping the engine:
- **JS:** in the `touchstart` handler (`:1884`), add a guard so a drag only
  starts when `event.target.closest(".drag-handle")` is truthy. A swipe
  anywhere else on the card falls through to native scrolling. Desktop
  mouse (native `draggable`) and keyboard (Space/arrows) paths are not
  touched.
- **CSS:** make `.drag-handle` a visible ≥44×44px grab target on the mobile
  card (it's opacity 0.35 and its header column is `display:none` <768px
  today).
- **No SortableJS, no engine rewrite** — the corrected finding makes that
  unnecessary.
- **Acceptance:** two new Playwright specs in a `hasTouch` context at 375px:
  (1) a swipe starting on the card body (not the handle) scrolls and does
  NOT reorder; (2) a drag starting on `.drag-handle` reorders to the drop
  position. Neither spec exists today — both are new required coverage.

### Phase 4 — Sub-480px breakpoint pass (fixes Finding E, F)
- Add a `@media (max-width: 480px)` tier: stack `.actions-zone` buttons
  into a scrollable/wrapped row with 44×44px minimum hit targets and 8px
  gaps; collapse Age/Bye filter pairs to single-column; consider moving
  filters behind a **filter drawer** (bottom sheet, per current mobile UX
  research — the standard 2026 pattern is a "Filters" button that opens a
  bottom sheet rather than an always-visible filter row eating vertical
  space above the fold) rather than the current always-expanded
  `.toolbar-bottom`.
- Fix the 32×32px theme toggle to 44×44px (or keep visual size, expand hit
  area via padding — `ui-ux-pro-max`'s stated technique for icon buttons
  under the minimum).
- **Acceptance:** axe 0 critical/serious at 320/375/414px; every
  interactive control ≥44×44px hit area (Playwright bounding-box
  assertion); board content visible above the fold within 1 scroll on a
  375×812 viewport (search + at least 3 player rows visible without
  scrolling past the toolbar).

### Results (implemented 2026-07-25)

All CSS/markup changes are inside `big-board.html`; one JS guard added to the
touch handler; new specs in `e2e/tests/bigboard-mobile.spec.ts`.

- **Phase 0/D (toolbar fault):** root cause was `.search-zone { flex: 1 1
  240px }` — in the stacked (column) toolbar the 240px basis became a 240px
  *height*. Fixed with `flex: 0 0 auto` on mobile.
- **Phase 1 (containment):** `.app { min-width: 0 }` + a `.table-scroll`
  wrapper. Also found and fixed a second real bug: `.app { grid-column: 2 }`
  (from the Entry 008 ad-blocker fix) collided with the 980px single-column
  collapse, shoving content into a phantom column 2 and overflowing ~45px;
  reset to `grid-column: 1` at ≤980. And a flex `min-width`/`flex-wrap`
  interaction (a wrapping column toolbar sized to the nowrap chip strip's
  min-content) — fixed with `flex-wrap: nowrap` + `min-width: 0`. Result:
  `body.scrollWidth === innerWidth` at 320/375/414px (was 774 on 375).
- **Phase 2 (cards):** row→card collapse ≤600px via CSS grid + `data-label`
  attributes; every field visible, no horizontal scroll; axe 0
  critical/serious on the mobile board.
- **Phase 3 (touch — corrected):** touch reorder already worked; gated it
  behind `.drag-handle` in `touchstart` so a body swipe scrolls. No
  SortableJS. Handle is a 44×44 target on the card. Both directions covered
  by specs (handle-drag reorders; body-swipe does not).
- **Phase 4 (small-phone):** ≤480px button grid, 44px touch targets on
  toggle/buttons/star/draft/note/handle/chips, 16px search font (no iOS
  zoom), inline Age/Bye.

**Residual (as of the initial implementation) — since resolved, see Phase 6
below:** the mobile toolbar was ~597px tall (8-button action grid +
always-visible filters), so the first card sat below the fold. Originally
deferred to `site/` on the reasoning that a filter drawer is "a new
interaction pattern = a feature." Phase 6 revisits that call — see below.
Still unaddressed (pre-existing, not introduced by this plan): the
hand-rolled touch drag has no edge auto-scroll, so long-distance reordering on
a phone is limited to what fits on screen — short drags and the
keyboard/desktop paths are unaffected.

### Phase 6 — QC follow-up: below-the-fold fix + card-density redesign (2026-07-26)

A same-day QC pass (hard gates: native mobile feel, ease of use/visibility,
accessibility, "pull factor") flagged two real gaps in Phases 1–5: the board
sat below the fold, and (once the user saw it live) the labeled multi-line
card was too tall — only ~1.5 players visible per screen, which "defeats the
purpose of a mobile ranker." Both were fixed, still inside the frozen-file
bug-fix framing:

- **Filters drawer.** Revisited the Phase 4 deferral: rather than a novel
  bottom-sheet component, the filter block (`.toolbar-bottom.filters`) is now
  wrapped in a native `<details id="filters-drawer">` — the *same* disclosure
  element already used for "Teams" in this file — with a `<summary>Filters</summary>`
  toggle showing an active-filter-group count. On desktop the toggle is
  CSS-hidden (`display:none`) and the drawer ships `open` in markup, so
  desktop is pixel-identical to before (verified: diffed live rendering
  against `git show HEAD:big-board.html` at 1440px — 0 differences in
  `body.scrollWidth`, row display mode, row height, or screenshot). Below
  600px a small one-time JS check (`initFiltersDrawer`) closes the drawer on
  load; the user's own open/close taps aren't fought afterward. Result:
  toolbar dropped from ~597px to **36.6% of viewport height** at 375×812,
  inside the 30–40% target.
- **Row redesign: labeled card → dense single-line row.** The Phase 2 card
  (name title + stacked labeled key/value pairs, ~92–140px tall) is replaced
  below 600px with one flat divider-list row (~44–49px, at the 44px
  touch-target floor) showing: drag handle, rank, star, name+position badge,
  and a "more info" (⋮) button. Team/Age/Bye/Draft/Note/Tier/Delete move into
  a **"more actions" modal** — reusing the app's existing generic modal
  component (the same one "Add Note" already used), not a new UI system.
  Result: **10 rows fully visible** at 375×812 (was ~1.5), verified via
  Playwright `getBoundingClientRect` against `window.innerHeight`.
- **Icon fix.** The drag handle and the "more info" button both rendered as
  a vertical-dots glyph (confusing, looked duplicated). Fixed via flex
  `order` (more-info first/left, drag handle last/right — no DOM/JS
  reordering, so desktop's table column order is untouched) and swapped the
  handle's glyph to a hamburger (☰) via a mobile-only `::after`, hiding the
  shared span's own text (`font-size:0`) rather than forking the markup
  between desktop and mobile.
- **Tier-break parity gap, caught in QC.** Moving the tier +/- control out of
  the visible row (it was already hover-only and therefore already
  unreachable on touch) without adding it to the new modal would have made
  it unreachable on mobile entirely. Fixed: the "more actions" modal
  includes an "Add/Remove Tier Break" button when sorting/filtering isn't
  active, wired through the existing `SET_TIER`/`REMOVE_TIER` actions.
- **Age/Bye min/max alignment, caught in QC.** The `<label>Age <input.../></label>`
  markup put the field name inline before the Min input only; forcing
  `width:100%` on mobile wrapped that text onto its own line, so Min sat a
  line lower than Max. Fixed with a matching `aria-hidden` "Age"/"Bye" span
  on the Max label (space-reserving `visibility:hidden`, not `display:none`)
  so both labels are the same height — desktop unaffected (`display:none`
  outside the mobile media query, contributing zero layout width there).

A known trade-off from the row redesign: Team/Age/Bye are no longer visible
at a glance during a fast scan — they're one tap away via the "more" button.
This was a deliberate call (matches the ≥44px touch-target floor with a
tight per-row height budget; the alternative was showing fewer than ~5
players per screen) and was made under explicit user direction during the
QC session, not unilaterally.

`e2e/tests/bigboard-mobile.spec.ts` was rewritten (not incrementally
patched) to match: density/toolbar-percentage regression guards, drawer
open/closed + badge-count checks, more-actions-modal content and
draft/tier round-trips, the left/right icon-order check, and the
age/bye-alignment regression guard, alongside the retained
horizontal-scroll, touch-drag-gate, and 44px-target checks. Full suite (36
tests) green; axe 0 critical/serious at 320/375/414 with the drawer closed,
drawer open, and the more-actions modal open; desktop re-verified
pixel-identical against the pre-session `HEAD` baseline (screenshot +
computed-style diff, not just the e2e suite).

### Phase 5 — Verification gate
- Full e2e suite green (`cd e2e && npx playwright test`) including all new
  mobile-viewport specs from Phases 1–4.
- Before/after Playwright screenshots at 320px, 375px, 414px, 768px,
  1024px — visual proof, not just assertions.
- Manual pass on the deployed `rankanything.pages.dev/football/` from an
  actual phone (this is the one step no automated tool substitutes for —
  flag as unverified until done).

---

## 3. What this plan explicitly does NOT do

- No new features (ADP, headshots, stats modal) — those stay on the
  `FOOTBALL_ENGINE_MIGRATION_PLAN.md` track in `site/`.
- No touching `site/`'s mobile behavior — this plan is `big-board.html`
  only; if `site/`'s generic board view has the same drag-touch gap, that's
  a separate, later finding (worth checking once this plan validates the
  fix pattern).
- No redesign of desktop layout — desktop is out of scope; only ≤980px
  behavior changes.
- Phase 3's SortableJS wiring does not change the *desktop* mouse-drag
  behavior or its e2e coverage — same engine, same handlers, just also
  touch-capable now.

## 4. Decision record

Original plan proposed wiring SortableJS for touch drag on the belief that
touch reorder was entirely broken. Live testing disproved that (touch
reorder works; the real bug is scroll hijack). Corrected 2026-07-25: Phase 3
is now a small handle-gate guard + CSS, no SortableJS, no engine rewrite —
lower risk than originally scoped. User approved implementing all phases.
