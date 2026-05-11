# Publishing Guide — Big Board 2026

A step-by-step checklist to go from this repo to a live site at your custom domain.

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

## Step 2 — Create an S3 bucket

1. Open the [AWS S3 console](https://s3.console.aws.amazon.com/).
2. Click **Create bucket** — give it a name (e.g. `my-bigboard`). Note the name; you'll use it throughout.
3. **Uncheck** "Block all public access" (CloudFront needs to read it).
4. After creation, go to **Permissions → Bucket policy** and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
  }]
}
```

5. Go to **Properties → Static website hosting → Enable**. Set index document to `index.html`.

---

## Step 3 — Request an ACM certificate (us-east-1 only)

1. Open [AWS Certificate Manager](https://console.aws.amazon.com/acm/) — **region must be us-east-1**.
2. Click **Request a public certificate**.
3. Enter your domain (e.g. `bigboard.yourdomain.com`). Choose **DNS validation**.
4. ACM gives you a CNAME record — add it to Route 53 (or your DNS provider). Validation takes ~2 minutes.

---

## Step 4 — Create a CloudFront distribution

1. Open the [CloudFront console](https://console.aws.amazon.com/cloudfront/) → **Create distribution**.
2. **Origin domain** — select your S3 bucket from the dropdown.
3. **Viewer protocol policy** → *Redirect HTTP to HTTPS*.
4. **Alternate domain names (CNAMEs)** → add your custom domain (e.g. `bigboard.yourdomain.com`).
5. **Custom SSL certificate** → select the ACM cert from Step 3.
6. **Default root object** → `index.html`.
7. Click **Create**. Note the **Distribution ID** and the `xxxx.cloudfront.net` domain.

---

## Step 5 — Point Route 53 to CloudFront

1. Open [Route 53 → Hosted zones](https://console.aws.amazon.com/route53/) → your domain.
2. Click **Create record**.
3. Set **Record name** to your subdomain (or leave blank for apex).
4. **Record type** → `A`.
5. Toggle **Alias** on.
6. **Route traffic to** → *Alias to CloudFront distribution* → select `xxxx.cloudfront.net`.
7. Click **Create records**. Propagation takes 1–5 minutes.

---

## Step 6 — Update placeholders in big-board.html

Open `big-board.html` and replace every instance of `PLACEHOLDER_DOMAIN.com` with your real domain in the OG/Twitter meta tags:

```html
<meta property="og:url"   content="https://bigboard.yourdomain.com" />
<meta property="og:image" content="https://bigboard.yourdomain.com/og-image.png" />
<meta name="twitter:image" content="https://bigboard.yourdomain.com/og-image.png" />
```

Create and upload a `1200×630 px` image as `og-image.png` to your S3 bucket for social previews.

---

## Step 7 — Update deploy.sh placeholders

Open `deploy.sh` and replace the two placeholders at the top:

```bash
S3_BUCKET="your-actual-bucket-name"
CLOUDFRONT_DISTRIBUTION_ID="your-actual-distribution-id"
```

Run a manual deploy to verify everything works end-to-end:

```bash
chmod +x deploy.sh
./deploy.sh
```

Then visit `https://bigboard.yourdomain.com` — you should see the live board.

---

## Step 8 — Configure GitHub Actions secrets

In GitHub → **Settings → Secrets and variables → Actions → New repository secret**, add:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM key ID |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `S3_BUCKET_NAME` | Your bucket name |
| `CLOUDFRONT_DISTRIBUTION_ID` | Your distribution ID |

The IAM user needs these two permissions:
- `s3:PutObject` on your bucket
- `cloudfront:CreateInvalidation` on your distribution

---

## Step 9 — Verify CI/CD is live

1. Make any small change to `big-board.html` and push to `main`.
2. Open **GitHub → Actions** — you should see the workflow run and pass.
3. Visit your domain — the change should be live within ~60 seconds.

---

## Summary of what auto-deploys on every push to main

```
git push → GitHub Actions → S3 upload → CloudFront invalidation → live in ~60s
```
