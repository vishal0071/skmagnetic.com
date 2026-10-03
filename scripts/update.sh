#!/usr/bin/env bash
# Update the live website from GitHub. Run ON THE SERVER, in ~/skmagnetic.com:
#
#   ./scripts/update.sh
#
# Pulls the latest code and rebuilds both containers. Live content and enquiries in ./live
# are never touched by git; pages newly added to the repository are added automatically.
set -euo pipefail
cd "$(dirname "$0")/.."
test -f .env || { echo "Missing .env — copy .env.example to .env and set ADMIN_PASSWORD and ADMIN_SECRET"; exit 1; }
echo "→ Pulling the latest code"
git pull --ff-only
echo "→ Rebuilding and restarting the containers"
docker compose up -d --build
docker image prune -f >/dev/null
docker compose ps
echo "✓ Updated. Website: https://skmagnetic.com   Admin: https://skmagnetic.com/admin"
