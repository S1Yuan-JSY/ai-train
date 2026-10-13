#!/usr/bin/env sh
# Run on the Linux server. Stop writes so both SQLite databases form one snapshot.
set -eu
cd "$(dirname "$0")"
mkdir -p backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
umask 077
docker compose --env-file .env -f compose.yaml stop app
trap 'docker compose --env-file .env -f compose.yaml start app' EXIT HUP INT TERM
docker compose --env-file .env -f compose.yaml run --rm --no-deps -T \
  --entrypoint tar app -C /app/backend/data -czf - . > "backups/ai-train-$stamp.tar.gz"
echo "Backup saved: deploy/backups/ai-train-$stamp.tar.gz"
