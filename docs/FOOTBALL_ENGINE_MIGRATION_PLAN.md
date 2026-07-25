# Football → `site/` Engine Migration Plan (draft, for review)

**Date:** 2026-07-25
**Status:** draft — no code written against this plan yet.
**Triggered by:** `FOOTBALL_V1_LAUNCH_GAPS.md` items 4 (ADP presets) and 12
(player modal) are new features, which conflicts with `big-board.html`'s
explicit frozen-file rule in `CLAUDE.md`. Decision made 2026-07-25: migrate
football's remaining v1 gaps into `site/`'s generic schema-driven engine
instead of amending the freeze or forking a new single file.

---

## 1. What this plan does and doesn't cover

**In scope:** a path for football's ranking experience to live as a `site/`
template + any schema/engine extensions genuinely needed by football's
gaps (ADP presets, a detail modal, ad slots), reusable by every other
template, not football-special-cased.

**Out of scope:** actually writing that code. This doc exists so the
approach can be reviewed before implementation starts, per the user's
request. Also out of scope: Gemini/Copilot, the ai-workflow MCP work, and
anything already shipped (share URL, CSV, keyboard reorder, axe gate).

---

## 2. What `big-board.html` has that `site/`'s engine doesn't, today

Verified by reading both, not assumed:

| Capability | `big-board.html` | `site/` engine | Gap |
|---|---|---|---|
| Ad slots (`ad-column`/`ad-placeholder`, banner) | Yes, 3 slots + CSS grid | **None** | `site/src/pages/*.html` has zero ad markup — this needs porting too, not just the new features. Ads (launch-gap item 6) becomes a migration dependency, not an independent item. |
| Football-specific columns (position, team, age, bye, draft, note) | Hardcoded columns | Schema-driven (`{key, label, type, filter}` per field) | Fits naturally — football becomes a template like `movies-2010s.json`, columns come from schema already. No gap. |
| Notes field | Per-item, inline in table | Exists in state (`item.note`) but not yet rendered anywhere in `site/`'s board view | Small — engine already tracks it, just needs UI. |
| Detail vs. table-only fields (needed for the modal) | N/A (all columns always shown) | Schema has no `inline`/`detail` distinction | New schema field needed: e.g. `detail: true` on a schema entry means "modal-only," default `false`/absent = today's behavior (shown in table), so **existing templates need zero changes**. |
| ADP/preset starting data per template | N/A (one hardcoded player list, CSV import only) | Templates ship a fixed `items` array; no concept of "pick a variant of starting data" | New concept: a template needs an optional list of **named item-set variants** (e.g. `variants: [{label: "PPR", file: "football-ppr.json"}, {label: "Dynasty", ...}]) instead of one fixed `items` array. This is the biggest actual schema/engine change in this plan. |

---

## 3. Proposed phases

### Phase A — port football as a template, feature-parity only
Goal: `site/` can render today's `big-board.html` experience (same columns,
same data, same views) as a template, with **no new features yet**. This
validates the schema/engine handle football's column set (position, team,
age, bye, draft-tracking, notes, star) before adding anything new.

- Add `site/templates/football-2026.json` using the existing `FantasyPros_2026_Draft_ALL_Rankings.csv` data, schema fields for position/team/age/bye.
- Port ad slots into `site/src/pages/board.html` (and whichever shell football uses) as a generic, reusable ad-column layout — apply the `grid-column` pinning fix from this session's `big-board.html` bugfix here too, so the new version doesn't reintroduce the same ad-blocker squish bug.
- **Acceptance:** an e2e spec proving the new football template round-trips (share URL, CSV, keyboard reorder) exactly like the existing `home.spec.ts` "frozen football board still serves at /football/" spec does today — but for the new template, at a *new, non-conflicting path* (e.g. `/t/football-2026/`) so `/football/` keeps serving the frozen file untouched throughout this phase.
- `big-board.html` is **not touched or retired** in this phase. Both versions run side by side.

### Phase B — ADP presets (build-time data pipeline)
- Small zero-dep Node script (`site/scripts/fetch-adp.mjs` or similar), run manually or on a schedule, hits Fantasy Football Calculator's API server-side (no CORS issue outside a browser) and writes static JSON files into `site/templates/` or a new `site/data/adp/` directory.
- Extend template schema with the `variants` concept from §2 so the football template can offer a picker ("PPR" / "Half-PPR" / "Dynasty" / etc.) that swaps starting `items` without changing columns.
- Label honestly per `FOOTBALL_V1_LAUNCH_GAPS.md` item 4's finding: "Community ADP (via Fantasy Football Calculator)," not "Sleeper ADP" — the data isn't Sleeper's.
- **Acceptance:** e2e spec picks a variant, confirms the board loads with that variant's starting order/players.

### Phase C — player detail modal
- Extend schema with `detail: true` fields (§2); confirm `board.js` renders a row-click/keyboard-activation modal listing all `detail` fields plus the existing `note`.
- Ship schedule as static per-season JSON (no licensing risk, confirmed in launch-gaps doc).
- Stats: **deferred to a later phase**, per launch-gaps doc's scoping-down recommendation — don't build a live stats pipeline in this pass.
- Modal must pass the existing axe gate: focus trap, `aria-modal`, Escape to close, focus returns to the triggering row on close.
- **Acceptance:** axe: 0 critical/serious on the modal open/closed states; keyboard-only spec opens and closes the modal without a mouse.

### Phase D — cutover decision (separate, later conversation)
Once Phases A–C are live and validated at `/t/football-2026/` (or wherever it lands) with real usage, decide whether to:
- Redirect `/football/` to the new template and retire `big-board.html`, or
- Keep both indefinitely (frozen file as a stable fallback / "classic" version).

This is explicitly **not decided by this plan** — it's a product call to make after the new version has actually proven itself, not before.

---

## 4. Risks / things to watch

- **Scope discipline**: the `variants` and `detail` schema extensions are the only genuinely new engine capabilities this plan calls for. Resist adding anything football-specific into the generic engine that other templates wouldn't also benefit from — if a piece of UI only ever makes sense for football, it belongs in the football template's data/config, not in `engine.js`/`board.js` as special-cased code.
- **Ad slots regressing the squish bug**: Phase A explicitly must carry forward the `grid-column` pinning fix from this session, not just copy the old un-pinned CSS.
- **`/football/` must stay untouched** until Phase D is explicitly decided — Phase A adds a new path, it does not modify the existing one. The e2e spec that currently asserts `/football/` serves the frozen board unchanged should keep passing throughout Phases A–C with zero modification, as a tripwire.
- **FFC API attribution requirement**: their free-commercial-use terms require attribution (a link/mention) — needs a small credit somewhere on the football template page, not just a code integration detail.

## 5. Open questions for the next session to resolve before implementing Phase A

- Does football need its own dedicated page shell (like `site/src/pages/board.html`) or does the existing generic board shell already suffice with just a new template JSON?
- Where should the `variants` concept live in the schema — per-template top-level key (as sketched in §2) or a separate manifest file? No existing precedent in the current 12 templates to follow, since none of them have this concept.
- Confirm with the user whether Phase A's new path should be `/t/football-2026/`, `/t/football/`, or something else — avoid colliding with the existing frozen `/football/`.
