#!/usr/bin/env bash
# Creates a feature/... branch when the prompt looks like a new feature request.

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('prompt',''),end='')" 2>/dev/null)

[[ -z "$PROMPT" ]] && exit 0

# Skip questions, explanations, and bug fixes
if echo "$PROMPT" | grep -qiE '^\s*(fix|bug|debug|why|what|how|explain|help|show|is |does |can |could |would |should )'; then
  exit 0
fi

# Require a feature-building keyword
if ! echo "$PROMPT" | grep -qiE '\b(implement|add|create|build|make|develop|set up|scaffold|wire|support|enable|generate|write)\b'; then
  exit 0
fi

# Already on a feature branch — stay put
CURRENT=$(git branch --show-current 2>/dev/null || echo "")
if [[ "$CURRENT" == feature/* ]]; then
  exit 0
fi

# Derive a kebab-case name from the first 5 words of the prompt
BRANCH=$(echo "$PROMPT" \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/[^a-z0-9 ]/ /g' \
  | tr -s ' ' \
  | xargs \
  | cut -d' ' -f1-5 \
  | tr ' ' '-' \
  | sed 's/-\+$//')

[[ -z "$BRANCH" ]] && exit 0

if git checkout -b "feature/$BRANCH" 2>/dev/null; then
  printf '{"systemMessage": "Created branch: feature/%s"}\n' "$BRANCH"
fi
