#!/usr/bin/env bash
# deploy.sh — upload big-board.html to S3 and bust the CloudFront cache
#
# Prerequisites:
#   - AWS CLI v2 installed and configured (aws configure, or env vars)
#   - Caller has s3:PutObject on the bucket and cloudfront:CreateInvalidation on the distribution
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh

set -euo pipefail

# ── CONFIG ────────────────────────────────────────────────────────────────────
S3_BUCKET="PLACEHOLDER_BUCKET_NAME"          # e.g. my-bigboard-bucket
CLOUDFRONT_DISTRIBUTION_ID="PLACEHOLDER_CF_DISTRIBUTION_ID"  # e.g. E1A2B3C4D5E6F7
HTML_FILE="big-board.html"
# ─────────────────────────────────────────────────────────────────────────────

echo "→ Uploading ${HTML_FILE} to s3://${S3_BUCKET}/ ..."
aws s3 cp "${HTML_FILE}" "s3://${S3_BUCKET}/${HTML_FILE}" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "no-cache"

# Also serve the file at the bucket root so https://yourdomain.com/ resolves
aws s3 cp "${HTML_FILE}" "s3://${S3_BUCKET}/index.html" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "no-cache"

echo "→ Creating CloudFront invalidation for / and /big-board.html ..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
  --paths "/" "/index.html" "/big-board.html" \
  --query "Invalidation.Id" \
  --output text)

echo "✓ Invalidation created: ${INVALIDATION_ID}"
echo "  (propagation typically takes 30–60 seconds)"
