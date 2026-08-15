#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-5090}"

# Cron may run periodically; only rebuild/restart when the service is absent.
if command -v ss >/dev/null 2>&1 && ss -H -tln "sport = :$PORT" | grep -q .; then
  exit 0
fi

exec /usr/bin/env bash "$PROJECT_DIR/scripts/serve-5090.sh"
