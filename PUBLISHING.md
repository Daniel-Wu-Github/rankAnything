# Publishing Guide — Rank Anything

A step-by-step checklist to go from this repo to a live site, free of charge, on **Cloudflare Pages**.

Cloudflare Pages was chosen over the AWS S3 + CloudFront + Route 53 stack this
guide used previously because it has no fixed monthly cost at any traffic
level: no hosted-zone fee, no per-request billing on the free tier, and free
HTTPS. The old AWS runbook is cheap but not actually free — Route 53 alone
charges $0.50/month per hosted zone regardless of traffic.

One build produces the whole site: `site/build.mjs` prerenders the generic
app into `site/dist` **and** copies `big-board.html` into `site/dist/football/`
verbatim, so a single Cloudflare Pages project serves both products.

---

## Step 1 — Push the repo to GitHub

```bash
git push
```

If you haven't authenticated yet:

```bash
gh auth login        # follow the browser prompt
git push
```

---

## Step 2 — Create a Cloudflare account and connect the repo

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/) — free, no credit card required.
2. Go to **Workers & Pages → Create → Pages → Connect to Git**.
3. Authorize Cloudflare's GitHub app and select this repository.

---

## Step 3 — Configure the build

In the project setup screen:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `node site/build.mjs` |
| Build output directory | `site/dist` |
| Root directory | `/` |

Environment variable (optional, for correct canonical URLs / sitemap):

| Variable | Value |
|---|---|
| `SITE_ORIGIN` | `https://yourdomain.com` (or leave unset to use the `*.pages.dev` URL) |

Click **Save and Deploy**. The first build takes ~1 minute; Cloudflare gives
you a live URL at `https://<project-name>.pages.dev` immediately.

---

## Step 4 — Verify the deploy

Visit `https://<project-name>.pages.dev/` (Rank Anything home) and
`https://<project-name>.pages.dev/football/` (the frozen big board) — both
should load.

---

## Step 5 — (Optional) Add a custom domain, still free

1. In the Pages project, go to **Custom domains → Set up a custom domain**.
2. Enter your domain (e.g. `rankanything.yourdomain.com`).
3. If your domain's nameservers are already on Cloudflare (free plan), the
   DNS record is created automatically. If not, Cloudflare gives you a CNAME
   to add at your existing DNS provider — no need to move DNS to get a free
   custom domain.
4. HTTPS is issued and renewed automatically — no ACM certificate, no manual
   renewal.

If you set `SITE_ORIGIN` in Step 3, update it to match this domain and
trigger a redeploy (**Deployments → Retry deployment**, or push a commit) so
OG/canonical URLs point at the real domain.

---

## Step 6 — Update social preview placeholders in big-board.html

Open `big-board.html` and replace every instance of `PLACEHOLDER_DOMAIN.com`
with your real domain in the OG/Twitter meta tags:

```html
<meta property="og:url"   content="https://yourdomain.com/football/" />
<meta property="og:image" content="https://yourdomain.com/og-image.png" />
<meta name="twitter:image" content="https://yourdomain.com/og-image.png" />
```

Add a `1200×630 px` image as `og-image.png` to `site/` (or wherever the build
copies static assets from) so it ships in `site/dist` and is served at that
URL.

---

## What auto-deploys on every push to main

```
git push → Cloudflare Pages detects the push → runs `node site/build.mjs` → deploys site/dist → live in ~1 minute
```

No GitHub Actions workflow, no AWS credentials, no manual `deploy.sh` step —
Cloudflare Pages watches the connected branch directly. Preview deploys are
also created automatically for every non-`main` branch and pull request, at
no extra cost.

---

## Cost summary

| Resource | Cloudflare Pages | Previous AWS stack |
|---|---|---|
| Hosting/build | $0, unlimited requests on free tier | S3 storage + request charges |
| Bandwidth | $0, unmetered | CloudFront: free tier only for a new account's first 12 months, then billed |
| HTTPS certificate | $0, automatic | $0 (ACM), but requires CloudFront in front of it |
| Custom domain / DNS | $0 | Route 53 hosted zone: $0.50/month minimum, plus query charges |
| CI/CD | $0, built in | GitHub Actions minutes (free tier is generous but finite) + AWS IAM setup |

The only cost that can ever appear is buying the domain name itself, which is
independent of hosting choice.
