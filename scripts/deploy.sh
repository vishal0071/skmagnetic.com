#!/usr/bin/env bash
# Deploy the SK Enterprises website + admin to the galleryflow server.
#
#   DEPLOY_HOST=ubuntu@203.0.113.10 ./scripts/deploy.sh
#
# Code is uploaded and both containers are rebuilt. CONTENT IS PROTECTED: once the site is
# on the server, products/pages/settings are edited in the admin panel, so the upload only
# ADDS content files that don't exist on the server yet — it never overwrites admin edits.
# (Use scripts/pull-content.sh to copy the server's content back to this machine.)
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. DEPLOY_HOST=ubuntu@<server-ip>}"
# Absolute path on the server (default: <server home>/skmagnetic.com)
DEPLOY_PATH="${DEPLOY_PATH:-$(ssh "$DEPLOY_HOST" 'printf %s "$HOME"')/skmagnetic.com}"
cd "$(dirname "$0")/.."

echo "→ Checking the build locally"
npm run build >/dev/null
node scripts/check-site.mjs

echo "→ Uploading code to ${DEPLOY_HOST}:${DEPLOY_PATH}"
ssh "$DEPLOY_HOST" "mkdir -p ${DEPLOY_PATH}/data ${DEPLOY_PATH}/src/content"
rsync -az --delete \
  --exclude node_modules --exclude dist --exclude .astro --exclude .site --exclude .git \
  --exclude data --exclude .env --exclude 'scripts/_*' --exclude .DS_Store \
  --exclude 'src/content/' \
  ./ "${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "→ Adding new content files (existing server content is left untouched)"
rsync -az --ignore-existing --exclude .DS_Store src/content/ "${DEPLOY_HOST}:${DEPLOY_PATH}/src/content/"

echo "→ Building and starting the containers"
ssh "$DEPLOY_HOST" "cd ${DEPLOY_PATH} && test -f .env || { echo 'Missing .env on the server — copy .env.example to .env and set ADMIN_PASSWORD and ADMIN_SECRET'; exit 1; } && docker compose up -d --build && docker compose ps"

echo "✓ Deployed. Website: https://skmagnetic.com   Admin: https://skmagnetic.com/admin"
