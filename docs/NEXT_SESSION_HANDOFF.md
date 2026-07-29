# Handoff — Domain Purchase + OG Image Wiring

**Date:** 2026-07-28
**For:** the next Claude Code session (or Daniel) picking this up.

---

## Paste-ready prompt for the next session

```
Read docs/DOMAIN_DECISION.md and docs/FOOTBALL_V1_LAUNCH_GAPS.md item 6
first. We decided on rankanything.net as the first-choice custom domain
(getrankanything.com, then rankanything.xyz as fallbacks) — needed before
applying for AdSense, since a bare *.pages.dev subdomain hurts approval
odds. Domain has NOT been purchased yet.

Also read docs/MOBILE_UX_PLAN.md's "Results" section and
logging/progress_log.md Entries 010-011 for context on the mobile UX work
that just shipped — unrelated to this task but recent history worth
knowing.

Do these in order:
1. Confirm rankanything.net is still available (RDAP or Cloudflare
   dashboard) before buying — availability can change.
2. Walk me through buying it via Cloudflare Registrar (I'll do the actual
   purchase click myself — don't attempt to buy anything autonomously,
   this costs real money). Once bought and attached to the existing
   Cloudflare Pages project:
3. Update SITE_ORIGIN and all hardcoded rankanything.pages.dev references
   in big-board.html (og:image, twitter:image, canonical URL, any other
   absolute URLs) to rankanything.net. Grep for "pages.dev" to find all of
   them — don't assume the list above is exhaustive.
4. Land the final OG image as a real asset. The approved design is
   "Option A" — mock board card + "The 2026 Fantasy Football Big Board."
   headline + "No sign-up · no app · no login" kicker. It was prototyped
   as HTML + a Playwright screenshot in a scratchpad during the design
   session (not committed anywhere) — the HTML source described below is
   your basis; regenerate it from scratch rather than assuming a rendered
   PNG survived, since scratchpad paths don't persist across sessions.
   Save the final PNG at 1200x630 into site/ (see PUBLISHING.md's
   guidance: "add og-image.png to site/ ... so it ships in site/dist").
   Then add a static-asset copy step to site/build.mjs (there isn't one
   today — cpSync calls only cover src/js, src/css, and per-template
   pages) so og-image.png lands at dist/og-image.png.
5. Wire the export watermark: a small pill mark ("● rankanything.net",
   accent-blue dot, dark translucent pill) drawn onto the PNG export
   canvas in initImageExport() in big-board.html, bottom-right corner,
   ~65-75% opacity, before toBlob()/download. Extend
   e2e/tests/bigboard.spec.ts's "CSV and image exports download" test (or
   add a new spec) to assert the watermark pixels/text are present so it
   can't silently regress.
6. Full e2e gate must stay green (36/36 today) before considering this
   done.
7. Log the work in logging/progress_log.md per CLAUDE.md's requirement.
8. Do not commit or push without explicit confirmation — ask first, and
   keep this scoped to big-board.html + site/build.mjs + the new asset +
   e2e specs + logging, nothing else.
```

---

## Context a fresh session won't have

- **Brand direction locked in:** dark theme (`#0d1017`/`#141923` panels,
  `#38bdf8` accent), DM Sans/DM Mono fonts, position badge colors already
  defined in `big-board.html` (`--qb-full: #f87171`, `--rb-full: #34d399`,
  `--wr-full: #60a5fa`, `--te-full: #fb923c`). Any new brand asset should
  reuse these tokens, not invent new ones.
- **OG image copy, as approved:**
  - Kicker: "No sign-up · No app · No login"
  - Headline: "The 2026 Fantasy Football **Big Board.**" (accent color on
    "Big Board.")
  - Subhead: "Free, no-account rankings that work in your browser. Drag to
    reorder, set tier breaks, filter by position or team — and it's
    yours."
  - Feature tags: "Drag to reorder" / "Tier breaks" / "CSV export"
  - URL line: "rankanything**.net**/football"
  - Right side: a tilted mock board card (2° rotation) showing 6 sample
    rows (Bijan Robinson, Ja'Marr Chase, Breece Hall, tier line, CeeDee
    Lamb, Josh Allen, Sam LaPorta) with position badges, a live-dot
    indicator, and a drag-handle glyph — built to visually match the real
    product, not a generic stock graphic.
  - Two other directions (bold stat/broadcast style, centered card over a
    blurred tier-list background) were shown and rejected in favor of
    this one — don't re-propose them unless asked.
- **Why `.net` over `.com`/`.io`/`.co`:** cost discipline, not brand
  preference — see `docs/DOMAIN_DECISION.md` for the full reasoning
  (monetization is unproven, so this session chose the cheapest
  legitimate-TLD option rather than the "best" one).
- **Existing asset gap:** `site/build.mjs` currently has no step that
  copies any root-level static file (image, favicon, etc.) into
  `site/dist` — only `src/js`, `src/css`, and generated per-template
  pages get copied. `og-image.png` will be the first static image asset
  the build needs to ship, so that copy step needs to be added, not
  assumed to already exist.
