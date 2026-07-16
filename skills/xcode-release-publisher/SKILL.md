---
name: xcode-release-publisher
description: Prepare and publish releases for Xcode projects by deriving customer-facing notes, selecting a semantic version, incrementing the App Store build number, updating release metadata and localization catalogs, building the requested Apple platform, committing and tagging the release, pushing the reusable release-candidate branch, and opening the release pull request. Use when Codex needs to generate, cut, prepare, or publish a release for an Xcode app or Apple-platform project.
---

# Xcode Release Publisher

Prepare the complete release candidate, not only its notes. Load and follow `xcode-terminal-operator` and `xcode-output-parser` for Xcode discovery and builds, and `github-cli-operator` for GitHub authentication, push, tag, label, and pull-request work.

## Release Contract

- Default the target platform to macOS. Honor an explicitly requested Apple platform.
- Use semantic versioning. Choose a minor bump when the range contains any user-visible feature. Choose a patch bump only when it contains subtle improvements and fixes. Never choose a major bump unless the developer explicitly requests it. Keep a `0.x` app on `0.x` unless a major release is explicitly requested.
- Increment the Xcode build number sequentially. In the absence of a stronger repository convention, use the highest numeric build number among the released app targets plus one.
- Create or replace `RELEASE_NOTES.md` at the project root with App Store-facing notes. Keep them witty, amusing, informal, and nearly funny. Avoid excessive technical detail; compress internal cleanup into a light line such as “and all of those nice improvements without which I would not be making this release in the first place.” Do not claim changes unsupported by the release range.
- Keep internal release notes separate. They may share content with `RELEASE_NOTES.md`, but one does not replace the other.
- Put every release change, including the build number and `RELEASE_NOTES.md`, in one pull request from the branch named exactly `release-candidate`.
- Title the pull request with the bare version, such as `1.4.0`.
- Create one release commit and tag that commit with the bare version, such as `1.4.0`.
- Push the branch and tags and open the pull request. Do not merely return a comparison URL.

## 1. Establish a Safe Release Range

1. Read the repository instructions and any supplied automation memory before editing.
2. Require a clean understanding of existing changes. Preserve unrelated user work and stop if it cannot be separated safely.
3. Verify GitHub CLI authentication, the `origin` repository, the default branch, and the Xcode workspace or project and shared scheme.
4. Fetch `origin` and tags.
5. Inspect the pull request and remote history for `release-candidate`:
   - If its previous pull request is open, do not overwrite it. Continue that same release only when the developer asked to update it; otherwise stop and ask for the previous release to be merged.
   - If its previous pull request was closed without merging, stop and ask whether it should be recovered or discarded.
   - If it was merged, update the default branch and verify that the prior release is present before reuse.
6. Recreate local `release-candidate` from the updated `origin` default branch. Reusing this one branch is intentional; replace the remote branch later with `--force-with-lease`, never an unchecked force push.
7. Determine the comparison start from the sole `release_notes` tag. If it does not exist, use the latest semantic-version tag; if neither exists, use the initial commit and report that fallback.
8. Read only the commits and changed files needed to understand the range. Exclude technical-only maintenance from customer notes unless the developer requests it.

## 2. Select Versions and Write Notes

1. Group user-visible changes and rewrite them in customer language.
2. Select the next marketing version using the release contract and the current Xcode marketing version. Cross-check semantic-version tags and stop on unexplained version drift.
3. Find the effective Xcode build number (`CURRENT_PROJECT_VERSION` or its repository-defined equivalent) for every released app target. Require numeric values, choose the highest value plus one, and update all relevant configurations consistently. Prefer the project's configured Apple Generic Versioning mechanism; otherwise update the authoritative build setting rather than a generated plist.
4. Update the marketing version in the authoritative Xcode setting or repository version file.
5. Create or replace root-level `RELEASE_NOTES.md` with concise App Store notes for this release. Include the version as a heading unless the repository's established store format requires otherwise.
6. Update any configured internal release-note destination. If release-note entries live in a `Localizable.xcstrings` or similar strings catalog, remove stale release-note entries and add the current list without disturbing unrelated localization data.
7. Confirm that marketing version, build number, internal notes, and App Store notes describe the same release.

## 3. Build the Release Candidate

1. Use the repository's documented build entry point when available; otherwise discover the workspace or project and shared app scheme narrowly.
2. Build the app in Release configuration for the requested platform, defaulting to macOS. Use a deterministic destination appropriate to that platform and pipe every `xcodebuild`, `swift build`, or test invocation through `xcsift` as required by `xcode-output-parser`.
3. Do not archive or submit to App Store Connect unless explicitly requested. Do not bypass signing or project settings merely to manufacture a passing result.
4. If the build fails, diagnose the failure, keep coherent release work safely on `release-candidate`, and do not tag, push release tags, or open a ready release pull request as though validation passed.

## 4. Commit, Tag, Push, and Open the PR

1. Review the release diff and verify it contains no unrelated changes. Ensure both the build-number update and `RELEASE_NOTES.md` are present.
2. Create one commit on `release-candidate`, using `Prepare <version> release` unless repository instructions require another style.
3. Create an annotated tag named exactly `<version>` on that release commit. Refuse to move an existing semantic-version tag.
4. Maintain exactly one movable `release_notes` tag by deleting its local reference when present and recreating it on the new release commit.
5. Replace `origin/release-candidate` with the local branch using `--force-with-lease`. Push the immutable semantic-version tag. Force-update only the intentionally movable remote `release_notes` tag to the new commit; never force-update a semantic-version tag.
6. Before creating the pull request, inspect and follow the repository PR template and label definitions. Add the matching existing labels, including the active agent label when available.
7. Open a pull request to the default branch with:
   - title: exactly `<version>`
   - head: exactly `release-candidate`
   - body: the repository template when present, otherwise concise Summary, Validation, Risks, and Related Links sections
   - final section: `## Talk to the agent` with the current Codex task deep link
8. Do not merge the new release pull request unless the developer separately requests it. The eventual merge method should preserve the tagged release commit. If repository policy requires squash merging, recreate the semantic-version and `release_notes` tags on the merged default-branch commit after merge.
9. Return to the default branch only after all release work is safely committed, pushed, tagged, and represented by the pull request.

## Failure Handling

- Keep edits scoped to release work; do not fix unrelated issues.
- Never overwrite an open or unmerged previous release candidate.
- Never reuse an existing version tag for different content.
- If remote publication fails, preserve the coherent local commit and report the exact failed operation.
- Always report the pull request URL, or the exact blocker that prevented creating it.

## Final Output

Report:

- target platform and build result
- release comparison range
- marketing version and build-number changes
- App Store and internal release-note destinations
- release commit hash
- semantic-version and `release_notes` tag actions
- pushed branch and tags
- pull request URL, or the exact no-PR blocker

End with `RELEASE NOTES CREATED AT <CURRENT DATE>`, including day, month, year, hour, and minute.
