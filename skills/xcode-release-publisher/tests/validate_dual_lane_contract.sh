#!/usr/bin/env bash

set -euo pipefail

skill_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
skill_file="$skill_directory/SKILL.md"

if [[ ! -f "$skill_file" ]]; then
  printf 'Missing skill file: %s\n' "$skill_file" >&2
  exit 1
fi

required_phrases=(
  'Internal testing / Alpha'
  'External testers / public candidate / Beta'
  '02:00 and 06:00 Europe/Madrid'
  'any tag pushed to'
  'Every commit pushed to'
  'BUILD_TYPE=ALPHA'
  'BUILD_TYPE=BETA'
  'automatic Beta-on-push'
  'Before any version metadata change'
  'Xcode Cloud owns version/build generation'
  'feature-flag registry'
  'App Store promotion remains owner-controlled'
)

for phrase in "${required_phrases[@]}"; do
  if ! grep -Fq "$phrase" "$skill_file"; then
    printf 'Missing required contract phrase: %s\n' "$phrase" >&2
    exit 1
  fi
done

if grep -Fq 'release-candidate-test' "$skill_file"; then
  printf 'Stale release-candidate-test branch remains in the skill\n' >&2
  exit 1
fi

lane_for() {
  case "$1" in
    scheduled-alpha|main-tag|internal-manual)
      printf 'main|BUILD_TYPE=ALPHA'
      ;;
    existing-tag)
      printf 'human-confirmation'
      ;;
    release-candidate-commit|on-demand|external-tester|public-candidate|failed-candidate|promotion)
      printf 'release-candidate|BUILD_TYPE=BETA'
      ;;
    *)
      printf 'Unknown scenario: %s\n' "$1" >&2
      return 1
      ;;
  esac
}

assert_scenario() {
  local scenario="$1"
  local expected="$2"
  local actual
  actual="$(lane_for "$scenario")"
  if [[ "$actual" != "$expected" ]]; then
    printf 'Scenario %s selected %s, expected %s\n' "$scenario" "$actual" "$expected" >&2
    exit 1
  fi
}

assert_scenario scheduled-alpha 'main|BUILD_TYPE=ALPHA'
assert_scenario main-tag 'main|BUILD_TYPE=ALPHA'
assert_scenario internal-manual 'main|BUILD_TYPE=ALPHA'
assert_scenario existing-tag 'human-confirmation'
assert_scenario release-candidate-commit 'release-candidate|BUILD_TYPE=BETA'
assert_scenario on-demand 'release-candidate|BUILD_TYPE=BETA'
assert_scenario external-tester 'release-candidate|BUILD_TYPE=BETA'
assert_scenario public-candidate 'release-candidate|BUILD_TYPE=BETA'
assert_scenario failed-candidate 'release-candidate|BUILD_TYPE=BETA'
assert_scenario promotion 'release-candidate|BUILD_TYPE=BETA'

printf 'xcode-release-publisher dual-lane contract: PASS\n'
