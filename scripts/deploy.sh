#!/usr/bin/env bash
# ALTERNATIVE deployment without git on the server (the recommended way is
# `git pull` on the server — see DEPLOYMENT.md). Copies the code from this machine:
#
#   DEPLOY_HOST=ubuntu@203.0.113.10 ./scripts/deploy.sh
#
# Live content and enquiries in ./live on the server are never touched.
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. DEPLOY_HOST=ubuntu@<server-ip>}"
# Absolute path on the server (default: <server home>/skmagnetic.com)
DEPLOY_PATH="${DEPLOY_PATH:-$(ssh "$DEPLOY_HOST" 'printf %s "$HOME"')/skmagnetic.com}"
cd "$(dirname "$0")/.."

echo "→ Checking the build locally"
npm run build >/dev/null
node scripts/check-site.mjs

echo "→ Uploading code to ${DEPLOY_HOST}:${DEPLOY_PATH}"
ssh "$DEPLOY_HOST" "mkdir -p ${DEPLOY_PATH}"
rsync -az --delete \
  --exclude node_modules --exclude dist --exclude .astro --exclude .site --exclude .git \
  --exclude live --exclude data --exclude .env --exclude 'scripts/_*' --exclude .DS_Store \
  ./ "${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "→ Building and starting the containers"
ssh "$DEPLOY_HOST" "cd ${DEPLOY_PATH} && test -f .env || { echo 'Missing .env on the server — copy .env.example to .env and set ADMIN_PASSWORD and ADMIN_SECRET'; exit 1; } && docker compose up -d --build && docker compose ps"

echo "✓ Deployed. Website: https://skmagnetic.com   Admin: https://skmagnetic.com/admin"
