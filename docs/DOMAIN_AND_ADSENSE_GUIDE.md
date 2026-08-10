# Domain + AdSense Guide (the parts only you can do)

**Date:** 2026-08-10
**Who does what:** everything in this doc requires either a payment method or
an identity/tax verification, which is why it's yours rather than mine. All
the code-side work it depends on is already done and deployed.

---

## Part 1 — The honest money question first

You asked whether `.net` is worth paying for if the site likely earns nothing.
Here's the actual arithmetic rather than a vibe.

### What AdSense pays

Revenue is quoted as **RPM** — dollars per 1,000 pageviews. Published 2026
benchmarks put **sports content at roughly $9–18 RPM**
([adstimate](https://adstimate.com/blog/niche/sports-adsense-rpm.html)),
but that figure is for *content* sites — articles, where readers land from
search, scroll, and view several pages.

Rank Anything is a **utility tool**, and that matters a lot:

- One session ≈ one pageview. Someone opens a board, drags for ten minutes,
  leaves. Content sites get 2–4 pageviews per session; you'll get ~1.
- No article inventory means fewer ad slots per view.
- Tool traffic converts worse for advertisers than "best running shoes 2026"
  intent traffic.

So a realistic planning number for you is **$3–6 RPM**, not $9–18. I'd budget
$4 and treat anything above it as upside.

### What that means in dollars

| Monthly pageviews | @ $4 RPM (realistic) | @ $9 RPM (optimistic) | @ $18 RPM (best case) |
|---|---|---|---|
| 1,000 | **$4/mo** | $9/mo | $18/mo |
| 5,000 | **$20/mo** | $45/mo | $90/mo |
| 25,000 | **$100/mo** | $225/mo | $450/mo |
| 100,000 | **$400/mo** | $900/mo | $1,800/mo |

**The threshold that actually matters:** Google does not pay you until your
balance reaches **$100** ([AdSense payment
threshold](https://www.monetizemore.com/blog/the-adsense-payment-threshold-explained/)).
Below ~25,000 pageviews/month at a realistic RPM, you are not getting a
payout this year — the money accrues in an account you can't withdraw from.

At 1,000 pageviews/month you'd wait **over two years** to see the first $100.

### So: is `.net` worth it?

**Yes — but not for the revenue reason.** Reframe it:

- A domain is **~$10–11/year**. That's under a dollar a month. It is not a
  meaningful financial decision, and analyzing it as an investment against
  uncertain ad revenue is over-thinking a rounding error.
- What it actually buys you is **optionality and credibility**: a real domain
  you own, that you can point anywhere, that doesn't vanish if Cloudflare
  changes its subdomain policy, and that doesn't look like a hobby project
  when someone shares a link. `rankanything.pages.dev` in a group chat reads
  as a test deploy; `rankanything.net` reads as a product.
- AdSense approval is **measurably harder on a bare `*.pages.dev` subdomain**,
  because it's a shared domain hosting thousands of unrelated sites. This is
  the specific blocker from `FOOTBALL_V1_LAUNCH_GAPS.md` item 6.

**But** — and this is the part worth internalizing — **don't buy the domain
because you expect ad revenue to repay it.** At your likely traffic, it
won't for a long while. Buy it because $10/year is cheap for owning your own
address, and because it unblocks even trying ads.

### Should you go cheaper than `.net`?

Reconsidered honestly, as you asked:

| Option | Cost/yr | Verdict |
|---|---|---|
| **`rankanything.net`** | ~$10–11 | **Recommended.** Standard, trusted TLD. The $1–2/yr you'd save going cheaper is not worth any trust penalty when the entire point is looking legitimate to an ad reviewer. |
| `getrankanything.com` | ~$8–10 | Fine alternative. `.com` is the most trusted TLD; the cost is a longer, more awkward name. Pick this only if you prefer `.com` strongly. |
| `rankanything.xyz` | ~$8–9 | **Don't.** Saves ~$2/year and `.xyz` carries a real spam association with both users and ad reviewers. You'd be optimizing the one variable that shouldn't be optimized, to save the price of a coffee. |

The spread between all three is **under $3/year**. There is no meaningful
money here — pick `.net` and stop thinking about it.

**A genuinely reasonable alternative:** don't buy anything yet. Ship on
`pages.dev`, see whether anyone actually uses the site for a month, and buy
the domain when there's a reason to. You lose nothing but the AdSense
application lead time. If traffic never materializes, you've saved $11 and,
more importantly, the hours that ad setup costs.

---

## Part 2 — Buying the domain (Cloudflare Registrar)

Cloudflare Registrar sells at wholesale cost with no markup and no
first-year-cheap-then-renewal-spike pricing. Your site is already on
Cloudflare Pages, so this is also the least-setup option.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/) → **Domain
   Registration** → **Register Domains**.
2. Search `rankanything.net`. (Availability was confirmed 2026-07-28, but
   re-check — domains get taken.)
3. Complete purchase. **This is the step only you can do — it charges a real
   card.** ~$10–11 for the year.
4. Registrant contact info: use real details. WHOIS privacy is included free
   by Cloudflare, so your details are not published.
5. Turn **auto-renew ON**. A lapsed domain that someone else grabs is a much
   worse outcome than $11/year.

### Attaching it to the site

Because the domain and the Pages project are in the same Cloudflare account,
this is a few clicks, not a migration:

1. **Workers & Pages** → your Pages project → **Custom domains** → **Set up a
   custom domain**.
2. Enter `rankanything.net`. Cloudflare creates the DNS record automatically.
3. Add `www.rankanything.net` too, and set it to redirect to the apex — so
   both work and only one is canonical for SEO.
4. HTTPS provisions automatically within a few minutes.

### Then tell me, and I'll do the code side

Once it resolves, the remaining work is mine and takes one short session:

- Set `SITE_ORIGIN=https://rankanything.net` in the Pages project's build
  environment variables — this already flows into canonical URLs, the
  sitemap, and OG image URLs via `site/build.mjs`.
- Update the hardcoded `rankanything.pages.dev` references in
  `big-board.html`'s OG/Twitter meta tags.
- Re-verify the OG preview renders at the new domain.

**One thing to know:** the OG share image and the PNG export watermark
already say `rankanything.net` — they were designed for it. Until you buy the
domain, that text is aspirational. After you buy it, everything matches.

---

## Part 3 — AdSense setup

**Do this only after the domain resolves.** Applying from `pages.dev` is the
thing most likely to get you rejected, and a rejection makes re-application
slower.

### Before applying — the compliance gate

Google requires these, and will reject you without them. **None of them exist
yet** — this is real work still outstanding, not a formality:

1. **A privacy policy page**, disclosing that you use cookies/ads and that
   third parties (Google) collect data. Required for approval.
2. **A cookie-consent mechanism for EEA/UK visitors.** Google's EU User
   Consent Policy requires it before serving personalized ads. Practically:
   a consent banner, or a Google-certified CMP.
3. **Enough content that the site doesn't read as "thin."** You have 13
   template pages plus the football board, which is a reasonable base, but
   Google is stricter about tools than about article sites.

I can build all three (privacy policy page, consent banner, and the ad slot
wiring) — say the word and they go in the next session. They're deliberately
*not* built yet because they're pointless before a domain exists.

### The application

1. [google.com/adsense](https://www.google.com/adsense/start/) → sign up with
   your Google account.
2. Enter `rankanything.net` as your site.
3. Payment address + phone verification. **Yours to do — it's identity
   verification tied to you personally.**
4. AdSense gives you a verification snippet. Send it to me and I'll place it
   correctly across every page shell (there are 5 shells plus the frozen
   football file; they need slightly different handling).
5. Submit for review. **Typically 24 hours to 2 weeks**
   ([approval process](https://innopanda.com/google-adsense-in-2026/)).

### After approval

- Ad slots already exist as `<div class="ad-placeholder">` in the markup —
  wiring real units into them is a small code task.
- Payment threshold is **$100**, paid around the 21st of the month after you
  cross it.
- You'll need tax info (W-9 for US) before the first payout.

### An honest warning about ads on this site

Ads will make the product measurably worse: slower loads, layout shift, and a
cluttered feel that fights the clean, professional aesthetic that is currently
the product's main advantage over TierMaker. At sub-25k pageviews, you're
trading real product quality for a payout you can't withdraw yet.

**My recommendation:** get the domain, ship, and leave ads off until you have
evidence of traffic worth monetizing (say, 10k+ monthly pageviews). Set up
analytics first, learn whether anyone shows up, and revisit. The roadmap
already gates the social features on traction evidence — same logic applies
here, and for the same reason.

---

## Part 4 — What's still on my side

Waiting on your decisions, not on my capacity:

| Task | Blocked on |
|---|---|
| Point the site at the real domain | You buying it |
| Privacy policy + consent banner | Domain (they're only needed for ads) |
| Wire real ad units into existing placeholders | AdSense approval |
| Analytics (GA4) — snippet placement | You creating a GA4 property and sending me the `G-XXXXXXXXXX` ID |

Analytics is the one I'd do **first** and independently of everything else.
It's free, takes ten minutes of your time to create the property, and it's
what tells you whether any of the rest is worth doing. The `track()` calls are
already instrumented throughout both products and are already in GA4's
`dataLayer` format — they're currently firing into a no-op.
