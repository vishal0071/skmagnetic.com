#!/usr/bin/env bash
# Copy the live content (pages, settings, uploaded photos) from the server into src/content/
# on this machine — e.g. to commit it to GitHub or before editing content files locally.
#
#   DEPLOY_HOST=ubuntu@203.0.113.10 ./scripts/pull-content.sh
set -euo pipefail
: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. DEPLOY_HOST=ubuntu@<server-ip>}"
# Absolute path on the server (default: <server home>/skmagnetic.com)
DEPLOY_PATH="${DEPLOY_PATH:-$(ssh "$DEPLOY_HOST" 'printf %s "$HOME"')/skmagnetic.com}"
cd "$(dirname "$0")/.."
rsync -az --delete --exclude .seeded.json "${DEPLOY_HOST}:${DEPLOY_PATH}/live/content/" src/content/
echo "✓ Live content copied into src/content/  →  review, then: git add src/content && git commit -m \"Update content\" && git push"
