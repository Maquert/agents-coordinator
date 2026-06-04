---
name: xcode-test
description: Assist agents testing Xcode projects with deterministic destinations, parallel macOS and iPhone phases, and a required per-project scripts/tests_config.sh contract. Use when working on xcodebuild test commands, simulator selection, xcresult capture, or cross-platform Apple test orchestration.
---

# Xcode Test

Use this skill to help agents test Xcode projects consistently. Load `xcode-terminal` and `xcsift` alongside this skill whenever you run Swift or Xcode tests.

## Required Project Contract

Every project that uses this workflow must contain `scripts/tests_config.sh`.

- If the file is missing, create it before running tests.
- Prefer the bundled installer: `~/.codex/skills/xcode-test/scripts/install_tests_config.sh <repo-root>`.
- Source it in every test or build script that needs test destinations:

```bash
source "$REPO_ROOT/scripts/tests_config.sh"
```

## Standards

- Always use explicit destinations. Do not auto-pick a simulator.
- Hardcode the iPhone simulator to `iPhone 17` on `iOS 26.4`.
- If that simulator/runtime is unavailable, fail clearly instead of substituting another device or OS.
- Capture each phase into its own derived data path and result bundle path.
- Pipe all `xcodebuild` output through `xcsift -f toon` with `2>&1`.
- When both macOS and iPhone phases are required, start them in parallel and wait for both to finish before deciding whether to move on.
- Do not stop after the first failing phase if the other phase is still running. Wait, collect both exit codes, then report the combined result.
- For any UI change that affects screenshot-covered surfaces, treat recording and committing every affected `swift-snapshot-testing` baseline as a hard completion requirement, not an optional cleanup step.
- Do not mark a UI task finished if any affected macOS, iPad, or iPhone screenshot reference is stale or unrecorded.
- When a repo exposes screenshot record wrappers, rerun the affected macOS, iPad, and iPhone recording workflows before final verification.
- After recording, rerun the normal screenshot verification workflows and the repo’s main unit-test wrapper; recording alone is not sufficient validation.

## Parallel Test Workflow

1. Read the project config:

```bash
source "$REPO_ROOT/scripts/tests_config.sh"
```

2. Discover the project and testable schemes with the normal `xcode-terminal` workflow.

3. Run macOS and iPhone phases in parallel with separate outputs. Use repo-local paths such as:

- `.derivedData/tests-macos`
- `.derivedData/tests-ios`
- `.build-results/<scheme>-macos.xcresult`
- `.build-results/<scheme>-ios.xcresult`

4. Wait for both phases, then fail if either phase failed.

## Parallel Command Pattern

Adjust workspace or project flags, scheme, and optional test filters to the current repo, but keep the synchronization pattern intact:

```bash
#!/usr/bin/env bash
set -uo pipefail

source "$REPO_ROOT/scripts/tests_config.sh"

macos_log=".build-results/${SCHEME}-macos.toon"
ios_log=".build-results/${SCHEME}-ios.toon"

(
  xcodebuild test \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -destination "$TEST_MACOS_DESTINATION" \
    -derivedDataPath ".derivedData/tests-macos" \
    -resultBundlePath ".build-results/${SCHEME}-macos.xcresult" \
    2>&1 | xcsift -f toon -c --slow-threshold "$TEST_SLOW_THRESHOLD_SECONDS"
) | tee "$macos_log" &
macos_pid=$!

(
  xcodebuild test \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -destination "$TEST_IOS_DESTINATION" \
    -derivedDataPath ".derivedData/tests-ios" \
    -resultBundlePath ".build-results/${SCHEME}-ios.xcresult" \
    2>&1 | xcsift -f toon -c --slow-threshold "$TEST_SLOW_THRESHOLD_SECONDS"
) | tee "$ios_log" &
ios_pid=$!

set +e
wait "$macos_pid"
macos_status=$?
wait "$ios_pid"
ios_status=$?
set -e

if [ "$macos_status" -ne 0 ] || [ "$ios_status" -ne 0 ]; then
  echo "macOS phase exit code: $macos_status"
  echo "iPhone phase exit code: $ios_status"
  exit 1
fi
```

## Result Handling

- Summarize both phases before continuing.
- Report failing tests, warnings, coverage, and slow tests per phase.
- If only one platform is testable in the current repo, state that explicitly and run the single applicable phase.
- If the user asks for both macOS and iPhone coverage, do not mark the run complete until both phases have finished.

## UI Completion Rule

When the change affects UI:

1. Record every affected screenshot baseline for all impacted platform contracts, including macOS, iPad, and iPhone when the repo supports those contracts.
2. Commit the updated reference files together with the UI code change.
3. Run the repo’s screenshot verification workflow after recording.
4. Run the repo’s main unit or integration test workflow after recording.
5. Treat the task as unfinished if any affected screenshot baseline was not updated, intentionally confirmed unchanged, committed, and revalidated.
