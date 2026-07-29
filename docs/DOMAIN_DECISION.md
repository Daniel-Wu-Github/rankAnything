# Custom Domain Decision — Launch Gap #6 (Ads/Monetization)

**Date:** 2026-07-28
**Status:** DECIDED (not yet purchased). Priority order chosen; no domain
bought yet. This doc is the reference for whoever executes the purchase +
wiring.

---

## Why this exists

`FOOTBALL_V1_LAUNCH_GAPS.md` item 6 (ads) flagged that AdSense approval is
measurably pickier about a bare `*.pages.dev` subdomain than a real custom
domain, since `pages.dev` is a shared domain hosting thousands of unrelated
Cloudflare Pages sites. A custom domain is needed before applying for ads.

## Decision: priority order, not a single pick

Given the product's monetization is unproven (no traffic/revenue yet), the
call is to **not overspend on the domain before there's evidence the site
earns anything back**. Priority order, cheapest realistic option first,
with room to upgrade later without relaunching (a domain swap post-launch
is just a redirect + re-verify ads, not a rebuild):

1. **`rankanything.net`** — first choice. ~$10-11/yr at Cloudflare
   Registrar (at-cost, no markup), same registrar already hosting the
   Cloudflare Pages deploy — zero extra account/DNS setup. `.net` reads
   as a legitimate, standard TLD (not a novelty/cheap one), which is what
   matters for AdSense trust — the exact problem this purchase solves.
2. **`getrankanything.com`** — fallback if `.net` becomes undesirable.
   Also ~$8-10/yr at Cloudflare Registrar. Keeps the `.com` TLD (the
   single most trusted TLD) at the cost of a slightly longer domain name,
   since `rankanything.com` itself is unavailable (registered since 1999,
   parked, not for sale).
3. **`rankanything.xyz`** — last-resort fallback. ~$8-9/yr. Cheapest
   option but `.xyz` reads as a lower-trust TLD to both users and ad
   reviewers; only use if both options above are somehow off the table.

**Explicitly ruled out:** `rankanything.io` (~$34-35/yr) and `rankanything.co`
(~$30-50/yr, and not even sold by Cloudflare Registrar — would need a
second registrar account). Both cost 3-5x the chosen options for a brand
trust bump that isn't worth it before the site has any revenue signal.

## Live availability check (confirmed via RDAP, 2026-07-28)

| Domain | Status |
|---|---|
| `rankanything.com` | Taken (registered 1999, parked) |
| `rank-anything.com` | Taken |
| `rankanything.app` | Taken |
| `rankanything.net` | **Available** |
| `getrankanything.com` | **Available** |
| `rankanything.xyz` | **Available** |
| `rankanything.io` | Available (ruled out — cost) |
| `rankanything.co` | Available (ruled out — cost + no Cloudflare support) |

## Action items when executing this (not done yet)

1. Buy `rankanything.net` via Cloudflare Registrar (dashboard →
   Registrar → Register a domain).
2. Point it at the existing Cloudflare Pages project (same account, so
   this is a DNS attach, not a migration).
3. Update `SITE_ORIGIN` per `PUBLISHING.md` build step, and the hardcoded
   `og:image`/`twitter:image`/canonical URLs in `big-board.html` (currently
   `rankanything.pages.dev`) to `rankanything.net`.
4. Re-verify the OG image and social meta tags render correctly at the
   new domain before applying for AdSense.
5. If `.net` ever needs to be dropped for `getrankanything.com` or
   `.xyz`, repeat steps 2-4 with the new domain — no code architecture
   changes required, this is a config/meta-tag change only.
