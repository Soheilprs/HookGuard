#!/usr/bin/env bash
set -euo pipefail

# Convenience launcher for local API + web.
# Run API and web separately if you prefer npm run dev:api / dev:web.

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if [[ ! -f apps/api/.env ]]; then
  echo "Missing apps/api/.env — run scripts/setup.sh first."
  exit 1
fi

npm run dev
