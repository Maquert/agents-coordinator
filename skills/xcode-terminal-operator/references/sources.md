# Source-Backed Findings

## Apple Toolchain Setup

Apple documents that Xcode includes command-line tools such as `xcodebuild`, `simctl`, and `devicectl`, and that Xcode must be installed and selected as the active developer directory before those commands can be used from Terminal.

Practical agent rule: verify `xcode-select --print-path` and `xcodebuild -version` before diagnosing project failures.

Sources:

- Xcode command-line tool reference: https://developer.apple.com/documentation/xcode/xcode-command-line-tool-reference
- Installing command-line tools: https://developer.apple.com/documentation/xcode/installing-the-command-line-tools/
- TN2339 command-line tools setup: https://developer.apple.com/library/archive/technotes/tn2339/_index.html

## Build Discovery

Apple's `xcodebuild` guidance and manual emphasize:

- Use `-list` to discover projects, targets, configurations, and schemes.
- Use `-workspace` and `-scheme` for workspace builds.
- Use `-project` when multiple projects are present or when building a project explicitly.
- Use `-showBuildSettings`, `-showdestinations`, `-showsdks`, and `-showTestPlans` for read-only discovery.

Practical agent rule: run discovery before selecting a scheme, target, configuration, destination, or test plan.

Sources:

- TN2339 build from command line: https://developer.apple.com/library/archive/technotes/tn2339/_index.html
- Local `man xcodebuild` from Xcode 26.3.
- Local `xcodebuild -help` from Xcode 26.3.

## Tests

Apple documents:

- `xcodebuild test` can run tests from Terminal.
- `-only-testing` and `-skip-testing` constrain tests by identifier.
- Test identifiers use target/class/method-style paths.
- Test plans can be listed with `-showTestPlans` and selected with `-testPlan`.
- Terminal test runs produce `.xcresult` bundles containing session results, coverage when enabled, and logs.
- `build-for-testing` and `test-without-building` support CI workflows.

Practical agent rule: use focused tests while iterating, full relevant test plans before handoff, and result bundles for durable diagnostics.

Sources:

- Running tests and interpreting results: https://developer.apple.com/documentation/xcode/running-tests-and-interpreting-results
- Organizing tests with test plans: https://developer.apple.com/documentation/xcode/organizing-tests-to-improve-feedback
- TN2339 test and CI actions: https://developer.apple.com/library/archive/technotes/tn2339/_index.html

## Destinations and Simulators

`xcodebuild` destinations are comma-separated key/value specifiers. Destination support varies by platform. The installed `xcodebuild` manual documents platform keys such as platform, id, name, arch, variant, and OS, and notes that multiple destinations run tests concurrently.

Practical agent rule: prefer `id=<UDID>` for simulators/devices and inspect valid destinations before running tests.

Sources:

- Local `man xcodebuild` from Xcode 26.3.
- `xcrun simctl help` and `xcrun simctl list --json`.

## Package Dependencies and Security

Installed `xcodebuild -help` documents options for resolving Swift package dependencies, using a cloned source packages directory, respecting resolved package versions, and skipping plugin/macro/signature validation. The skip-validation flags are explicitly security-sensitive in practice because they reduce checks around executable package features or package authenticity.

Practical agent rule: keep package resolution reproducible and do not skip validation unless the user explicitly accepts the risk.

Sources:

- Local `xcodebuild -help` from Xcode 26.3.

## Archive and Export

Apple documents `archive` and `-exportArchive` workflows, with `-archivePath`, `-exportPath`, and `-exportOptionsPlist`. Apple also directs users to `xcodebuild -help` for the export option keys supported by the installed Xcode version.

Practical agent rule: split archive and export, keep export options explicit, and avoid provisioning updates unless approved.

Sources:

- TN2339 archive/export: https://developer.apple.com/library/archive/technotes/tn2339/_index.html
- Archive export files: https://help.apple.com/xcode/mac/current/en.lproj/deva1f2ab5a2.html
- Local `xcodebuild -help` from Xcode 26.3.
