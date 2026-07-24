# Rank Anything

Rank anything in seconds: paste a list or pick a template, then **drag it, tier it, or let this-or-that decide** — and share the whole board as a link or an image. No sign-up, no backend; every board lives in the browser and in any URL you share.

Born as a fantasy football big board (still served, frozen, at `/football/`), now a general ranking site.

## The two products in this repo

| | What | Where |
|---|---|---|
| **Rank Anything** | Schema-driven ranking engine: board table, tier lanes, and pairwise this-or-that — three views over one state. 12 curated templates + paste-your-own-list. Share-by-URL (the entire board is in the fragment), PNG export, CSV round-trip, iframe embeds. | `site/` → built to `site/dist` |
| **Big Board** | The original single-file fantasy football board. Feature-frozen; ships verbatim at `/football/`. | `big-board.html` |

## Features (generic app)

- **Three ranking modes over one state** — drag-and-drop board, tier-lane grid, and pairwise "this or that" (binary-insertion, ~n·log n choices), switchable without data loss
- **Paste-a-list → instant board** — numbers/bullets stripped, under 10 seconds to first ranking
- **Share the whole board as a URL** — gzip-compressed state in the fragment; no server ever sees it
- **PNG image export** and **CSV import/export** (RFC-4180, formula-injection guarded)
- **Embeds** — read-only iframe widget with a "rank this yourself" CTA
- **Keyboard-first accessibility** — Space lifts, arrows move, Space drops, Escape cancels; aria-live announcements; axe gate of 0 critical/serious violations in CI
- **Zero runtime dependencies, no bundler** — native ES modules + a zero-dep node build

## Getting Started

```bash
node site/build.mjs               # prerenders site/dist (26 indexed pages)
node e2e/server.mjs               # serves site/dist on http://127.0.0.1:4300
cd e2e && npm install && npm test # 23-test Playwright + axe gate
```

`big-board.html` still opens directly in any browser, no build step.

To publish: deploy `site/dist/` to any static host (set `SITE_ORIGIN=https://yourdomain.com` when building for correct canonicals/sitemap), replace the `<!-- ANALYTICS PLACEHOLDER -->` comments with your analytics snippet, and the ad slots in `big-board.html` with your ad tags. See `PUBLISHING.md` for the free Cloudflare Pages walkthrough.

## Project Structure

```
rank-anything/
├── big-board.html         # FROZEN original football board (served at /football/)
├── site/
│   ├── src/js/            # engine, views (board/tiers), pairwise, share, csv, image
│   ├── src/pages/         # shells: home, board, sort, embed
│   ├── templates/*.json   # 12 curated templates (schema + items)
│   └── build.mjs          # zero-dep static build → site/dist
├── e2e/                   # Playwright gate (23 tests, see e2e/README.md)
├── docs/RANK_ANYTHING_ROADMAP.md  # approved roadmap (Step 2 social is traction-gated)
├── .github/skills/        # agent skill library (SKILL_MAP.md first)
└── logging/               # progress + commit logs
```

## CSV Format (football board)

The generic app derives its CSV columns from each template's schema (`rank, name, <schema keys…>, starred, note, tiersabove`). The frozen football board uses these column headers (case-insensitive):

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

- **No sign-up** — zero friction, maximum reach; the URL is the account
- **Static bundle** — deploy anywhere; no backend, no runtime dependencies (`big-board.html` remains a true single file)
- **Dark-first** — deep navy theme built for long sessions
- **Ad-ready** — analytics placeholder on every page; sidebar/banner ad slots in the football board
- **Accessible** — full keyboard ranking, aria-live announcements, focus management, reduced-motion support, axe-gated in CI
