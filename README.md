# Fantasy Football Big Board

A no-sign-up, production-grade fantasy football big board — single HTML file, fully client-side, zero backend.

## What It Is

A professional drag-and-drop player ranking tool for fantasy football. Users can build, sort, tier, annotate, and export their personal big board without accounts, logins, or servers.

## Features

- **Drag-and-drop reordering** with touch support
- **Tier breaks** — insert and label custom tiers between players
- **Position and team filters** with multi-select
- **Age and bye-week range filters**
- **Full-text player search**
- **Star / flag** high-priority players
- **Per-player notes** via modal
- **CSV import and export** (round-trips cleanly)
- **Undo / redo** with keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`)
- **Dirty indicator** — glows when there are unsaved changes
- **Ad column slots** — left/right sidebar and sticky banner placeholders
- **No sign-up, no backend, no cookies** — runs entirely in the browser

## Project Structure

```
rankAnything/
├── big-board.html              # The entire application — single deployable file
├── .github/
│   ├── copilot-instructions.md # Always-on guidance for GitHub Copilot / VS Code
│   ├── CLAUDE.md               # Always-on guidance for Claude Code
│   ├── prompts/                # Slash-command prompt templates
│   └── skills/                 # Reusable agent skill library
│       ├── SKILL_MAP.md        # Central skill registry (read first)
│       ├── frontend-design/    # Production-grade frontend design skill
│       ├── ui-ux-pro-max/      # UI/UX design intelligence (50+ styles, palettes)
│       └── ...                 # Governance, logging, and workflow skills
├── docs/
│   └── NONSPECIFIC_SKILLS.md   # Portable workflow handbook
└── logging/
    ├── progress_log.md         # Material change record
    └── commit_log.md           # Commit history log
```

## Getting Started

Open `big-board.html` in any modern browser — no build step, no server, no install.

To publish:
1. Edit `DEFAULT_PLAYERS` in the `<script>` block to seed your player list.
2. Replace the `<!-- INSERT AD TAG HERE -->` comments with your ad network tags.
3. Deploy the single HTML file to any static host (GitHub Pages, Netlify, S3, etc.).

## CSV Format

Import/export uses these column headers (case-insensitive):

| Column | Required | Notes |
|--------|----------|-------|
| `name` | Yes | Player full name |
| `position` | Yes | QB / RB / WR / TE / D/ST / K |
| `team` | Yes | NFL team abbreviation |
| `age` | Yes | Integer; 0 = not tracked |
| `byeWeek` | Yes | Integer 1–18; 0 = not tracked |
| `rank` | No | Integer; used to restore order on import |
| `starred` | No | true / false |
| `note` | No | Free text |
| `tiersAbove` | No | true / false |

## Agent Workflow

All AI agents working in this repo must read `.github/skills/SKILL_MAP.md` first.

Key skills for frontend work:
- [`frontend-design`](.github/skills/frontend-design/SKILL.md) — production-grade, distinctive frontend interfaces
- [`ui-ux-pro-max`](.github/skills/ui-ux-pro-max/SKILL.md) — comprehensive UI/UX design intelligence

## Design Principles

- **No sign-up** — zero friction, maximum reach
- **Single file** — deploy anywhere, no build pipeline
- **Dark-first** — deep navy theme built for long sessions
- **Ad-ready** — sticky sidebar and banner slots baked in
- **Accessible** — keyboard navigation, focus management, ARIA labels, reduced-motion support
