---
name: xcode-terminal
description: Build, test, archive, diagnose, and maintain Xcode projects from the terminal for AI-agent workflows. Use when Codex works on Xcode, iOS, macOS, watchOS, tvOS, visionOS, Swift Package, `.xcodeproj`, `.xcworkspace`, `.pbxproj`, scheme, simulator, `xcodebuild`, `xcrun`, `simctl`, `xcresulttool`, or Xcode CI/build/test/archive tasks.
---

# Xcode Terminal

## Required Companion Skill

Load and follow `xcsift` for every Swift or Xcode build/test command. Always pipe build output through `xcsift -f toon` with `2>&1` unless the user explicitly asks for raw logs.

## Workflow

1. Read `references/command-patterns.md`.
2. For project-file or structure changes, also read `references/project-maintenance.md`.
3. Run `scripts/verify_xcode_setup.sh` once per environment when Xcode setup is unknown.
4. Discover the project with `scripts/discover_xcode_project.sh <repo-path>` or equivalent commands.
5. Choose the narrowest useful command:
   - compile check: `build`
   - focused test: `test -only-testing:<identifier>`
   - full test: `test`
   - CI split: `build-for-testing` then `test-without-building`
   - distribution: `archive` then `-exportArchive`
   - if a focused test or screenshot method exists for the changed surface, start there before repo wrappers or full suites
6. Use explicit workspace/project, scheme, configuration, destination, and derived data path.
7. Use `-resultBundlePath` for tests and substantial builds.
8. If SwiftUI UI changes are in scope, add or update screenshot tests and baselines for every impacted platform contract; do not treat screenshot coverage as optional.
9. If unit tests run, also run the relevant screenshot tests because screenshot tests are part of the validation contract.
10. Run screenshot tests in record mode so new baseline images are written into the repository for review.
11. Keep and commit the recorded screenshot image changes with the related code changes so the user can review them in the pull request.
12. Summarize xcsift output by errors, failing tests, warnings, timing, and next action.
13. Poll long-running builds sparingly.
   - Do not repeatedly poll a running xcodebuild unless you expect a state change, timeout decision, or new actionable output.
14. Avoid overlapping Xcode validations that share package resolution, derived data, simulators, or snapshot outputs unless the repository explicitly supports that concurrency.

## Agent Rules

- Prefer discovery commands before build commands: `xcodebuild -list -json`, `-showdestinations`, `-showTestPlans`, `-showBuildSettings -json`, `xcodebuild -showsdks -json`, and `xcrun simctl list --json`.
- Request permission early for commands that build, test, boot simulators, download platforms/components, resolve packages from network, sign, archive, export, or contact Apple services.
- Never run `clean`, delete DerivedData, reset simulators, or change signing/provisioning without user intent.
- Do not use `-allowProvisioningUpdates`, `-allowProvisioningDeviceRegistration`, `-skipPackagePluginValidation`, `-skipMacroValidation`, or `-skipPackageSignatureValidation` unless the user explicitly accepts the risk.
- Prefer a repo-local derived data path such as `.derivedData/<scheme>` for reproducibility and cleanup.
- Prefer stable simulator IDs from `simctl` or `-showdestinations` over ambiguous device names.
- Capture result bundles under `.build-results/` or another repo-local ignored path.
- When a wrapper script is much broader than the changed surface, prefer an equivalent focused `xcodebuild test -only-testing:...` command first and use the wrapper as fallback.
- Do not treat screenshot diffs as disposable local noise when tests were run for validation; record the updated images, keep them in the worktree, and commit them with the task so review happens in the PR.
- Do not hand-edit `.pbxproj` unless no safer project-management path exists. If editing is unavoidable, preserve ordering, inspect diffs carefully, and run `xcodebuild -list -json` afterward.
- Keep command output token-efficient: use `xcsift`, JSON flags, `--jq`, or focused file reads instead of raw logs.

## Common Commands

```bash
# Discovery
xcode-select --print-path
xcodebuild -version
xcodebuild -list -json -workspace App.xcworkspace
xcodebuild -showdestinations -workspace App.xcworkspace -scheme App
xcodebuild -showTestPlans -workspace App.xcworkspace -scheme App

# Build
xcodebuild build \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination 'platform=iOS Simulator,id=<UDID>' \
  -derivedDataPath .derivedData/App \
  -resultBundlePath .build-results/App-build.xcresult \
  2>&1 | xcsift -f toon --build-info

# Focused test
xcodebuild test \
  -workspace App.xcworkspace \
  -scheme App \
  -destination 'platform=iOS Simulator,id=<UDID>' \
  -only-testing:AppTests/FooTests/testBar \
  -derivedDataPath .derivedData/App \
  -resultBundlePath .build-results/App-test.xcresult \
  2>&1 | xcsift -f toon -c --slow-threshold 1.0
```

## Sources

Read `references/sources.md` for source-backed findings and links.
