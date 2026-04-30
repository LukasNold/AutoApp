#!/usr/bin/env bash
# Appends a one-line entry to CHANGELOG.md after each Claude turn,
# but only when a new git commit exists that hasn't been logged yet.

HASH=$(git log -1 --format="%h" 2>/dev/null)
MSG=$(git log -1 --format="%s" 2>/dev/null)

[[ -z "$HASH" || -z "$MSG" ]] && exit 0

CHANGELOG="CHANGELOG.md"

# Already logged this commit — nothing to do
if [[ -f "$CHANGELOG" ]] && grep -qF "($HASH)" "$CHANGELOG"; then
  exit 0
fi

DATE=$(date +%Y-%m-%d)

# Bootstrap the file with a header on first write
if [[ ! -f "$CHANGELOG" ]]; then
  echo "# Changelog" > "$CHANGELOG"
  echo "" >> "$CHANGELOG"
fi

echo "- $DATE  $MSG  ($HASH)" >> "$CHANGELOG"
