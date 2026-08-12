# Launch-Ready Checklist — everything queued behind the domain purchase

**Date:** 2026-08-11
**Purpose:** the moment `rankanything.net` resolves, this is the exact
sequence of work. Nothing here needs investigation — it's all decided,
scoped, and ready to execute. The user-facing explanation of costs, revenue
and trade-offs lives in the chat transcript, not here; this file is the
execution plan.

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

## Step 1 — Domain swap (~20 min, entirely mine, do immediately on purchase)

Trigger: `rankanything.net` resolves and is attached to the Pages project.

1. Set `SITE_ORIGIN=https://rankanything.net` in the Pages project's build
   environment variables (Settings → Environment variables → Production).
2. Update hardcoded `rankanything.pages.dev` in `big-board.html`:
   `og:url`, `og:image`, `twitter:image`. **Grep for `pages.dev`** — do not
   assume that list is complete.
3. Rebuild + verify: canonical tags, `sitemap.xml`, and OG image URLs all
   point at the apex domain.
4. Validate the social preview with a real scraper, not by eye —
   [opengraph.xyz](https://www.opengraph.xyz/) or X's card validator.
5. Confirm `www.` → apex redirect is in place (Cloudflare Pages custom-domain
   settings), so only one hostname is canonical for SEO.
6. Re-run the e2e gate; push.

**Acceptance:** `curl -sI https://rankanything.net/` returns 200 with the
security headers intact, and `/football/` + `/t/*` both serve.

---

## Step 2 — Analytics (independent of the domain; do as soon as a GA4 ID exists)

This is the highest-value next step and does **not** depend on ads. It's what
tells you whether any of Step 3 is worth doing.

Needs from the user: a GA4 **Measurement ID** (`G-XXXXXXXXXX`), created at
[analytics.google.com](https://analytics.google.com/) → Admin → Create
property → Web data stream. Free, ~10 minutes, no payment.

Then, mine:

1. Add `GA_MEASUREMENT_ID` as a build env var; stamp the `gtag.js` snippet
   into the `<!-- ANALYTICS PLACEHOLDER -->` block in all five `site/` shells
   via a new `{{ANALYTICS}}` token in `build.mjs` (so it's one place, not
   five copy-pastes, and stays empty when the var is unset).
2. `big-board.html` is buildless — paste the snippet directly into its
   placeholder block. This is a bug-fix-shaped edit to a frozen file; keep it
   to the placeholder.
3. **CSP must be updated in the same commit** or analytics is silently
   blocked: add `https://www.googletagmanager.com` to `script-src` and
   `https://*.google-analytics.com` to `connect-src` in `site/_headers`.
   The existing `security.spec.ts` CSP test will catch it if forgotten —
   that's what it's for.
4. Verify events actually arrive in GA4 Realtime (`board_opened`,
   `share_url`, `csv_export`, `image_export`, `sort_by`, `pairwise_complete`
   are all already instrumented).

**Acceptance:** GA4 Realtime shows a `board_opened` event from a real visit,
and `security.spec.ts` is still green.

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
