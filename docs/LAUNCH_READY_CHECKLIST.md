# Launch-Ready Checklist — everything queued behind the domain purchase

**Date:** 2026-08-11. **Steps 1-2 executed:** 2026-08-17.
**Purpose:** the moment `rankanything.net` resolves, this is the exact
sequence of work. Nothing here needs investigation — it's all decided,
scoped, and ready to execute. The user-facing explanation of costs, revenue
and trade-offs lives in the chat transcript, not here; this file is the
execution plan.

**Current status:** domain live, Step 1 (domain swap) and Step 2
(analytics) both done and verified in production. Step 3 (ads) remains
gated on traffic — not started. See `logging/progress_log.md` Entry 020
for the full execution record.

---

## Status: what is already done

| Item | State |
|---|---|
| `SITE_ORIGIN` build variable | Already plumbed through `site/build.mjs` → canonical URLs, sitemap, OG image URLs. One env var flip. |
| OG share image | Shipped, wired into **all** page shells (`{{OG_IMAGE}}`) + `/football/`. Already says `rankanything.net`. |
| PNG export watermark | Shipped. Already says `rankanything.net`. |
| Security headers | Live and production-verified (CSP, HSTS, frame rules, `/embed/*` exception). |
| Favicon / manifest / 404 | Live. |
| Mobile touch reorder | Fixed and production-verified. |
| Ad slot markup | In place on `/` and `/t/*`, inert by default, previewable via `?ads=preview`. |
| `track()` instrumentation | Already firing GA4-shaped events into `window.dataLayer` (currently a no-op). |
| e2e gate | 54 tests green. |

---

## Step 1 — Domain swap — DONE 2026-08-17

Trigger: `rankanything.net` resolves and is attached to the Pages project.

1. ✅ `SITE_ORIGIN=https://rankanything.net` set in the Pages project's
   production build env vars (via Cloudflare API, `pages:write` scope).
2. ✅ Hardcoded `rankanything.pages.dev` in `big-board.html` (`og:url`,
   `og:image`, `twitter:image`) updated to `rankanything.net` — commit
   `da83c47`.
3. ✅ Rebuilt + verified: canonical tags, `sitemap.xml`, and OG image URLs
   all confirmed pointing at the apex domain (checked directly in build
   output before pushing).
4. ⏭ Not done via an external scraper (opengraph.xyz) — verified instead
   by direct `curl` of the live canonical/OG tags. Functionally equivalent
   confirmation; a visual social-card check is still worth doing before
   any real marketing push.
5. ✅ `www.` → apex redirect live: Cloudflare Redirect Rule (wildcard
   pattern `https://www.rankanything.net/*` → `https://rankanything.net/${1}`,
   301, query string preserved). Both apex and `www` custom domains
   attached to the Pages project.
6. ✅ e2e gate re-run (58/58) against the real built output before pushing;
   pushed (`da83c47`, then `0f093ce` for Step 2).

**Acceptance — verified:** `curl -sI https://rankanything.net/` → 200 with
full security headers; `www.rankanything.net` → 301 to apex; `/football/`
and `/t/nba-goats/` both serve 200.

**How it was executed:** `wrangler` CLI installed locally and OAuth-authed
to the Cloudflare account. Its OAuth grant covers `pages:write` (used for
custom-domain attach + env var updates via direct Cloudflare API calls,
since `wrangler` itself has no `pages domain add` subcommand) but **not**
`dns_records` or zone Rulesets edit permissions — those two pieces (the
CNAME records and the redirect rule) were done manually in the Cloudflare
dashboard by the user, with step-by-step instructions provided.

---

## Step 2 — Analytics — DONE 2026-08-17

GA4 property "Rank Anything" created; Measurement ID `G-JXLQHVLZM0`.

1. ✅ `GA_MEASUREMENT_ID` added as a Pages production build env var; a new
   `{{ANALYTICS}}` token in `build.mjs` (gated on the env var, empty string
   when unset) stamps the `gtag.js` snippet into all **four** `site/`
   shells that carry the placeholder (`index`, `board`, `sort`, `404`) —
   `embed.html` was never given the placeholder and stays untouched by
   design. `404.html` was switched from a raw `cpSync` copy to `stamp()`
   so it could receive the token.
2. ✅ `big-board.html`'s placeholder replaced with the real snippet
   (buildless file — pasted directly, per the bug-fix-shaped-edit rule for
   the frozen file).
3. ✅ CSP updated in the same commit: `https://www.googletagmanager.com`
   added to `script-src`, `https://www.google-analytics.com` +
   `https://*.google-analytics.com` + `https://*.analytics.google.com`
   added to `connect-src`, across all 9 path blocks in `site/_headers`
   (the file repeats the CSP per-path on purpose — see the comment block
   at its top — so every occurrence needed the same edit, done via
   `replace_all` on the shared substring).
4. ✅ 58/58 e2e green (including CSP-violation checks) run against the
   real built output, with the GA snippet live, before pushing.
5. ✅ Verified live: GA snippet present on `rankanything.net/` and
   `/football/`; CSP header confirmed correct via `curl`; **user confirmed
   in GA4 Realtime** — an active session and `page_view` event landed.

**Acceptance — met:** GA4 Realtime showed a real event from a real visit,
`security.spec.ts` stayed green throughout.

**One operational snag worth remembering:** the env var update landed via
API *after* a deploy had already run (triggered by the same push), so that
first deploy shipped with an empty analytics snippet. Fixed by retrying
that specific deployment via the Cloudflare API once the env var was
confirmed set — a reminder that a Pages env var change only takes effect
on deploys that start after it's saved, not retroactively.

---

## Step 3 — Ads (only if traffic justifies it; see the ad-preview evidence)

**Gate this on ~10k monthly pageviews.** Below that the payout is
unreachable and the UX cost is real and measured (mobile: 3 rows above the
fold → 1). Do not start this before Step 2 has produced data.

### 3a. Compliance (required before applying — Google rejects without it)

1. **Privacy policy page** at `/privacy/` — new prerendered page in
   `site/build.mjs`, linked from the footer of every shell. Must disclose
   cookies, Google as a third-party ad vendor, and analytics.
2. **Cookie consent banner** for EEA/UK (Google's EU User Consent Policy).
   Zero-dependency, localStorage-backed, dark-theme-matched. Must gate
   personalized ads *and* analytics until consent, and be dismissible/
   changeable. Needs its own a11y pass (focus trap, Escape, `aria-modal`) to
   stay inside the existing axe gate.
3. Footer link to the privacy policy on every surface including `/football/`.

### 3b. Application (user's part)

- Apply at [google.com/adsense](https://www.google.com/adsense/start/) with
  `rankanything.net`. Requires payment address + phone verification (yours).
- Approval: typically 24 hours to 2 weeks.
- Google issues a verification snippet → hand it to me for placement.

### 3c. Wiring (mine, post-approval)

- Replace the preview `.ad-slot` divs with real AdSense units; the `data-ads`
  attribute hook already exists so this is a swap, not a layout change.
- Add `pagead2.googlesyndication.com` + `googleads.g.doubleclick.net` to the
  CSP `script-src`/`frame-src`. **`frame-ancestors` must stay untouched** —
  ad iframes are `frame-src`, a different directive; conflating them would
  break `/embed/`.
- `_headers` currently sets `frame-ancestors 'none'` on content pages; ads
  render in child iframes, which that does not block. Verify anyway.
- Re-measure above-the-fold rows after real units load (real ads reflow more
  than fixed-size placeholders — expect worse than the preview).

**Acceptance:** ads render, `security.spec.ts` green, Lighthouse/CLS not
materially worse, and the mobile row count is still tolerable.

---

## Settled decisions (2026-08-11)

Both were open questions in the previous revision of this file; both are now
closed, and the code matches.

- **The football URL stays `/football/`.** Not `/fantasy/`. No redirect, no
  `_redirects` file, nothing to do — it is already deployed, tested, in the
  sitemap and in the OG tags.
- **`/football/` (`big-board.html`) is the one and only football board.**
  The generic-engine duplicate (`site/templates/fantasy-football-2026.json`)
  was deleted, together with `scripts/build-fantasy-football-template.mjs`
  and the ADP snapshot it consumed. `FOOTBALL_ENGINE_MIGRATION_PLAN.md` is
  cancelled. `site/` now ships 12 non-football templates plus custom boards.

Consequence worth remembering: **football and the generic engine are now
permanently separate products** that happen to share a domain and a design
language. A feature added to `site/` does not reach `/football/`, and
`big-board.html` stays frozen with no migration planned. That is the
intended end state, not a temporary situation.

---

## Explicitly NOT doing (and why)

- **Ads before 10k pageviews** — measured UX cost, unreachable payout.
- **Buying a domain to chase ad revenue** — the revenue doesn't justify it at
  realistic traffic; the domain is worth it for ownership/credibility alone.
- **`.xyz` to save ~$2/yr** — saves nothing meaningful, costs the exact trust
  signal the purchase exists to buy.
- **ESPN/Yahoo ranking scrapes** — permanently ruled out; both `robots.txt`
  files name-block Anthropic crawlers. Not a deferral.
