#!/usr/bin/env bash
# claude_install.sh — Install a Claude scheduled task into ~/.claude/scheduled-tasks
# Input: a directory containing SKILL.md
# Usage: claude_install.sh <path/to/task-dir>

set -euo pipefail

CLAUDE_SCHEDULED_TASKS="$HOME/.claude/scheduled-tasks"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <task-directory>" >&2
  exit 1
fi

SRC="${1%/}"

if [[ ! -d "$SRC" ]]; then
  echo "Error: '$SRC' is not a directory" >&2
  exit 1
fi

if [[ ! -f "$SRC/SKILL.md" ]]; then
  echo "Error: no SKILL.md found in '$SRC'" >&2
  exit 1
fi

DEST="$CLAUDE_SCHEDULED_TASKS/$(basename "$SRC")"
mkdir -p "$CLAUDE_SCHEDULED_TASKS"
cp -rf "$SRC" "$DEST"
echo "Installed: $DEST"
