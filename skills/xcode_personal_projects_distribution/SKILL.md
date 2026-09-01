---
name: xcode-personal-projects-distribution
description: Set up and validate signing and Xcode Cloud distribution for personal Apple-platform projects, using the Ecelyo app as the local reference when the repository does not define a clear convention. Use for App Store Connect readiness, bundle IDs, xcconfig signing policy, shared archive schemes, Xcode Cloud hooks, and TestFlight handoff; do not use for enterprise or organization-specific release infrastructure.
---

# Personal Xcode project distribution

Use this skill for personally owned iOS, iPadOS, macOS, and watchOS projects. It complements `xcode-release-publisher`: this skill establishes the signing and hosted-distribution contract, while the release skill handles versioned release preparation and candidate publishing.

The directory name intentionally follows the user's requested name, `xcode_personal_projects_distribution`. The frontmatter uses the normalized hyphenated form required by the skill validator.

## Core policy

- Prefer Xcode Cloud for TestFlight and App Store distribution. Local archives are for diagnostics or an explicitly requested manual handoff only.
- Keep local development signing and Xcode Cloud signing in separate configurations. Do not make a local provisioning profile or certificate a prerequisite for a hosted build.
- Keep signing policy in `.xcconfig` files whenever Xcode can apply the setting there. Touch `project.pbxproj` only when the setting cannot be expressed or attached through configuration files.
- Never commit certificates, private keys, provisioning profiles, App Store Connect API keys, passwords, or machine-specific signing paths.
- Do not copy another project's team identifier, bundle identifiers, profile names, entitlements, or App Store metadata. Inspect the current project's registrations and preserve its intentional target mapping.
- A beta Xcode version may be used for development when requested, but hosted distribution should use the selected stable/latest-release Xcode alias. Keep the previous stable version as the fallback when a beta exporter or SDK changes behavior.
- Do not access App Store Connect or operate a hosted workflow on the user's behalf unless the user explicitly asks for that action and the required account boundary is clear.

## Reference implementation

When the repository is ambiguous, inspect the local Ecelyo app at `/Users/mhjaso/Developer/Projects/ecelyo_app` before deciding. Read only the relevant files and do not modify that checkout as part of a Papiplan or other personal-project task.

The useful Ecelyo patterns are:

- `Configuration/Base.xcconfig` owns shared version/build settings and the Apple team setting. Platform configurations inherit from it.
- `Configuration/iPhone.xcconfig` and `Configuration/Mac.xcconfig` own platform identifiers and local Development/Distribution signing. Their local configurations may use explicit installed profile names for the developer's machine.
- `Configuration/iPhoneXcodeCloud.xcconfig` and `Configuration/MacXcodeCloud.xcconfig` inherit the platform settings but override the signing mode to `Automatic` and keep signing enabled. They do not pin an identity or provisioning profile.
- Shared schemes named for Xcode Cloud use a dedicated `Release (Xcode Cloud)` configuration for their Archive action. The scheme is committed under `xcshareddata/xcschemes` so Xcode Cloud can discover it.
- `ci_scripts/ci_post_clone.sh` performs fast repository-side guards in the intended Xcode Cloud workflow. `ci_scripts/ci_pre_xcodebuild.sh` is gated by `CI_XCODE_CLOUD=TRUE`, validates the environment, and applies the hosted build number without committing generated values.
- `scripts/xcode/validate_xcode_cloud_release_configuration.sh` checks resolved signing settings and builds unsigned simulator products for structural validation. `scripts/xcode/archive_distribution_apps.sh` is the explicit local/manual archive path and verifies the resulting signature, bundle identifier, team, and Apple Distribution authority.
- `Ecelyo.xcodeproj/xcshareddata/xcodecloud/manifest.json` records the target selected for the Xcode Cloud project. Treat service-side workflow configuration as user-owned; keep the repository contract and validation scripts version-controlled.

These are patterns, not values to copy. Ecelyo's actual team and identifiers belong only to Ecelyo.

## Setup sequence

1. Inspect the repository instructions, project targets, schemes, configurations, entitlements, and existing CI hooks. Confirm the current Xcode and SDK paths; unset a stale `DEVELOPER_DIR` before Git or Xcode commands if it points to a missing installation.
2. Inventory the distributed targets. For each iOS/iPadOS, native macOS, and watchOS app target, identify its product name, bundle identifier, App ID, entitlements, deployment target, and intended App Store Connect record. Do not infer a Mac or Watch registration from the iOS registration.
3. Confirm the personal Apple Developer team and registered App IDs in Xcode's signing settings or the repository's documented configuration. Use placeholders or user-provided values in committed files; never invent a team identifier.
4. Put stable values such as `PRODUCT_BUNDLE_IDENTIFIER`, `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`, platform deployment targets, and `DEVELOPMENT_TEAM` in the appropriate `.xcconfig` files. Keep Debug/local distribution and Cloud configurations visibly distinct.
5. For each hosted configuration, use automatic signing and leave `CODE_SIGN_IDENTITY` and `PROVISIONING_PROFILE_SPECIFIER` unpinned unless the repository documents a necessary exception. Xcode Cloud must be able to select or create the correct cloud-managed signing assets.
6. Create or verify a shared scheme for every distributed product. Its Archive action must select the Cloud release configuration and the correct app target. Test schemes may remain separate; do not make a test bundle the distribution target.
7. Add only the smallest necessary `ci_scripts` hooks. Gate hosted-only behavior with `CI_XCODE_CLOUD=TRUE`, keep scripts idempotent, fail with a diagnostic exit code, and never commit a generated build number or modified temporary signing material.
8. In Xcode Cloud, connect the private GitHub repository, select the personal team, select the intended stable Xcode version, and configure test, archive, and distribution actions. Use an App Store Connect record that already contains the matching bundle identifier. The user owns service-side credentials, workflow activation, and TestFlight groups.
9. Validate the repository contract locally, then let Xcode Cloud perform the signed archive/export. Do not replace a hosted failure with a local identity override; fix the configuration or report the missing Apple-side registration.

## Build-number contract

Use one integer `CFBundleVersion` per hosted product release. If Xcode Cloud owns the number, read `CI_BUILD_NUMBER` in a pre-build hook and make the injection idempotent. Keep the committed configuration at the repository's documented sentinel or neutral value; never commit the hosted number.

The hook must reject an absent, zero, negative, or non-numeric build number and must verify the final product's embedded value. Marketing version and build number are separate: `MARKETING_VERSION` is the user-visible release version, while `CFBundleVersion` is the monotonically increasing App Store build number.

## Validation ladder

Choose the narrowest sufficient checks, using `xcsift` for Swift/Xcode build output:

1. Inspect `xcodebuild -list` and resolved `-showBuildSettings` for every Cloud scheme/configuration.
2. Verify shared schemes have an Archive action, the expected Cloud configuration, signing enabled, automatic signing, and no unexpected profile override.
3. Run repository-only CI hook tests with representative local and Xcode Cloud environment variables. Confirm local execution is a no-op where appropriate.
4. Build the Cloud configuration for a simulator or generic unsigned destination to catch target, Info.plist, entitlement, and configuration errors without touching a private key.
5. After the user runs Xcode Cloud, verify the hosted archive/export reports the intended target, bundle identifier, team, marketing version, integer build number, and App Store/TestFlight destination.

Do not run a signed device build, archive, export, upload, `codesign`, or any command that may access a private key without requesting immediate user approval first. The user must answer any Keychain or SecurityAgent prompt locally.

## Common failure handling

- **No App Store record or bundle ID:** stop at repository preparation and report the exact missing Apple-side registration; do not change identifiers to make the build pass.
- **Cloud signing cannot match the target:** compare the target's bundle identifier, entitlements, team, and automatic-signing configuration. Remove stale profile or identity overrides before retrying.
- **Local build says the selected Xcode is missing:** inspect installed Xcodes and use the previous stable developer directory for validation. Do not silently switch a hosted workflow to a beta.
- **Cloud build number is rejected:** inspect the hook and Info.plist source, then verify that the hosted value is a positive integer and that repeated hook execution produces the same result.
- **Archive succeeds but TestFlight cannot accept it:** compare the archive's signed identifier, entitlements, version/build pair, and App Store Connect record. Treat export/distribution as a hosted signing problem until those values are proven correct.

## Completion criteria

The distribution setup is ready when the repository has version-controlled configuration and shared schemes, every distributed target maps to an intentional personal App ID, Cloud signing is automatic and unpinned, the hosted build-number contract is validated, and the user can run the Xcode Cloud workflow to produce an App Store Connect/TestFlight artifact. A local unsigned build alone is not evidence of TestFlight readiness.
