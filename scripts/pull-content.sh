#!/usr/bin/env bash
# Copy the live content (products, pages, settings, uploaded photos) from the server to
# this machine — e.g. before making code changes locally.
#
#   DEPLOY_HOST=ubuntu@203.0.113.10 ./scripts/pull-content.sh
set -euo pipefail
: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. DEPLOY_HOST=ubuntu@<server-ip>}"
# Absolute path on the server (default: <server home>/skmagnetic.com)
DEPLOY_PATH="${DEPLOY_PATH:-$(ssh "$DEPLOY_HOST" 'printf %s "$HOME"')/skmagnetic.com}"
cd "$(dirname "$0")/.."
rsync -az --delete "${DEPLOY_HOST}:${DEPLOY_PATH}/src/content/" src/content/
echo "✓ Content copied from the server into src/content/"
