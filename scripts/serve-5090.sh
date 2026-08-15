#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$PROJECT_DIR/.." && pwd)"
NODE="$ROOT_DIR/.node/node-v22.18.0-linux-x64/bin/node"
LOG_FILE="${LOG_FILE:-/tmp/frontend_5090.log}"
PORT="${PORT:-5090}"
HOST="${HOST:-0.0.0.0}"

if [[ ! -x "$NODE" ]]; then
  echo "Missing local Node runtime: $NODE" >&2
  exit 1
fi

cd "$PROJECT_DIR"

"$NODE" node_modules/next/dist/bin/next build

if command -v ss >/dev/null 2>&1; then
  mapfile -t pids < <(ss -tlnp 2>/dev/null | awk -v port=":$PORT" '$4 ~ port {match($0, /pid=([0-9]+)/, m); if (m[1] != "") print m[1]}' | sort -u)
  if (( ${#pids[@]} > 0 )); then
    kill "${pids[@]}" || true
  fi
fi

nohup "$NODE" node_modules/next/dist/bin/next start -H "$HOST" -p "$PORT" >"$LOG_FILE" 2>&1 < /dev/null &

echo "Started frontend_V2.1 on http://$HOST:$PORT"
echo "Log: $LOG_FILE"
