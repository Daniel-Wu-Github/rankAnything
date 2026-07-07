# Claude Code Instructions — Rank Anything

These instructions are always-on for Claude Code agents working in this repository.

## Project Summary

This repository is **Rank Anything** — a no-sign-up, zero-backend ranking site — plus its origin product, the **fantasy football big board**.

- `big-board.html` — the original single-file football board. **FROZEN**: bug fixes only, no new features, single-file constraint still absolute. It ships verbatim at `/football/`.
- `site/` — the generic app: schema-driven templates, board/tier/pairwise views, share-by-URL, embeds. Native ES modules, **zero runtime dependencies, no bundler**; `site/build.mjs` (zero-dep node) prerenders `site/dist`.
- `e2e/` — the 23-test Playwright gate (see `e2e/README.md`). It must be green before any change to `big-board.html` or `site/` merges.
- `docs/RANK_ANYTHING_ROADMAP.md` — the approved roadmap (P0 → Step 1 shipped; Step 2 social is traction-gated).

## Core Mission

- Keep the product zero-backend and sign-up-free through Step 1. The board must always work from a static host and a URL.
- `big-board.html` stays a single file with no build step. The generic app stays a single *static bundle*: build step allowed, bundler and runtime dependencies are not.
- Keep the UI professional, distinctive, and non-generic.
- No backend calls; localStorage keys must not break cross-device portability (share-URLs are the portability mechanism).
- Prefer correctness, clarity, and verifiability over convenience. The e2e gate is the definition of "works".

## Workflow Principles

- Read `.github/skills/SKILL_MAP.md` first on every task.
- Load `scope-creep-guard` before planning or edits.
- For frontend or UI tasks, load `frontend-design` and `ui-ux-pro-max`.
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
| `.github/skills/SKILL_MAP.md` | Must be updated whenever a skill is added, removed, or renamed |
| `logging/progress_log.md` | Must be updated for any material change |

## Skill Load Order

1. [`repo-workflow`](.github/skills/repo-workflow/SKILL.md)
2. [`scope-creep-guard`](.github/skills/scope-creep-guard/SKILL.md) — every task
3. [`frontend-design`](.github/skills/frontend-design/SKILL.md) — any UI/visual work
4. [`ui-ux-pro-max`](.github/skills/ui-ux-pro-max/SKILL.md) — design system, palettes, component patterns
5. [`documentation-cohesion`](.github/skills/documentation-cohesion/SKILL.md) — doc changes
6. Cross-cutting skills as needed: `skill-map-governance`, `verification-gate`, `workflow-logging`

## Sources of Truth

- This file (`CLAUDE.md`) — Claude Code always-on instructions
- `.github/copilot-instructions.md` — VS Code Copilot always-on instructions (parallel surface)
- `.github/skills/SKILL_MAP.md` — skill registry
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

- Do not add features to `big-board.html` — it is frozen; new capability belongs in `site/`.
- Do not add a bundler, framework, or npm runtime dependency to `site/` (dev-only tooling in `e2e/` is fine).
- Do not add a login, registration, or server-side call — Step 2 (social) is gated on the roadmap's traction evidence and is a deliberate architecture change, not a drive-by.
- Do not add external CSS/JS references beyond the existing CDN libs in `big-board.html` (SortableJS, PapaParse) and Google Fonts.
- Do not merge with the e2e gate red, and do not delete failing specs to get green.
- Do not skip `SKILL_MAP.md` on skill changes.
- Do not leave `progress_log.md` empty after a material change.
