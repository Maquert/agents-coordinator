#!/usr/bin/env bash
# claude_to_codex.sh — Convert a Claude scheduled task directory to a Codex automation directory
# Input: a directory containing SKILL.md
# Usage: claude_to_codex.sh <path/to/task-dir>

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <task-directory>" >&2
  exit 1
fi

INPUT_DIR="${1%/}"
SKILL="$INPUT_DIR/SKILL.md"

if [[ ! -f "$SKILL" ]]; then
  echo "Error: no SKILL.md found in '$INPUT_DIR'" >&2
  exit 1
fi

# Helper: extract a YAML frontmatter value by key
get() {
  local key="$1"
  sed -n "/^---$/,/^---$/p" "$SKILL" \
    | grep -E "^${key}:" \
    | head -1 \
    | sed -E 's/^[^:]+:\s*//' \
    | sed -E 's/^"(.*)"$/\1/' \
    | sed -E "s/^'(.*)'$/\1/"
}

ID=$(get name)
NAME=$(get description)

# Extract prompt body (everything after second ---)
PROMPT=$(awk 'BEGIN{count=0} /^---$/{count++; next} count>=2{print}' "$SKILL" \
  | sed -e 's/\\/\\\\/g' \
  | sed ':a;N;$!ba;s/\n/\\n/g' \
  | sed 's/^\\n//')

OUTPUT_DIR="$(dirname "$INPUT_DIR")/$ID"
mkdir -p "$OUTPUT_DIR"

NOW_MS=$(date +%s)000

cat > "$OUTPUT_DIR/automation.toml" << TOML
version = 1
id = "$ID"
kind = "cron"
name = "$NAME"
prompt = "$PROMPT"
status = "PAUSED"
rrule = ""
model = "gpt-5.4"
reasoning_effort = "low"
execution_environment = "worktree"
cwds = []
created_at = $NOW_MS
updated_at = $NOW_MS
TOML

echo "Written: $OUTPUT_DIR/automation.toml"
