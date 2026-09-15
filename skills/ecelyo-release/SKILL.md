---
name: ecelyo-release
description: Prepare Ecelyo releases and Xcode Cloud builds from the persistent release-candidate branch, including semantic-version bumps, immutable milestone tags, release notes, and PR integration into main.
---

# Ecelyo Release Workflow

Use `release-candidate` for every normal release and every requested Xcode Cloud build.
All release-related changes must return to `main` through a pull request; never push release
changes directly to `main`.

## Release and build rules

1. A normal release bumps `MARKETING_VERSION` according to the Xcode release contract:
   patch by default, minor for persisted model/database fields or an explicitly requested
   feature/minor release, and major only when explicitly requested. Never reuse an existing
   immutable semantic-version tag.
2. A new release version receives an annotated immutable tag named exactly `<version>` after
   the candidate has passed the required hosted gates.
3. Every build, including ordinary releases, receives an additional annotated immutable
   milestone tag named `<version>-<UTC-timestamp>`, for example `1.4.2-20260911-143000`.
   The timestamp must make the tag unique; never move or overwrite an existing build tag.
4. Regenerate release notes every time from the last eight semantic-version tags. Select tags
   matching `^(v)?MAJOR.MINOR.PATCH$`; ignore timestamped build tags and other markers. Compare
   the oldest selected tag through candidate `HEAD`, including user-visible changes across those
   releases and commits since the newest tag. If fewer than eight semantic tags exist, use all
   available and report the count; stop only when none exist. Include only user-visible features
   and fixes.
5. Xcode Cloud is the default release mode. Pushing `release-candidate` triggers the hosted
   build; do not open or operate Apple-hosted services. The account owner handles Xcode Cloud,
   TestFlight, App Store Connect, Apple Developer, and CloudKit Console actions.

## Normal release

1. Verify the primary checkout is clean and current with `origin/main`, fetch tags, inspect
   the latest immutable semantic-version tag, and confirm GitHub authentication and remotes.
2. Recreate the persistent sibling worktree at `~/Developer/Projects/ecelyo_app-release` from
   the latest `origin/main`, checking that `release-candidate` is the only release branch used.
3. Select the semantic version, update the authoritative marketing-version setting, and create
   `RELEASE_NOTES.md` plus required localized store/beta metadata and in-app release notes.
4. Run the fast release metadata and Xcode Cloud build-configuration checks. Do not push if
   they fail; create the appropriate Ecelyo release task and report the blocker.
5. Commit the complete release change on `release-candidate`, review the diff, and push the
   branch. Do not create the version or build tags until the hosted build succeeds.
6. After the owner confirms the hosted build and distribution gates pass, create and push the
   exact-version tag and the unique timestamped build tag on the validated candidate commit.
7. Open a PR with `release-candidate` as head and `main` as base containing only release-related
   changes. Merge that PR through GitHub after review/required protection checks. Do not use a
   local merge as a substitute. Keep the persistent remote branch available for Xcode Cloud.
8. Verify the merged `main`, the release tags, and the remote `release-candidate` ref.

## New build without a version bump

1. Start from the latest `origin/main` in the persistent release worktree and use the existing
   `MARKETING_VERSION`.
2. Add only requested build/release-note or hotfix changes, run the fast configuration checks,
   commit on `release-candidate`, and push it to trigger Xcode Cloud.
3. After the owner confirms the build succeeds, create and push only the unique
   `<version>-<UTC-timestamp>` annotated tag on that build commit.
4. Open and merge a PR for any new release-related changes; do not create a PR for an unchanged
   commit merely to mark a build.

## Hotfixes and failures

Use `release-candidate-hotfix` when the hosted build fails. Fix the root cause in a dedicated
worktree/branch, verify locally, merge the fix into `main` through a PR, then recreate
`release-candidate` from the merged `origin/main`, push it, and repeat hosted validation and
timestamp tagging. Never push directly to `main`.

## Stop conditions and report

Stop on missing tags, an unsafely dirty worktree, a failed required release gate, an existing
conflicting immutable tag, or a push error. Report the exact error and furthest completed step.
Do not present scheme discovery details as a blocker in the handoff table.

Every release/build handoff must use this table and must not add Apple-service or pull-request rows:

| Detail | Value |
|---|---|
| Target platform | macOS (or requested platform) |
| Release mode | Xcode Cloud or Xcode manual |
| Marketing version | `<version>` |
| Release-note comparison | `<semantic-tag> → candidate` |
| Release notes / metadata | `<paths>` |
| Candidate commit | `<SHA>` |
| Build number | `<hosted build number or Xcode Cloud assigned>` |
| Xcode configuration | `<passed / not run / failed>` |
| Requires iCloud schema deploy | `Yes / No / Unknown` |
| Candidate push | `<status>` |
| Build milestone tag | `<version>-<UTC-timestamp>` or `Not created` |
| Hosted build | `<status>` |
| Blocker | `<none or concise actionable blocker>` |
