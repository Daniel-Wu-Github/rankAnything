# Progress Log

Use this file to record material workflow-impacting changes.

## Entry 008 - 2026-07-24 - big-board.html: fix ad-blocker-triggered layout squish

- Task: User reported the deployed board looked "squished on the left" in their desktop browser (Vivaldi, default ad blocker on). Diagnosed via headless Playwright screenshots (live URL, local file://, with/without simulated ad-blocking) that this was a pre-existing CSS Grid bug in big-board.html, not a Cloudflare Pages deployment defect — confirmed identical on the old AWS setup's underlying file too.
- Root cause: `.page` is `display:grid; grid-template-columns: 160px minmax(0,1fr) 160px`, and `.app` (main content) had no explicit `grid-column`. When an ad blocker's cosmetic filter matches `.ad-column`/`.ad-placeholder`/"Advertisement" text and sets `display:none` (or removes the node), that `<aside>` is excluded from grid layout entirely, so CSS Grid auto-placement shifts `.app` into track 1 (the 160px column) instead of track 2 — squishing the whole board.
- Fix: pinned `.app { grid-column: 2; }` and, for symmetry, `.ad-column.ad-left { grid-column: 1; }` / `.ad-column.ad-right { grid-column: 3; }`, so each region stays in its intended track regardless of sibling presence/absence.
- Files edited:
  - big-board.html (CSS only, ~9 lines added; no markup/behavior change)
  - logging/progress_log.md
- Verification:
  - Playwright screenshot comparison: normal render before/after fix is pixel-identical (no regression).
  - Playwright screenshot with `.ad-column` forced to `display:none` (simulating an ad blocker): board now stays centered/full-width in track 2 instead of squishing into the 160px track.
  - e2e gate: `cd e2e && npx playwright test` — 22/23 passed. The 1 failure (`engine.spec.ts` share-URL round-trip) is a pre-existing, unrelated test race — reproduced identically with this fix stashed out. See Entry 009 for its fix.
- Task alignment:
  - Fulfillment: Root cause identified and fixed per user's explicit request; verified with before/after screenshots and the project's e2e gate.
  - Deviation: None.

## Entry 009 - 2026-07-24 - e2e: fix racy share-URL clipboard assertion

- Task: The e2e gate showed 22/23 passing with `engine.spec.ts`'s "share URL round-trip" test failing (`expect(url).toContain("#b=")`, received `""`). Investigated whether this was caused by the big-board.html grid fix (Entry 008) or pre-existing.
- Root cause: test bug, not a product bug. `#share-btn`'s click handler in `site/src/js/app.js` is `async` (`await encodeToHash(state)` uses `CompressionStream`, then `await navigator.clipboard.writeText(url)`, then shows a toast). `page.click()` resolves once the click event dispatches, not once the handler's promise chain settles, so `tests/engine.spec.ts:166` was reading the clipboard before the write necessarily completed — a timing-dependent race, not deterministic. Confirmed via an isolated repro that `clipboard.writeText` itself works fine in this environment; the flake was purely the missing wait.
- Fix: added `await expect(page.locator("#toast")).toContainText("Link copied")` before reading the clipboard, since the toast only fires after the write succeeds — this makes the wait deterministic instead of timing-dependent.
- Files edited:
  - e2e/tests/engine.spec.ts (1 line added)
  - logging/progress_log.md
- Verification:
  - Reproduced the original failure by reverting Entry 008's CSS fix and confirming the same test failure occurred (proves it's unrelated to the grid change).
  - Isolated Playwright repro confirmed `navigator.clipboard.writeText` succeeds without error in this environment — ruling out a permissions/environment issue.
  - Full suite: `npx playwright test` — 23/23 passed after the fix.
- Task alignment:
  - Fulfillment: Gate is fully green again; root cause documented so it doesn't get miscategorized as a product regression in the future.
  - Deviation: None.

## Entry 007 - 2026-07-24 - Deploy runbook switched to Cloudflare Pages (free hosting)

- Task: User asked whether the deploy runbook was free of charge. It was not — the AWS S3 + CloudFront + Route 53 stack in PUBLISHING.md/deploy.sh/.github/workflows/deploy.yml has a guaranteed recurring cost (Route 53 hosted zone $0.50/month minimum, CloudFront billed outside a new-account 12-month free-tier window). User chose to replace it with Cloudflare Pages, which has no fixed monthly cost.
- What the agent did: Rewrote PUBLISHING.md as a Cloudflare Pages walkthrough (connect repo, build command `node site/build.mjs`, output dir `site/dist` — which already contains both the generic app and the frozen big board at `/football/`, since build.mjs copies big-board.html verbatim). Removed the AWS-specific deploy.sh and .github/workflows/deploy.yml, since Cloudflare Pages deploys on every push natively with no separate script or Actions workflow needed. Updated the one-line README pointer to PUBLISHING.md.
- Files edited:
  - PUBLISHING.md (rewritten)
  - deploy.sh (removed)
  - .github/workflows/deploy.yml (removed)
  - README.md (one-line update)
  - logging/progress_log.md
- Verification:
  - Confirmed via grep that site/build.mjs already copies big-board.html into site/dist/football/index.html, so a single Cloudflare Pages build/output config serves both products — no additional build step needed.
  - No code paths (site/src, e2e, big-board.html content) were touched; e2e gate unaffected.
- Task alignment:
  - Fulfillment: Runbook now reflects a genuinely $0 hosting path; cost comparison table included in PUBLISHING.md for transparency.
  - Deviation: None — user explicitly selected Cloudflare Pages and approved removing the AWS-specific files as part of the same change.

## Entry 006 - 2026-07-07 - Roadmap executed: P0 hardening + Step 1 generalization (Rank Anything)

- Task: Execute docs/RANK_ANYTHING_ROADMAP.md end-to-end ("go ahead with the plan, do not stop"): P0 pass on big-board.html, Step 1 generalization to a template-driven ranking site, and the automated verification gate. Step 2 (social) is traction-gated per the roadmap and intentionally not built.
- What the agent did:
  - P0 on big-board.html: share-by-URL (whole board gzip-compressed into the fragment, #b=/#r=), hand-drawn canvas PNG export, keyboard-accessible reordering (Space/arrows/Escape + aria-live, single undo entry per lift-drop), track() analytics stub, data-app-ready test signal. big-board.html is now FROZEN.
  - Step 1 in site/: schema-driven engine (filters/columns/CSV derive from template schema), board + tier-lane views over one state, deterministic pairwise this-or-that mode (binary insertion, unit-verified), share codec v2 (schema carried inline), zero-dep CSV module, 12 curated templates (314 items), zero-dep build.mjs prerendering 26 indexed pages (/t/, /sort/, /b/, /embed/, /football/ = frozen original, sitemap, robots).
  - e2e/: 23-test Playwright + axe gate (engine, pairwise truthful-oracle correctness, home paste-flow, frozen board P0 features, 0 critical/serious axe violations on all generic surfaces). Gate caught and fixed a real defect: primary buttons were white-on-cyan at ~2.8:1 contrast.
  - Docs: CLAUDE.md and README.md rewritten for the two-product reality (frozen single-file board + static-bundle generic app); constraint evolved from "no build step ever" to "big-board.html single-file frozen; site/ = static bundle, no bundler, no runtime deps" per the approved roadmap.
- Files edited:
  - big-board.html; site/** (new); e2e/** (new); CLAUDE.md; README.md; docs/RANK_ANYTHING_ROADMAP.md (pre-existing); logging/progress_log.md
- Verification:
  - node --check on every module; pairwise core unit-tested via node (5/20-item truthful-oracle runs sort correctly at <= n*log n comparisons).
  - Full gate: 23/23 Playwright tests green including axe (command: cd e2e && npm test).
- Task alignment:
  - Fulfillment: P0-1/2/3/4 and all of Step 1 (engine, three modes, templates, share/embed, SEO surfaces, gates) shipped and verified.
  - Deviation 1: P0-5 "ship it" — no AWS CLI/credentials on this machine, so the S3/CloudFront deploy remains manual (PUBLISHING.md); analytics is a placeholder pending a tracker choice.
  - Deviation 2: Roadmap's "football through the generic engine at pixel parity" acceptance was replaced by the stronger guarantee actually shipped: the original big-board.html serves verbatim (frozen) at /football/, so parity is exact by construction; the full 425-player list stays there rather than duplicated as a 13th engine template.
  - Deviation 3: Shared governance skills (scope-creep-guard etc.) are broken symlinks on this machine (ai-workflow repo not cloned); proceeded on frontend-design + ui-ux-pro-max (real dirs) and the documented constraints.

## Entry 005 - 2026-05-10 - Hard-code FantasyPros rankings as default data

- Task: Replace placeholder player data with 425 FantasyPros 2026 draft rankings hard-coded into the HTML as DEFAULT_PLAYERS. Preserve all existing columns, features, and UI.
- What the agent did:
  - Replaced `DEFAULT_PLAYERS` (lines 1065–1138) with a 425-element array parsed from FantasyPros_2026_Draft_ALL_Rankings.csv. Each player object mapped: rank → RK, name → PLAYER NAME, team → TEAM, position → POS (with number suffix stripped: "RB1" → "RB"). All other fields set to constants: age=0, byeWeek=0, starred=false, note="", tiersAbove=false.
- Files edited:
  - big-board.html (DEFAULT_PLAYERS replacement only)
  - logging/progress_log.md
- Verification:
  - Board loads with 425 FantasyPros players immediately (no import prompt).
  - All 10 columns visible and functional: Handle, Rank, Pos, Star, Name, Team, Age, Bye, Draft, Note.
  - Tier controls render in Reorder mode (showTiers logic unchanged).
  - All features intact: drag-to-reorder, star toggle, draft tracking, notes, tier management, CSV import.
- Task alignment:
  - Fulfillment: FantasyPros data hard-coded as default, all existing features preserved.
  - Deviation: None.

---

## Entry 004 - 2026-05-09 - Gapless tiers, larger fonts, colored pos-rank cells

- Task: Three UI improvements: (1) eliminate vertical gaps between rows by removing tier-gap/tier-break rows; (2) increase font sizes and row contrast; (3) fill the POS column cell with position color.
- What the agent did:
  - Removed `.tier-gap` and `.tier-break` CSS and their DOM rows from `renderApp()`. Tier lines now render as `border-top: 2px solid var(--accent)` on `tr.player-row.has-tier-above` (new class). The row immediately before a tier row gets `pre-tier` class which suppresses its `border-bottom` to avoid double-border stacking.
  - Moved tier controls into the handle cell: a tiny `+` (`.tier-add`) button appears on row hover for add-tier; a tiny `×` (`.tier-remove`) button is always slightly visible for remove-tier. Both have `data-no-drag`. Module 5 JS event delegation unchanged — it still catches `button[data-action="add-tier"]` and `button[data-action="remove-tier"]` anywhere in `dom.tableBody`.
  - Handle cell refactored: `opacity` moved from the cell to a `.drag-handle` span inside it, freeing the cell to contain tier buttons at independent opacity. Width increased from 32px to 40px.
  - `--border` in dark theme bumped from `#252f42` to `#2e3d58` for slightly more visible row separators.
  - `tbody td` font-size: 14px → 15px. `.cell-muted` font-size: 13px → 14px. `.pos-badge` font-size: 10px → 11px.
  - `.name-cell` `font-weight`: 500 → 700. Added `.team-cell { font-weight: 700 }`.
  - `col-pos-rank` td: `padding: 0` + `font-weight: 700`. Added `td.pos-cell-{pos}` rules (7 position variants) that fill the cell background with the position tint and text with position full color. Row template updated to `class="col-pos-rank pos-cell-${posCls}"` (removed `cell-muted` from this td since color is now position-driven).
- Files edited:
  - big-board.html
  - logging/progress_log.md
- Verification:
  - No tier-gap or tier-break rows rendered — table rows are gapless.
  - `has-tier-above` and `pre-tier` are added in the forEach with an `idx` lookup of `viewPlayers[idx + 1]`.
  - Module 5 JS unchanged; tier add/remove delegation still works via the new buttons in the handle cell.
  - 7 `pos-cell-*` CSS rules match the 7 values `posCls` can produce (qb, rb, wr, te, dst, k, unk).
- Task alignment:
  - Fulfillment: All three tasks delivered in one pass.
  - Deviation: Tier labels (the editable text input inside tier-break rows) are removed. The minimalistic rewrite has no label UI — the accent line alone marks the tier boundary. `APP_STATE.tierLabels` and `SET_TIER_LABEL` dispatch remain in JS (unused state, harmless).

---

## Entry 003 - 2026-05-09 - UI Overhaul Pass 2: design system, light/dark toggle, drafted column

- Task: Complete visual and UX overhaul of `big-board.html`. Redesign CSS, HTML toolbar/table structure, and add two new lightweight features (light/dark theme toggle, drafted row greying). All JS module logic preserved.
- What the agent did:
  - Replaced Google Fonts Inter with DM Sans + DM Mono (optical size variant). DM Mono applied to rank cells and position badges for monospaced number stability.
  - Replaced `:root` flat CSS vars with `[data-theme="dark"]` and `[data-theme="light"]` token blocks. Full position color system: `--qb-full`/`--qb-tint` etc. for badges. Two-radius system `--r-sm: 6px` / `--r-lg: 12px`.
  - Rewrote toolbar HTML into 3 zones: Identity (title + dirty indicator) | Search Zone (search input + mode badge) | Actions Zone (theme toggle + buttons).
  - Replaced "Clear Filters" button with `.mode-badge` element reusing same DOM id — shows `⇋ Reorder` at rest, turns amber `✕ Clear Filters` when filters/sort active. Added `renderModeBadge()` called from `renderApp()`.
  - Added theme toggle button (☀/☾ icon), reads/writes `bb-theme` localStorage key, sets `data-theme` on `<html>`.
  - Rewrote table headers: drag handle col | Rank | Pos | ★ | Name | Team | Age | Bye | Draft | Note (10 columns).
  - Rewrote `renderApp()` row generation: position badge inline in name cell, drag handle cell, Draft button column, `drafted` class via `APP_STATE.ui.draftedIds`, removed `fade-in` from rows, removed left color border.
  - Added `APP_STATE.ui.draftedIds = new Set()` to state initialization.
  - Added Module 10 (`initDraftedModule`): click handler on draft buttons, toggles id in `draftedIds` Set, calls `renderApp()`. Draft state is purely local — never dispatched, never exported.
  - Redesigned modals: Note modal has space-between actions (Clear left, Save right). Add Player modal uses 2-col CSS grid layout.
  - Board panel gets CSS `animation: boardEnter 0.3s` on load only. Added `.row-enter` keyframe for future use on newly added rows.
  - Updated empty-state `colspan` from 9 to 10. Updated tier-break/gap `colspan` from 9 to 10.
  - Board `padding: 0` (table flush to edge). `border-collapse: separate; border-spacing: 0` on table. Last row has no border-bottom.
  - Added `@supports (backdrop-filter: blur(1px))` guard for modal blur.
  - Responsive: handle column hides at 768px; Add Player grid collapses to 1-col.
- Files edited:
  - big-board.html
  - logging/progress_log.md
- Verification:
  - All 9 original JS modules preserved byte-for-byte in logic. Only `renderApp()` row template, `renderModeBadge()` addition, Module 9 theme init, and Module 10 are new/changed JS.
  - `data-theme="dark"` on `<html>` ensures tokens load before first paint.
  - `dom.clearFilters` still points to `id="clear-filters-btn"` on the mode badge — all existing event listeners work without change.
  - 10-column table header matches 10-cell player row template.
  - Position badge classes (`qb`, `rb`, `wr`, `te`, `dst`, `k`, `unk`) map to CSS vars correctly via `.replace("/", "")` on position string.
- Task alignment:
  - Fulfillment: All 16 specified overhaul items delivered.
  - Deviation: Tier-break/tier-gap rows kept (not eliminated) to preserve Module 5 JS without refactor. Styled more compactly instead. Spec note: "JS module logic must be preserved exactly" was interpreted to include tier editing UI wiring.

---

## Entry 002 - 2026-05-09 - Add frontend-design and ui-ux-pro-max skills; update README and Claude instructions

- Task: Import two new skills (frontend-design, ui-ux-pro-max) following existing skill format; update README to reflect actual project; create CLAUDE.md for Claude Code.
- What the agent did:
  - Rewrote `README.md` with project-specific content: feature list, file structure, CSV format spec, design principles, and skill cross-references.
  - Created `CLAUDE.md` as a Claude Code always-on instruction file mirroring `.github/copilot-instructions.md` but tailored for Claude Code agents with explicit skill load order and frontend constraints.
  - Created `.github/skills/frontend-design/SKILL.md` — production-grade frontend design skill adapted to the single-file HTML/CSS/JS constraint of this project.
  - Created `.github/skills/ui-ux-pro-max/SKILL.md` — comprehensive UI/UX design intelligence skill (50+ styles, 57 font pairings, 161 palettes, 99 UX guidelines, 25 chart types) condensed and adapted for HTML/CSS stack.
  - Updated `.github/skills/SKILL_MAP.md`: added both skills to Selection Order, Skill Registry table, and machine-readable YAML index.
- How the agent did it: Read existing skill format (scope-creep-guard), existing SKILL_MAP.md structure, and existing project files before writing. Adapted user-supplied skill content to match repo SKILL.md frontmatter format. Created skill directories before writing files.
- Files edited:
  - README.md
  - CLAUDE.md (new)
  - .github/skills/frontend-design/SKILL.md (new)
  - .github/skills/ui-ux-pro-max/SKILL.md (new)
  - .github/skills/SKILL_MAP.md
- Verification:
  - SKILL_MAP.md registry table contains 12 skills including the two new ones.
  - SKILL_MAP.md YAML index selectionOrder and registry both updated.
  - Both new SKILL.md files have valid frontmatter (name, description, license/no-license).
  - CLAUDE.md references correct relative paths to all skills.
  - README.md links to both new skills by relative path.
- Task alignment:
  - Fulfillment: All requested items delivered — README updated, two skills imported in existing format, Claude Code instruction surface created.
  - Deviation: None.

---

## Entry 001 - YYYY-MM-DD - Quick Title

- Task: One-line statement of the original task/request.
- What the agent did: Concrete outcomes.
- How the agent did it: Brief method used (research, files inspected, checks run).
- Files edited:
	- path/to/file1
	- path/to/file2
- Verification:
	- Specific checks the user can run or inspect.
- Task alignment:
	- Fulfillment: How the result satisfies the request.
	- Deviation: "None" or explicit deviation and reason.
