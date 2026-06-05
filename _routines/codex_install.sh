#!/usr/bin/env bash
# codex_install.sh — Copy a Codex automation directory into ~/.codex/automations
# Usage: codex_install.sh <path/to/automation-dir>

set -euo pipefail

CODEX_AUTOMATIONS="$HOME/.codex/automations"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <automation-directory>" >&2
  exit 1
fi

SRC="${1%/}"

if [[ ! -d "$SRC" ]]; then
  echo "Error: '$SRC' is not a directory" >&2
  exit 1
fi

DEST="$CODEX_AUTOMATIONS/$(basename "$SRC")"
mkdir -p "$CODEX_AUTOMATIONS"
cp -rf "$SRC" "$DEST"
echo "Installed: $DEST"
