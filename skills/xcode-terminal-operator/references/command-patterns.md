# Command Patterns

## Setup Verification

Use:

```bash
xcode-select --print-path
xcodebuild -version
xcodebuild -showsdks -json
xcodebuild -checkFirstLaunchStatus
```

If `xcodebuild` is unavailable or points to Command Line Tools only, ask the user to install full Xcode and select it as the active developer directory. Apple notes that tools such as `xcodebuild`, `simctl`, and `devicectl` require full Xcode and an active developer directory.

## Project Discovery

Prefer workspace over project when both exist, especially when CocoaPods, SwiftPM workspace integration, or multi-project setups are present.

Use:

```bash
xcodebuild -list -json -workspace <name>.xcworkspace
xcodebuild -list -json -project <name>.xcodeproj
xcodebuild -showBuildSettings -json -workspace <workspace> -scheme <scheme>
xcodebuild -showdestinations -workspace <workspace> -scheme <scheme>
xcodebuild -showTestPlans -workspace <workspace> -scheme <scheme>
xcrun simctl list --json devices available
```

Selection rules:

- If one workspace exists, use `-workspace`.
- If multiple workspaces/projects exist, ask or infer from repo docs/CI.
- Use schemes, not raw targets, for app builds/tests unless a target-specific action is clearly intended.
- Always pass `-project` when multiple `.xcodeproj` files exist in the same directory.
- Always pass `-scheme` for workspaces.

## Build

Use explicit command shape:

```bash
xcodebuild build \
  -workspace <workspace> \
  -scheme <scheme> \
  -configuration Debug \
  -destination '<destination>' \
  -derivedDataPath .derivedData/<scheme> \
  -resultBundlePath .build-results/<scheme>-build.xcresult \
  2>&1 | xcsift -f toon --build-info
```

For generic device builds:

```bash
xcodebuild build -workspace <workspace> -scheme <scheme> -destination 'generic/platform=iOS' 2>&1 | xcsift -f toon
```

## Tests

Use the smallest test scope that answers the question.

```bash
# List test plans
xcodebuild -showTestPlans -workspace <workspace> -scheme <scheme>

# Focused test
xcodebuild test -workspace <workspace> -scheme <scheme> \
  -destination '<destination>' \
  -only-testing:<TestTarget>/<TestClass>/<testMethod> \
  -resultBundlePath .build-results/<scheme>-focused.xcresult \
  2>&1 | xcsift -f toon -c --slow-threshold 1.0

# Test plan
xcodebuild test -workspace <workspace> -scheme <scheme> \
  -testPlan '<test-plan>' \
  -destination '<destination>' \
  2>&1 | xcsift -f toon -c
```

For CI-style split:

```bash
xcodebuild build-for-testing -workspace <workspace> -scheme <scheme> \
  -destination '<destination>' \
  -derivedDataPath .derivedData/<scheme> \
  2>&1 | xcsift -f toon --build-info

xcodebuild test-without-building -workspace <workspace> -scheme <scheme> \
  -destination '<destination>' \
  -derivedDataPath .derivedData/<scheme> \
  -resultBundlePath .build-results/<scheme>-test.xcresult \
  2>&1 | xcsift -f toon -c
```

Use `-enumerate-tests -test-enumeration-format json` when the agent needs exact test identifiers without running tests.

## Simulators

Use `xcrun simctl list --json devices available` to find exact UDIDs. Prefer `id=<UDID>` over `name=<device>` when the device name is duplicated.

Booting a simulator is stateful. Request permission before booting, shutting down, erasing, or deleting simulators.

## Package Resolution

Use:

```bash
xcodebuild -resolvePackageDependencies -workspace <workspace> -clonedSourcePackagesDirPath .source-packages
```

Prefer package-resolved behavior:

- Keep `Package.resolved` respected.
- Use `-disableAutomaticPackageResolution`, `-onlyUsePackageVersionsFromResolvedFile`, or `-skipPackageUpdates` when reproducibility matters.
- Do not skip package plugin, macro, or signature validation unless explicitly approved.

## Archive and Export

Archive:

```bash
xcodebuild archive \
  -workspace <workspace> \
  -scheme <scheme> \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath .archives/<scheme>.xcarchive \
  2>&1 | xcsift -f toon --build-info
```

Export:

```bash
xcodebuild -exportArchive \
  -archivePath .archives/<scheme>.xcarchive \
  -exportPath .exports/<scheme> \
  -exportOptionsPlist ExportOptions.plist
```

Use `xcodebuild -help` for export option keys supported by the installed Xcode version.

## Result Bundles

Use `-resultBundlePath` for test and substantial build runs. The path must not already exist. Result bundles contain logs, test results, screenshots, attachments, diagnostics, and coverage reports.

Use `xcresulttool` only for targeted extraction; prefer `xcsift` for first-pass summaries.
