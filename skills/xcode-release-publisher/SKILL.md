---
name: xcode-release-publisher
description: Prepare and publish releases for Xcode projects by deriving customer-facing notes, selecting a semantic version, honoring the repository-defined build-number system, updating release metadata and localization catalogs, building the requested Apple platform, pushing the reusable release-candidate branch, orchestrating a repository-defined Xcode Cloud release when requested, tagging the validated candidate, and opening the release pull request. Use when Codex needs to generate, cut, prepare, validate, or publish a release for an Xcode app or Apple-platform project.
---

# Xcode Release Publisher

Prepare the complete release candidate, not only its notes. Load and follow `xcode-terminal-operator` and `xcode-output-parser` for Xcode discovery and builds, and `github-cli-operator` for GitHub authentication, push, tag, label, and pull-request work.

## Release Contract

- Default the target platform to macOS. Honor an explicitly requested Apple platform.
- Use semantic versioning. Choose a minor bump when the range contains any user-visible feature. Choose a patch bump only when it contains subtle improvements and fixes. Never choose a major bump unless the developer explicitly requests it. Keep a `0.x` app on `0.x` unless a major release is explicitly requested.
- Follow the repository's build-number convention. In the absence of one, increment the highest numeric build number among the released app targets by one. When the repository commits a fake sentinel and generates timestamp-based build numbers during compilation, preserve the sentinel, never commit a generated build number, and validate the embedded artifact value instead.
- Create or replace `RELEASE_NOTES.md` at the project root with App Store-facing notes. Keep them witty, amusing, informal, and nearly funny. Avoid excessive technical detail; compress internal cleanup into a light line such as “and all of those nice improvements without which I would not be making this release in the first place.” Do not claim changes unsupported by the release range.
- Keep internal release notes separate. They may share content with `RELEASE_NOTES.md`, but one does not replace the other.
- Put every source-controlled release change, including `RELEASE_NOTES.md` and any required build-number update, in one pull request from the branch named exactly `release-candidate`.
- Title the pull request with the bare version, such as `1.4.0`.
- Create the release commit on `release-candidate`. Do not publish the immutable semantic-version tag until every required local and hosted release gate passes.
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
3. Inspect the effective Xcode build-number convention (`CURRENT_PROJECT_VERSION` or its repository-defined equivalent) for every released app target.
   - For a conventional committed number, require numeric values, choose the highest value plus one, and update all relevant configurations consistently. Prefer Apple Generic Versioning; otherwise update the authoritative build setting rather than a generated plist.
   - For a repository-defined fake sentinel plus build-time timestamp, require the sentinel to remain unchanged, verify every released app target uses the version-controlled generator, and do not write the generated value into source files.
   - Inspect documented Xcode Cloud hooks and release specifications. Do not replace, disable, or duplicate their build-number ownership.
4. Update the marketing version in the authoritative Xcode setting or repository version file.
5. Create or replace root-level `RELEASE_NOTES.md` with concise App Store notes for this release. Include the version as a heading unless the repository's established store format requires otherwise.
6. Update any configured internal release-note destination. If release-note entries live in a `Localizable.xcstrings` or similar strings catalog, remove stale release-note entries and add the current list without disturbing unrelated localization data.
7. Confirm that the marketing version, effective build-number plan, internal notes, and App Store notes describe the same release.

## 3. Build and Validate the Release Candidate

1. Use the repository's documented build entry point when available; otherwise discover the workspace or project and shared app scheme narrowly.
2. Build the app in Release configuration for the requested platform, defaulting to macOS. Use a deterministic destination appropriate to that platform and pipe every `xcodebuild`, `swift build`, or test invocation through `xcsift` as required by `xcode-output-parser`.
3. Do not archive or submit to App Store Connect unless explicitly requested or the developer asked to publish through a documented repository release workflow. Do not bypass signing or project settings merely to manufacture a passing result.
4. If the build fails, diagnose the failure, keep coherent release work safely on `release-candidate`, and do not tag, push release tags, or open a ready release pull request as though validation passed.
5. When publication uses Xcode Cloud:
   - Treat the repository's workflow specification and `ci_scripts` hooks as authoritative.
   - Verify the required schemes, actions, destinations, build-number ownership, and distribution gate before publication. For timestamp-based numbering, confirm every artifact contains a valid timestamp for its own compilation and never the committed fake sentinel; require identical artifact numbers only when the repository contract explicitly requires them.
   - Defer hosted execution until the candidate branch is pushed in the next section, and do not create release tags yet.

## 4. Commit, Publish the Candidate, Tag, and Open the PR

1. Review the release diff and verify it contains no unrelated changes. Ensure both the build-number update and `RELEASE_NOTES.md` are present.
2. Create the initial release commit on `release-candidate`, using `Prepare <version> release` unless repository instructions require another style. Hosted-only fixes may add candidate commits before the final tag; do not pretend an unvalidated commit is immutable.
3. Replace `origin/release-candidate` with the local branch using `--force-with-lease`. Do not push release tags yet when hosted validation remains.
4. Before creating the pull request, inspect and follow the repository PR template and label definitions. Add the matching existing labels, including the active agent label when available.
5. Open a pull request to the default branch with:
   - title: exactly `<version>`
   - head: exactly `release-candidate`
   - body: the repository template when present, otherwise concise Summary, Validation, Risks, and Related Links sections
   - final section: `## Talk to the agent` with the current Codex task deep link
6. When publication uses Xcode Cloud, keep the pull request in draft while hosted stabilization is active, then:
   - Run the documented workflow from `release-candidate`.
   - Record the run URL, committed build-number convention, final artifact build number or numbers, destinations, and distribution result.
   - Fix hosted-only failures on the same candidate branch, push follow-up commits normally, and rerun without publishing immutable version tags. Use `--force-with-lease` only after an intentional history rewrite or branch recreation.
   - Require the final hosted archive and intended distribution to succeed before continuing.
7. Use a draft pull request only while release development or hosted stabilization is incomplete. Mark it ready when all required release gates pass and human review is the remaining step.
8. After the final required local or hosted gate passes, create an annotated tag named exactly `<version>` on the validated candidate head. Refuse to move an existing semantic-version tag.
9. Maintain exactly one movable `release_notes` tag by deleting its local reference when present and recreating it on the same validated commit.
10. Push the immutable semantic-version tag. Force-update only the intentionally movable remote `release_notes` tag; never force-update a semantic-version tag.
11. Do not merge the new release pull request unless the developer separately requests it. The eventual merge method should preserve the tagged release commit. If repository policy requires squash merging, recreate the semantic-version and `release_notes` tags on the merged default-branch commit after merge.
12. Return to the default branch only after all release work is safely committed, pushed, tagged, and represented by the pull request.

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
- marketing version, committed build-number convention, and embedded artifact build number or numbers
- App Store and internal release-note destinations
- release commit hash
- semantic-version and `release_notes` tag actions
- pushed branch and tags
- pull request URL, or the exact no-PR blocker
- Xcode Cloud run URL and distribution result when hosted publication was requested

End with `RELEASE NOTES CREATED AT <CURRENT DATE>`, including day, month, year, hour, and minute.
