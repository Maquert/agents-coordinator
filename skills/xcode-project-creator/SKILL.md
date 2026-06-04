---
name: xcode-project-creator
description: Create new Xcode app projects with SwiftUI, minimal entitlements, local Xcode and SDK discovery, simulator selection, Apple .gitignore setup, mirrored filesystem and Xcode group layout, and explicit platform support decisions for iPhone, iPad, Apple TV, visionOS, macOS, and related Apple app targets.
---

# Xcode Project Creator

Use this skill when creating or scaffolding a new Xcode app project.

## Core Tenets

- Build new projects in SwiftUI by default.
- Start with iPhone as the only supported UI/platform unless the user explicitly adds more.
- Ask which other platforms to support before scaffolding: iPad, Apple TV, visionOS, Mac, or other targets. Do not include Apple Watch at project start unless the user explicitly overrides this standard.
- Inject singleton-like Apple platform APIs through Point-Free `swift-dependencies` instead of reading globals directly from feature or domain code. On iOS-family targets, types such as `UIApplication` and similar shared-instance entry points must be wrapped as dependencies rather than accessed via `.shared`.
- Inject non-deterministic value creation through dependencies as well. Do not introduce direct `Date()`, `UUID()`, or similar runtime-generated values in app logic when `swift-dependencies` can provide the value.
- Use the minimal entitlement set possible. Add no capabilities by default, including push notifications, Background Modes, iCloud, App Groups, Keychain Sharing, Associated Domains, Sign in with Apple, HealthKit, HomeKit, Siri, Wallet, or Maps.
- Prefer the latest iOS SDK available in the active local Xcode install, but first inspect the installed Xcode and SDKs and discuss the local SDK version with the user.
- Keep platform-specific files isolated, even when the initial platform folder only contains configuration.
- Always create or update a root `.gitignore` for generated Apple projects. Use `assets/gitignore.apple.template` as the baseline and merge it with any existing project-specific ignore rules instead of overwriting.
- Keep the physical filesystem hierarchy and Xcode Project Navigator hierarchy mirrored. Xcode groups and file references must point to the same relative paths as the files on disk.

## Required Local Discovery

Before generating or changing project files, inspect the active Xcode environment:

```bash
xcode-select -p
xcodebuild -version
xcodebuild -showsdks
xcrun --sdk iphonesimulator --show-sdk-version
xcrun simctl list devicetypes available
xcrun simctl list runtimes available
```

Report the active Xcode version, local iOS SDK version, and relevant simulator availability. If the preferred simulator named in `references/platform-specs.md` is missing, discuss the closest locally available replacement before proceeding.

Use the latest locally available SDK as the build SDK. For deployment targets, recommend the latest major iOS version for greenfield internal projects, but ask before lowering it for older-device support.

## Intake Checklist

Ask only for missing decisions that affect generated files:

- Product name and bundle identifier.
- Supported platforms beyond iPhone.
- Whether the app needs persistence, networking, app intents, widgets, extensions, or any Apple capability that would require entitlements.
- Minimum deployment target if the user has compatibility requirements.
- Team/signing preference if the project needs to build on the current machine immediately.

If the user has already supplied a decision, do not ask again.

## Project Shape

Use the existing repository style if creating inside a repo. For a new standalone app, prefer this layout:

```text
ProjectName/
├── .gitignore
├── ProjectName.xcodeproj/
├── Shared/
│   ├── App/
│   ├── Models/
│   ├── Services/
│   └── UI/
├── Platforms/
│   ├── iPhone/
│   ├── iPad/
│   ├── TV/
│   └── Vision/
├── Configuration/
│   ├── Base.xcconfig
│   ├── iPhone.xcconfig
│   ├── iPad.xcconfig
│   ├── TV.xcconfig
│   └── Vision.xcconfig
└── Tests/
```

Create folders for each selected platform. If only iPhone is selected, still create `Platforms/iPhone/` and `Configuration/iPhone.xcconfig`; do not create unused platform folders unless the user wants placeholders for future support.

Keep shared SwiftUI app entry, common views, models, and services under `Shared/`. Put device idiom, scene configuration, asset variations, platform adapters, and platform-only settings under the matching `Platforms/<platform>/` folder.

## Filesystem And Xcode Group Mirroring

Use a filesystem-synchronized project layout: the physical filesystem hierarchy on disk must match the logical Xcode group hierarchy shown in the Project Navigator.

- Treat folders on disk as the source of truth for project structure.
- Create matching Xcode groups for each source folder, using the same names and nesting as the filesystem.
- Ensure each `PBXFileReference` path is relative to its containing group and matches the file's actual relative path on disk.
- Avoid virtual groups whose contents live elsewhere on disk.
- Avoid dragging files into arbitrary Xcode groups without moving the files to the matching folder first.
- When moving, renaming, or adding files, update both the filesystem location and the `.pbxproj` group/file references in the same change.
- Use folder references only for intentional bundle-like resources where Xcode should preserve the folder as a runtime resource, not for normal source organization.
- After generation, every source, asset, config, and test file visible in Xcode should be located at the same relative path inside the repository.

## Gitignore

Every generated Xcode project must include a root `.gitignore`.

- Use `assets/gitignore.apple.template` as the baseline for iOS, iPadOS, macOS, tvOS, visionOS, watchOS, Swift, Swift Package Manager, Xcode, CocoaPods, Carthage, fastlane, generated build output, local user settings, signing artifacts, and common macOS/editor noise.
- If `.gitignore` does not exist, create it from the bundled template.
- If `.gitignore` already exists, merge in missing Apple/Xcode rules while preserving stricter project-specific rules.
- Do not ignore source files, checked-in Xcode project files, `.xcconfig` files, app assets, test fixtures, or package manifests.
- Keep dependency lockfiles tracked by default, including `Package.resolved`, `Podfile.lock`, and `Cartfile.resolved`, unless the repository already has a stricter local convention.
- Keep provisioning profiles, certificates, private keys, export options, derived data, local signing state, and per-user Xcode workspace data out of git.

## Entitlements And Capabilities

Default to no entitlements file. Create an entitlements file only when a selected capability requires one.

Before adding any capability, state why it is necessary and what entitlement or signing capability it adds. Do not add push notifications by default. If the user asks for notifications, distinguish local notifications from remote push notifications; local notifications do not require the push notification entitlement.

Review generated project settings for accidental capabilities before finalizing.

## Creation Approach

Prefer deterministic project generation when the repo already uses XcodeGen, Tuist, Bazel, Swift Package plugins, or another project generator. Otherwise create the smallest conventional `.xcodeproj` that opens in the active Xcode.

When using a generator, keep configuration explicit:

- Swift language version.
- Supported destinations/platforms.
- Deployment targets.
- Build configurations and `.xcconfig` files.
- Entitlements only when required.
- Test target with a minimal initial test.

When hand-editing an Xcode project, avoid broad `.pbxproj` rewrites. Make narrow changes and validate by opening/building through command-line tools.

## Validation

After creating the project:

1. Run `xcodebuild -list -project <project>.xcodeproj`.
2. Build the selected simulator destination with `xcodebuild` piped through `xcsift` when available.
3. Verify the target has no unexpected entitlements or capabilities.
4. Confirm the selected simulator devices from `references/platform-specs.md` are available or record the local substitute used.
5. Confirm root `.gitignore` exists and includes the Apple/Xcode baseline without hiding files that should be versioned.
6. Confirm the Xcode Project Navigator group hierarchy mirrors the filesystem hierarchy and that file references do not point outside their visible group paths.

Use the `xcode-terminal` and `xcsift` skills for build, test, simulator, archive, or Xcode diagnostics.

## Troubleshooting Xcode And SwiftPM Cache Sandboxing

### Problem Statement

Xcode and SwiftPM may fail in sandboxed or automation worktrees even when the project is valid. A common failure appears during package resolution or early compilation:

```text
Could not resolve package dependencies
error opening '/Users/<user>/.cache/clang/ModuleCache/Swift-*.swiftmodule' for output: Operation not permitted
unable to load standard library for target 'arm64-apple-*'
```

Another related failure happens when SwiftPM's repository cache metadata exists but the referenced checkout directories are missing:

```text
Git command 'git -C .../Library/Caches/org.swift.swiftpm/repositories/<package-id> config --get remote.origin.url' failed
fatal: cannot change to ... No such file or directory
```

These failures usually mean Xcode, SwiftPM, or Swift is writing to user-global cache locations that the current workspace cannot modify, or the local SwiftPM cache is partial/stale. Do not treat this as an app compile failure until cache paths have been isolated and package caches have been checked.

### Solution

Run Xcode through a workspace-local environment wrapper so `HOME`, SwiftPM cache, Clang module cache, Swift module cache, DerivedData, and result bundles all live under writable project-local paths. Prefer reusing an existing populated `SourcePackages` directory when network access is restricted; otherwise allow SwiftPM to resolve into the local cache.

Use the bundled helper scripts:

```bash
# Print the environment that will be used for Xcode.
/Users/mhjaso/.codex/skills/xcode-project-creator/scripts/xcode_sandbox_env.sh --print -- -version

# Run a project list or build/test command with local caches.
/Users/mhjaso/.codex/skills/xcode-project-creator/scripts/xcode_sandbox_env.sh -- -list -project MyApp.xcodeproj

# Diagnose common cache problems before retrying a build.
/Users/mhjaso/.codex/skills/xcode-project-creator/scripts/diagnose_xcode_cache.sh .
```

When a repo already has its own Xcode wrapper, use the repo wrapper first. If it still writes to `/Users/<user>/.cache`, retry with this skill's wrapper or update the repo wrapper to also set `HOME`, `CFFIXED_USER_HOME`, `CLANG_MODULE_CACHE_PATH`, `SWIFT_MODULE_CACHE_PATH`, `SWIFTPM_CACHE_PATH`, `XDG_CACHE_HOME`, and `DARWIN_USER_CACHE_DIR`.

If validation is still blocked:

- Confirm a populated package checkout exists, usually under `.derivedData/SourcePackages/checkouts` or another known DerivedData cache.
- Set `XCODE_PROJECT_CREATOR_SOURCE_PACKAGES=/path/to/SourcePackages` before running `xcode_sandbox_env.sh` to reuse that cache.
- If no package cache exists and the environment has restricted network access, request approval before running package resolution or tests that need dependency downloads.
- Only report app compile errors after cache isolation succeeds and `xcodebuild` reaches compilation.

## References

- Read `references/platform-specs.md` before choosing simulator devices, platform defaults, or platform folder names.
- Use `assets/gitignore.apple.template` as the canonical `.gitignore` baseline for generated Apple projects.


## Testing
- Use swift-snapshot-testing (https://github.com/pointfreeco/swift-snapshot-testing) for screenshot testing.
