# Claude Code Instructions — Fantasy Football Big Board

These instructions are always-on for Claude Code agents working in this repository.

## Project Summary

This is a **no-sign-up, single-file fantasy football big board** (`big-board.html`). The entire application ships as one HTML file with embedded CSS and JS. There is no build pipeline, no backend, and no framework. The frontend is the product.

## Core Mission

- Preserve the single-file, no-build-step constraint at all times.
- Keep the UI professional, distinctive, and non-generic.
- No sign-up, no backend calls, no localStorage keys that break cross-device portability.
- Prefer correctness, clarity, and verifiability over convenience.

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
| `big-board.html` | Single deployable file — no external JS/CSS files may be introduced |
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

- Do not add a build step, package.json, bundler, or framework.
- Do not add a login, registration, or server-side call.
- Do not add external CSS or JS file references beyond the existing CDN libs (SortableJS, PapaParse).
- Do not skip `SKILL_MAP.md` on skill changes.
- Do not leave `progress_log.md` empty after a material change.
