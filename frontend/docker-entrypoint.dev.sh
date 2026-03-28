#!/bin/sh
set -e
cd /app

LOCK_FILE=package-lock.json
STAMP_FILE=node_modules/.docker-npm-lock-sha

need_install=0
if [ ! -f "$LOCK_FILE" ]; then
  echo "error: $LOCK_FILE not found" >&2
  exit 1
fi

LOCK_SHA=$(sha256sum "$LOCK_FILE" | awk '{print $1}')
PREV_SHA=""
if [ -f "$STAMP_FILE" ]; then
  PREV_SHA=$(cat "$STAMP_FILE" || true)
fi

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null || true)" ]; then
  need_install=1
elif [ "$LOCK_SHA" != "$PREV_SHA" ]; then
  need_install=1
fi

if [ "$need_install" -eq 1 ]; then
  echo "Installing npm dependencies (lockfile or empty node_modules)..."
  npm ci
  mkdir -p node_modules
  printf '%s\n' "$LOCK_SHA" > "$STAMP_FILE"
fi

exec npm run dev -- --host 0.0.0.0 --port 5173
