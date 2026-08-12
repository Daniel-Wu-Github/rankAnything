# Claude Code Instructions — Rank Anything

These instructions are always-on for Claude Code agents working in this repository.

## Project Summary

This repository is **Rank Anything** — a no-sign-up, zero-backend ranking site — plus its origin product, the **fantasy football big board**.

- `big-board.html` — the original single-file football board. **FROZEN**: bug fixes only, no new features, single-file constraint still absolute. It ships verbatim at `/football/`, and as of 2026-08-11 it is the **single official football board** — there is no second football surface and no migration planned (see below).
- `site/` — the generic app: schema-driven templates, board/tier/pairwise views, share-by-URL, embeds. Native ES modules, **zero runtime dependencies, no bundler**; `site/build.mjs` (zero-dep node) prerenders `site/dist`. Ships **12 curated non-football templates** plus custom boards.
- `e2e/` — the 57-test Playwright gate (see `e2e/README.md`). It must be green before any change to `big-board.html` or `site/` merges.
- `docs/RANK_ANYTHING_ROADMAP.md` — the approved roadmap (P0 → Step 1 shipped; Step 2 social is traction-gated).

**Two separate products, permanently.** Football lives only in
`big-board.html`; the generic engine lives only in `site/`. They share a
domain and a design language, nothing else. A feature added to `site/` does
not reach `/football/`, and football features do not migrate into `site/` —
`docs/FOOTBALL_ENGINE_MIGRATION_PLAN.md` is **cancelled**, and the
generic-engine football template was deleted on 2026-08-11. Do not recreate
a football template in `site/`, and do not propose merging the two.

## Core Mission

- Keep the product zero-backend and sign-up-free through Step 1. The board must always work from a static host and a URL.
- `big-board.html` stays a single file with no build step. The generic app stays a single *static bundle*: build step allowed, bundler and runtime dependencies are not.
- Keep the UI professional, distinctive, and non-generic.
- No backend calls; localStorage keys must not break cross-device portability (share-URLs are the portability mechanism).
- Prefer correctness, clarity, and verifiability over convenience. The e2e gate is the definition of "works".

## Workflow Principles

- Read `.claude/skills/SKILL_MAP.md` first on every task.
- Invoke `Skill(scope-creep-guard)` before planning or edits — via the `Skill`
  tool, not by reading `SKILL.md` directly; skills live under `.claude/skills/`
  specifically so the `Skill` tool can find and invoke them.
- For frontend or UI tasks, invoke `Skill(frontend-design)` and `Skill(ui-ux-pro-max)`.
- Execute in small, verifiable steps.
- Record material workflow changes in `logging/progress_log.md`.
- Run a verification gate before completion on any file-editing task.

## File Constraints

| File | Rule |
|------|------|
| `big-board.html` | FROZEN single file — bug fixes only; no external JS/CSS beyond the existing CDN libs |
| `site/src/**` | Native ES modules only; no npm runtime dependencies, no bundler |
| `site/templates/*.json` | Curated only — every template must be a genuinely good list, not filler |
| `e2e/**` | Suite must stay green; new features land with their specs |
| `.claude/skills/SKILL_MAP.md` | Must be updated whenever a skill is added, removed, or renamed |
| `logging/progress_log.md` | Must be updated for any material change |

## Skill Load Order

Invoke each via the `Skill` tool (e.g. `Skill(repo-workflow)`), not by reading its `SKILL.md`:

1. `repo-workflow`
2. `scope-creep-guard` — every task
3. `frontend-design` — any UI/visual work
4. `ui-ux-pro-max` — design system, palettes, component patterns
5. `documentation-cohesion` — doc changes
6. Cross-cutting skills as needed: `skill-map-governance`, `verification-gate`, `workflow-logging`

## Sources of Truth

- This file (`CLAUDE.md`) — Claude Code always-on instructions
- `.github/copilot-instructions.md` — VS Code Copilot always-on instructions (parallel surface; not kept in sync with the `.claude/skills` migration below, since Copilot is out of scope here)
- `.claude/skills/SKILL_MAP.md` — skill registry
- `README.md` — project overview and CSV format spec
- `big-board.html` — the application itself

## Frontend Standards

- Dark theme (`#0f1117` base) — do not flip to light without explicit request.
- CSS custom properties (`--var`) for all colors and spacing — no hardcoded hex in new rules.
- No emoji as structural icons — use SVG or text symbols.
- Animations: CSS-only, `prefers-reduced-motion` respected, 150–300 ms range.
- Accessibility: `aria-label` on icon-only buttons, focus-visible rings, keyboard nav.
- Typography: avoid Inter as the sole font — the skill map has 57+ pairing options.

## What Not to Do

- Do not add features to `big-board.html` — it is frozen. Note this no longer means "build it in `site/` instead": football features are simply out of scope now that the migration is cancelled. New *generic* capability belongs in `site/`; new *football* capability belongs nowhere without an explicit decision to unfreeze.
- Do not recreate a football template under `site/templates/` — it was deliberately deleted (2026-08-11) to end the duplicate-board problem.
- Do not add a bundler, framework, or npm runtime dependency to `site/` (dev-only tooling in `e2e/` is fine).
- Do not add a login, registration, or server-side call — Step 2 (social) is gated on the roadmap's traction evidence and is a deliberate architecture change, not a drive-by.
- Do not add external CSS/JS references beyond the existing CDN libs in `big-board.html` (SortableJS, PapaParse) and Google Fonts.
- Do not merge with the e2e gate red, and do not delete failing specs to get green.
- Do not skip `SKILL_MAP.md` on skill changes.
- Do not leave `progress_log.md` empty after a material change.
