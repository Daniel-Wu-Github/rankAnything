# Big Board — Pre-Launch Gap List (v1 public launch)

**Date:** 2026-07-24, updated 2026-07-25
**Scope:** originally `big-board.html` only (frozen single file, `/football/`).
Gaps and sentiment captured from a working session after Cloudflare Pages
deploy went live at `rankanything.pages.dev`. Not a roadmap rewrite — see
`RANK_ANYTHING_ROADMAP.md` for the two-product strategy this sits under.

**2026-08-11 update — SUPERSEDES the 2026-07-25 decision below.**
`/football/` (`big-board.html`) is the **single official football board**.
The generic-engine football template was deleted along with its builder
script and the ADP snapshot it consumed, and
`FOOTBALL_ENGINE_MIGRATION_PLAN.md` is **cancelled**.

Read the items below accordingly:
- Already **shipped in `big-board.html`** and still standing: mobile UX
  (#1), OG image (#2), export watermark (#3), real age/team/bye data.
- **#4 (ADP)** — the build-time fetch pipeline was built, then discarded
  with the template. The *research* stays valid and is worth keeping:
  Fantasy Football Calculator is the only free, no-auth, commercially-usable
  ADP provider; ESPN and Yahoo are permanently ruled out because their
  `robots.txt` name-blocks Anthropic crawlers. If ADP is ever wanted on
  `/football/` it must arrive as **data**, via a refresh script like
  `scripts/refresh-bigboard-data.mjs` — not as new UI. The frozen-file rule
  still applies.
- **#12 (player hub modal)** and ADP presets are **not planned**. They were
  the two items that motivated the migration; with the migration cancelled
  and the file frozen, they are out of scope rather than pending.
- **#6/#7 (ads + the privacy/consent compliance gate)** remain live, and now
  apply to `/football/` and the 12 generic templates.

<details><summary>Original 2026-07-25 decision (superseded — kept for history)</summary>

Two items on this list (ADP presets, a player detail modal) are new
features, not bug fixes, which conflicts with `big-board.html`'s explicit
frozen-file rule in `CLAUDE.md`. Resolved: football's remaining v1 gaps will
be migrated into `site/`'s generic schema-driven engine instead of built
into the frozen file. Items below are written up as originally scoped
(against the frozen file).

</details>

---

## User's original v1 list — assessed item by item

| # | Item | Verdict | Why |
|---|---|---|---|
| 1 | **Truly professional mobile UX** | **Ship in v1** | Pure CSS/JS, no architecture risk, fits the frozen-file constraint. Confirmed via Playwright screenshot that mobile currently *works* but doesn't reflow well (filter panel and secondary table columns just get narrower rather than collapsing). Highest-ROI polish item given ranking-and-sharing is inherently a mobile/social action. |
| 2 | **OG share image** | **Ship in v1** | Currently missing entirely — the meta tag points at a 404. For a share-driven product this is core to the acquisition loop, not cosmetic: a shared link with no preview image gets far fewer clicks. |
| 3 | **Lightweight watermark on exports** | **Ship in v1** | Cheap, no architecture risk. Every exported PNG without a mark back to the site is a missed acquisition loop. |
| 4 | **Import ADP from Sleeper / ESPN / Yahoo / Underdog (live, per-platform)** | **Rescope before building — verified 2026-07-25** | As stated ("click a platform, get live rankings") this needs a backend proxy for most sources, which conflicts with the project's own no-backend/no-login architecture. Facts below are tested directly (curl'd the actual endpoints), not recalled from memory: <br>• **Sleeper** — `api.sleeper.app` genuinely sends `access-control-allow-origin: *` (confirmed via curl), so it *is* client-side fetchable. But it has **no ADP endpoint** — only player metadata, rosters, leagues, drafts. There is no Sleeper ADP to fetch, live or otherwise, via their public API. <br>• **ESPN** — undocumented private endpoints, frequently CORS-blocked, breaks without notice, ToS is gray. <br>• **Yahoo** — requires OAuth login to reach their Fantasy API at all; a hard conflict with "no sign-up," not a workaround-able one. <br>• **Underdog** — no public API; requires scraping, which needs a server to dodge CORS/bot detection. <br>• **Fantasy Football Calculator** — real community ADP (aggregated from mock drafts on their site), confirmed free for **commercial** use with attribution, JSON, updates once/day. Tested directly: **no CORS headers at all**, so a browser fetch from the deployed site is blocked — but it's fine to fetch server-side/at build time. <br>• **FantasyPros** — "ADP aggregated from 130+ experts," a consensus number, not officially "Sleeper's" or "ESPN's" data specifically. Free tier is personal/non-commercial only — disqualified once ads monetize the site. Commercial tier exists but is sales-gated/custom pricing. Also server-side-only by design (API-key header, no CORS). <br>**The deeper issue**: none of these expose a literal per-platform "Sleeper's/ESPN's/Yahoo's official ADP" — that data is private to each platform. What's actually available is either Sleeper's player metadata (useful for auto-populating names/teams, not rankings) or an aggregator's own independent consensus number, which needs honest labeling ("Community ADP via Fantasy Football Calculator"), not platform-branded. <br>**Recommended v1 scope:** a build-time fetch script (small zero-dep Node script, same philosophy as `site/build.mjs`) that hits Fantasy Football Calculator's API during the build/deploy step — not in the visitor's browser — and writes a static JSON file shipped as part of the bundle. Run it manually before a redeploy, or schedule it (e.g. weekly during draft season). Keeps the deployed site fully static; freshness is "as fresh as your last build," which costs nothing since the source itself only updates daily anyway. True live per-platform sync stays a v2/explicitly-gated decision, mirroring how Step 2 social is already gated in the roadmap. |
| 5 | **Official player images next to name** | **Cut from v1 / scope down** | Two problems beyond engineering effort, not just "add an `<img>` tag": <br>• **Licensing** — hotlinking official league/CDN player photos is a different legal exposure once ads are monetizing the page than it is on an unmonetized personal project. <br>• **Reliability** — hotlinked images from ESPN/NFL CDNs commonly break via referrer checks or get rate-limited, an ugly failure mode on a board you can't easily patch around (frozen single file). <br>If wanted at all, scope to a single self-hosted, low-res icon set you actually have rights to use — not live-fetched official photos. |
| 6 | **Working ads (Google AdSense or similar)** | **Ship in v1, start now** | Placeholder `<div class="ad-placeholder">` slots already exist in the markup for exactly this. Non-obvious action item: **apply for AdSense approval now**, independent of when the code changes land — approval takes days and is often pickier about a bare `.pages.dev` subdomain than a real custom domain. If ads matter for v1, this is the argument for buying a custom domain sooner, even though the earlier "ship on `.pages.dev` for now" call still stands for everything else. |
| 12 | **Player hub modal** (click a player → popup with notes moved out of the table, plus schedule/stats) | **Ship, as a generic engine feature — added 2026-07-25** | Good idea and fits `site/`'s schema-driven design well: a template can declare which fields are `inline` (shown in the table) vs `detail` (shown only in the modal) — this generalizes to any ranking type, not just football, so it belongs in the engine, not a football-only bolt-on. Split into three pieces of different risk: <br>• **Notes → modal** — cheap, mostly a UI refactor of an existing field. <br>• **Schedule** — public, stable per season, no licensing risk (facts aren't copyrightable the way photos/branding are), trivial to bundle as static JSON. Low risk. <br>• **"Stats"** — vague as stated. If it means in-season box-score/weekly stats, that's a live, frequently-changing source with the same shape of problem as ADP (needs a build-time-refresh pipeline), and official stats APIs are commonly paid (Sportradar/SportsData.io tiers). Scope v1 down to something static (last season's finish, target share, bye week); treat live in-season stats as a v2 add-on reusing the ADP pipeline's infrastructure. <br>Needs a real accessible modal (focus trap, Escape to close, `aria-modal`, focus returns to trigger on close) — expected work given the project's existing axe gate and keyboard-first stance, not extra scope. |

---

## Additional gaps flagged this session (not in the user's original list)

| # | Item | Why it matters |
|---|---|---|
| 7 | **Privacy policy / consent banner for AdSense** | Google requires a privacy policy for AdSense participants, and in the EEA/UK their EU User Consent Policy requires a consent management mechanism before showing personalized ads. This is a compliance gate on item 6, not optional polish — should land *before* ads go live, not after. |
| 8 | **Analytics wiring** | `README.md`/`CLAUDE.md` still reference an `<!-- ANALYTICS PLACEHOLDER -->` comment block, unfilled. Ship-decision data (which templates get used, where people drop off) needs this live before or at launch, not retrofitted after. |
| 9 | **ADP snapshot freshness process** | If item 4 ships as static curated files (recommended), there's currently no documented cadence for refreshing them. A stale "2026 Sleeper ADP" file discovered by a user in-season quietly undermines the "professional tool" positioning. Needs an owner and a cadence (even if just "manually refresh monthly during draft season"), written down somewhere a future session can find. |
| 10 | **Ad-blocker / cross-browser QA as an ongoing practice** | The layout-squish bug fixed this session (CSS Grid auto-placement reflowing `.app` when an ad blocker hid the `<aside>` columns) is a class of bug, not a one-off — anything that assumes ad slots are always present in the DOM is a latent landmine. Worth a standing pre-launch checklist item: test with a default ad blocker on, not just clean Chromium. |
| 11 | **Performance / Core Web Vitals pass** | No stated check on load weight or Lighthouse score exists anywhere in the repo's gates today (the e2e suite covers correctness + a11y, not performance). Worth a baseline Lighthouse run before calling v1 done, especially once ads and any player-image assets (item 5) are in the mix — ad scripts and images are the two most common Core Web Vitals regressions. |

---

## Suggested v1 priority order

1. Mobile UX pass
2. OG image + export watermark
3. Notes → player modal (cheap UI refactor, ships independent of data-source work)
4. Build-time ADP fetch script (Fantasy Football Calculator) + static schedule data, both feeding the same static-snapshot pipeline
5. Apply for AdSense (lead time) + draft privacy policy/consent banner in parallel
6. Analytics wiring
7. Wire in ads once approved
8. Performance/Lighthouse baseline check
9. Player headshots — deferred to v2, revisit licensing before scoping
10. Live in-season stats in the modal — deferred to v2, reuse the ADP build-time pipeline once it exists

Explicitly **not** in this list because already validated: accessibility
(axe gate: 0 critical/serious, already enforced in CI), share-by-URL,
CSV round-trip, keyboard reordering — all shipped and covered by the e2e
gate per `RANK_ANYTHING_ROADMAP.md` P0.
