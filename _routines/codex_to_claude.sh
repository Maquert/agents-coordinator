#!/usr/bin/env bash
# codex_to_claude.sh — Convert a Codex automation directory to a Claude scheduled task directory
# Output: <automation-name>/SKILL.md next to the input directory
# Usage: codex_to_claude.sh <path/to/automation-dir>

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <automation-directory>" >&2
  exit 1
fi

INPUT_DIR="${1%/}"

if [[ ! -d "$INPUT_DIR" ]]; then
  echo "Error: '$INPUT_DIR' is not a directory" >&2
  exit 1
fi

TOML="$INPUT_DIR/automation.toml"
if [[ ! -f "$TOML" ]]; then
  echo "Error: no automation.toml found in '$INPUT_DIR'" >&2
  exit 1
fi

# Helper: extract a TOML value by key
get() {
  local key="$1"
  grep -E "^${key}\s*=" "$TOML" \
    | head -1 \
    | sed -E 's/^[^=]+=\s*//' \
    | sed -E 's/^"(.*)"$/\1/' \
    | sed -E "s/^'(.*)'$/\1/"
}

ID=$(get id)
NAME=$(get name)
PROMPT_RAW=$(get prompt | sed 's/\\n/\n/g')

OUTPUT_DIR="$(dirname "$INPUT_DIR")/$ID"
mkdir -p "$OUTPUT_DIR"

cat > "$OUTPUT_DIR/SKILL.md" << EOF
---
name: $ID
description: $NAME
---

$PROMPT_RAW
EOF

echo "Written: $OUTPUT_DIR/SKILL.md"
