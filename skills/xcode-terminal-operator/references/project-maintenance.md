# Project Maintenance

## Principles for AI Agents

- Preserve the existing project management style.
- Prefer source-level changes before project-file changes.
- Prefer existing generators or scripts when the repo uses them.
- Treat `.xcodeproj/project.pbxproj` as a structured project file, not free-form text.
- Do not reorder project sections for style.
- After any project file edit, run at least one discovery command and the narrowest relevant build.

## Before Editing

Inspect:

```bash
find . -maxdepth 3 \( -name '*.xcodeproj' -o -name '*.xcworkspace' -o -name 'Package.swift' -o -name 'project.yml' -o -name 'project.yaml' -o -name 'xcodegen.yml' -o -name 'Tuist.swift' -o -name 'Project.swift' \)
xcodebuild -list -json -workspace <workspace>
xcodebuild -showBuildSettings -json -workspace <workspace> -scheme <scheme>
```

Look for:

- XcodeGen, Tuist, Bazel, Buck, CMake, or custom generation scripts.
- Shared schemes under `xcshareddata/xcschemes`.
- Local-only schemes under `xcuserdata`, which may not exist in CI.
- Package managers: SwiftPM, CocoaPods, Carthage, internal scripts.

## Project File Changes

Safe order:

1. Use the repo's generator or project-management command if present.
2. Use an established local script or tool already used by the repo.
3. Edit `.pbxproj` only when necessary and small.

After `.pbxproj` changes:

```bash
xcodebuild -list -json -project <project>
xcodebuild -showBuildSettings -json -project <project> -scheme <scheme>
xcodebuild build ... 2>&1 | xcsift -f toon
```

Diff-check:

- New files are in the expected target membership.
- Build phases contain expected entries only once.
- File references use the existing group style.
- No unrelated UUID churn occurred.
- Shared schemes remain shared if CI depends on them.

## Build Settings

Prefer `.xcconfig` files for reusable build setting changes. Command-line build settings are good for one-off verification but should not become hidden long-term project configuration.

Be careful with global overrides:

- `XCODE_XCCONFIG_FILE` overrides all other build settings.
- `-xcconfig` overrides project settings.
- Command-line `SETTING=value` overrides the resolved project configuration for that invocation.

## Signing and Provisioning

Signing changes are high risk because they can contact Apple services, modify profiles, or require credentials.

- Do not add `-allowProvisioningUpdates` unless the user asks.
- Do not register devices unless the user asks.
- Do not change team IDs, bundle IDs, entitlements, or provisioning profile names casually.
- Prefer read-only inspection first: `-showBuildSettings -json`, entitlements files, and existing export plists.

## Cleanups

Avoid broad cleanup commands by default:

- Do not run `xcodebuild clean` unless stale build products are the suspected issue.
- Do not delete global DerivedData unless the user asks.
- Do not erase simulators unless simulator state is the problem and user approves.

Prefer repo-local cleanup for paths the agent created, such as `.derivedData/<scheme>` or `.build-results/<run>.xcresult`.
