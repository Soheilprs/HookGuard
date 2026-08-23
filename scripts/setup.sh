#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

copy_env() {
  local example="$1"
  local target="$2"
  if [[ ! -f "$target" ]]; then
    cp "$example" "$target"
    echo "Created $target"
  else
    echo "Exists  $target"
  fi
}

copy_env "$root/.env.example" "$root/.env"
copy_env "$root/apps/api/.env.example" "$root/apps/api/.env"
copy_env "$root/apps/web/.env.example" "$root/apps/web/.env.local"

echo
echo "Next:"
echo "  1. docker compose up -d          # Postgres on localhost:5434"
echo "  2. npm install"
echo "  3. npm run db:generate"
echo "  4. npm run db:migrate:deploy -w @hookguard/api"
echo "  5. npm run dev:api               # http://localhost:3001/health"
echo "  6. npm run dev:web               # http://localhost:3000"
echo
echo "Docs: docs/DEPLOYMENT.md"
