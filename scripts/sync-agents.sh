#!/bin/sh
# agents/CLAUDE.md is the source of truth. This copies it to the other agent files.
#   sh scripts/sync-agents.sh          sync the copies
#   sh scripts/sync-agents.sh --check  exit 1 if a copy differs (used by CI)
set -eu
cd "$(dirname "$0")/.."

src=agents/CLAUDE.md
targets="agents/AGENTS.md agents/.cursorrules"

if [ "${1:-}" = "--check" ]; then
  status=0
  for t in $targets; do
    if ! cmp -s "$src" "$t"; then
      echo "Out of sync: $t — edit $src, then run: sh scripts/sync-agents.sh"
      status=1
    fi
  done
  [ "$status" -eq 0 ] && echo "Agent files in sync."
  exit "$status"
fi

for t in $targets; do
  cp "$src" "$t"
  echo "Synced $t"
done
