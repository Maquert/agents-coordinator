---
name: xcode-release-publisher
description: Prepare and publish releases for Xcode projects by deriving customer-facing notes, selecting a semantic version, honoring the repository-defined build-number system, updating release metadata and localization catalogs, preparing either an Xcode manual or explicitly requested Xcode Cloud release, pushing the persistent release-candidate branch, tagging the validated candidate, and integrating it locally without a GitHub pull request for that branch. Use when Codex needs to generate, cut, prepare, validate, or publish a release for an Xcode app or Apple-platform project.
---

# Xcode Release Publisher

Prepare the complete release candidate, not only its notes. Load and follow `xcode-terminal-operator` and `xcode-output-parser` for Xcode discovery and builds, and `github-cli-operator` for GitHub authentication, branch pushes, and tags.

## Release Modes

There are two supported release modes. Select one explicitly at the start of every release and state it in the handoff:

- **Xcode manual** — the current default. The developer opens the pushed `release-candidate` branch in Xcode and owns the signed archive, App Store Connect upload, and final release action. Use the repository's local build phase or other documented local build-number generator, validate the embedded artifact locally when Xcode is available, and stop at the developer handoff. Do not assume Xcode Cloud, trigger hosted workflows, create release tags, or merge the candidate unless the developer asks to continue after upload.
- **Xcode Cloud** — opt in only when the developer explicitly requests it or the repository release request names it. Follow the repository's Xcode Cloud workflow, hooks, hosted build-number ownership, and distribution gates. Pushes to `release-candidate` may trigger hosted validation; do not tag or integrate until the hosted run succeeds.

If the developer does not name a mode, use **Xcode manual**.

## Release Contract

- Default the target platform to macOS. Honor an explicitly requested Apple platform.
- Use semantic versioning. Choose a minor bump when the range contains any user-visible feature. Choose a patch bump only when it contains subtle improvements and fixes. Never choose a major bump unless the developer explicitly requests it. Keep a `0.x` app on `0.x` unless a major release is explicitly requested.
- Follow the repository's build-number convention. In the absence of one, increment the highest numeric build number among the released app targets by one. When the repository commits a fake sentinel and generates timestamp-based build numbers during compilation, preserve the sentinel, never commit a generated build number, and validate the embedded artifact value instead. If a Unix epoch-minute value exceeds Apple's `CFBundleVersion` component limits, preserve the exact minute in an ordered 4.2.2-digit encoding such as `NNNN.NN.NN` rather than embedding an invalid oversized integer.
- Create or replace `RELEASE_NOTES.md` at the project root with App Store-facing notes. Keep them witty, amusing, informal, and nearly funny. Avoid excessive technical detail; compress internal cleanup into a light line such as “and all of those nice improvements without which I would not be making this release in the first place.” Do not claim changes unsupported by the release range.
- Require version-controlled store metadata on `release-candidate`: the evergreen app description, version-specific App Store release notes, and beta tester “What to Test” notes for every repository-supported locale. Prefer `release-metadata/<locale>/app-description.md`, `release-notes.md`, and `beta-build-notes.md` unless the repository defines another location. These files are a reviewable handoff and do not authorize App Store Connect access or upload.
- Keep internal release notes separate. They may share content with `RELEASE_NOTES.md`, but one does not replace the other.
- Keep every source-controlled release change, including `RELEASE_NOTES.md` and any required build-number update, on the branch named exactly `release-candidate`.
- Use one persistent linked worktree for all releases, located beside the primary repository as `<repository-directory>-release`. Reuse it for every release; never create version-specific release worktrees. For Ecelyo, the required path is `/Users/mhjaso/Developer/Projects/ecelyo_app-release`.
- Never create, open, update, or merge a GitHub pull request whose head is `release-candidate`. In Xcode Cloud mode, GitHub's post-merge branch cleanup can delete this persistent branch and break Xcode Cloud's branch binding; in Xcode manual mode, the persistent branch remains the developer's upload handoff.
- Create the release commit on `release-candidate`. Do not publish the immutable semantic-version tag until every required local and hosted release gate passes.
- Push the candidate branch and validated tags directly. Review the candidate through its local diff and hosted artifacts; do not use a pull request for this persistent branch.
- After the required release gates pass, integrate `release-candidate` with local Git rather than GitHub's merge operation only when the developer requests integration. In Xcode Cloud mode, keep `origin/release-candidate` intact so Xcode Cloud retains its branch binding. Never use `gh pr merge`, the GitHub merge API, or the GitHub merge button for this branch.
- Honor explicit credential-ownership boundaries. When the developer reserves App Store Connect credentials or console access, complete repository-side preparation and validation only; do not open, authenticate with, or operate App Store Connect, and report the user-owned hosted handoff clearly.
- Keep release preparation proportional to the selected mode. Do not run local unit tests, screenshot tests, or other test suites unless the developer explicitly requests them for that release. In Xcode manual mode, run the narrowest requested local build/archive validation when Xcode is available; do not upload or access App Store Connect. In Xcode Cloud mode, run only fast repository and metadata contract checks before pushing and let Xcode Cloud perform the normal release validation.

## 0. Commit Release Notes on Main Before Starting the Release

Perform this phase on the primary default-branch checkout before creating or refreshing the persistent release worktree or `release-candidate` branch.

1. Require a clean, up-to-date default branch and fetch tags. Save the current `release_notes` tag (or the documented first-release fallback) as the comparison start before changing it.
2. Read only the commits in that range that describe user-visible work. Filter out technical-only changes, group the remaining changes, and rewrite them as clear customer-facing release notes.
3. Remove stale release-note entries from the repository's existing release-note destination and `Localizable.xcstrings` or equivalent catalog when present. Create the new internal release-note list in the repository-defined destination. If the destination cannot be inferred safely, stop before editing.
4. Select the semantic version for this release using the release contract and carry it into the candidate phase. Do not update the Xcode marketing version, build number, App Store metadata, or beta metadata on main.
5. Commit only the release-note changes on the default branch, using `Prepare <version> release notes` unless repository instructions require another style. Move the single `release_notes` tag to this commit and push both the default branch and that marker tag.
6. Treat this note commit as the committed release baseline. Create or refresh the persistent release worktree and `release-candidate` from the updated default branch. Do not regenerate the same notes from the moved marker; only append candidate-specific user-visible changes later on `release-candidate`.

## 1. Establish a Safe Release Range

1. Read the repository instructions and any supplied automation memory before editing.
2. Require a clean understanding of existing changes. Preserve unrelated user work and stop if it cannot be separated safely.
3. Verify GitHub CLI authentication, the `origin` repository, the default branch, and the Xcode workspace or project and shared scheme.
4. Fetch `origin` and tags.
5. Inspect the remote history for `release-candidate`. If a pull request currently uses it as the head branch, do not merge that pull request; close it before continuing so repository automation cannot delete the persistent branch.
6. Create the persistent sibling release worktree only when it does not already exist, then reuse it for every release. In that worktree, recreate local `release-candidate` from the updated `origin` default branch. If `release-candidate` is checked out in an obsolete release worktree, require it to be clean, remove that worktree, and attach the branch at the persistent path without losing its commit. Reusing this one worktree and branch is intentional; replace the remote branch later with `--force-with-lease`, never an unchecked force push.
7. Use the release-note comparison range and version captured in Phase 0. The moved `release_notes` tag now marks the committed note baseline; do not treat it as an empty release and do not discard the pre-generated notes.
8. Read only candidate-specific commits and changed files needed to identify additions after the Phase 0 note commit. Exclude technical-only maintenance from any note additions unless the developer requests it.

## 2. Select Versions and Write Notes

1. Preserve the Phase 0 release-note list and selected version. If candidate-specific commits add user-visible work, append only those changes in customer language.
2. Apply the carried version to the current Xcode marketing version. Recalculate only when candidate-specific changes materially change the release scope; cross-check semantic-version tags and stop on unexplained version drift.
3. Inspect the effective Xcode build-number convention (`CURRENT_PROJECT_VERSION` or its repository-defined equivalent) for every released app target.
   - For a conventional committed number, require numeric values, choose the highest value plus one, and update all relevant configurations consistently. Prefer Apple Generic Versioning; otherwise update the authoritative build setting rather than a generated plist.
   - For a repository-defined fake sentinel plus build-time timestamp, require the sentinel to remain unchanged, verify every released app target uses the version-controlled generator, and do not write the generated value into source files.
   - Inspect documented build hooks and release specifications for the selected mode. In Xcode manual mode, preserve and validate the local date/timestamp generator. In Xcode Cloud mode, do not replace, disable, or duplicate Xcode Cloud's build-number ownership.
4. Update the marketing version in the authoritative Xcode setting or repository version file.
5. Create or replace root-level `RELEASE_NOTES.md` with concise App Store notes for this release. Include the version as a heading unless the repository's established store format requires otherwise.
6. Create or update the localized app description, App Store release notes, and beta tester build notes in the repository metadata directory. Keep beta notes practical and test-oriented; include the platform, version, build-number check, and the most important changed flows.
7. Update any configured internal release-note destination. If release-note entries live in a `Localizable.xcstrings` or similar strings catalog, remove stale release-note entries and add the current list without disturbing unrelated localization data.
8. Confirm that the marketing version, effective build-number plan, internal notes, App Store notes, app description, and beta tester notes describe the same release.

## 3. Build and Validate the Release Candidate

1. Use the repository's documented fast release-contract entry points when available; otherwise discover the workspace or project and shared app scheme narrowly.
2. Do not run local unit tests, screenshot tests, other test suites, builds, archives, or the repository's full validation wrapper by default. Run them only when the developer explicitly requests them for the release or when a specific failure requires a narrow diagnostic reproduction. In Xcode manual mode, the developer owns the final signed build and upload; in Xcode Cloud mode, Xcode Cloud owns the normal hosted release gates after the candidate push.
3. Run only fast structural checks and the repository's release-metadata validator when present. Refuse to publish a candidate missing its shared schemes, app description, App Store release notes, beta tester notes, required localizations, or version parity.
4. Before any signed build, archive, export, upload, notarization, or other operation that can access a private key or trigger Keychain/SecurityAgent, obtain the developer's explicit approval immediately before execution. Release intent or an earlier request to publish is not sufficient private-key authorization. State which operation and identity will use the key and what prompt may appear; never launch it speculatively or in the background. If a prompt appears unexpectedly, stop the initiating process and wait for approval before retrying.
5. Do not archive or submit to App Store Connect unless explicitly requested or the developer asked to publish through a documented repository release workflow. Do not bypass signing or project settings merely to manufacture a passing result.
6. If a fast release-contract check fails, diagnose the failure, keep coherent release work safely on `release-candidate`, and do not tag or push release tags as though validation passed.
7. When publication uses Xcode Cloud mode:
   - Treat the repository's workflow specification and `ci_scripts` hooks as authoritative.
   - Verify the required schemes, actions, destinations, build-number ownership, and distribution gate before publication. For timestamp-based numbering, confirm every artifact contains a valid timestamp for its own compilation and never the committed fake sentinel; require identical artifact numbers only when the repository contract explicitly requires them.
   - Defer hosted execution until the candidate branch is pushed in the next section, and do not create release tags yet.

## 4. Commit, Publish the Candidate, Tag, and Integrate Locally

1. Review the release diff and verify it contains no unrelated changes. Ensure both the build-number update and `RELEASE_NOTES.md` are present.
2. Create the initial release commit on `release-candidate`, using `Prepare <version> release` unless repository instructions require another style. Hosted-only fixes may add candidate commits before the final tag; do not pretend an unvalidated commit is immutable.
3. Replace `origin/release-candidate` with the local branch using `--force-with-lease`. In Xcode manual mode, this push is the developer's Xcode handoff; do not push release tags yet. In Xcode Cloud mode, do not push release tags while hosted validation remains. When the repository configures Xcode Cloud to start on pushes to `release-candidate`, treat this push as the hosted-release trigger: complete every local gate first, never trigger the hosted workflow separately, and expect every follow-up push to start another build.
4. Do not call `gh pr create`, `gh pr edit`, `gh pr ready`, `gh pr merge`, or an equivalent API with `release-candidate` as the head branch. The absence of a pull request is an intentional branch-lifecycle requirement, not a blocker.
5. When publication uses Xcode Cloud mode:
   - Observe the run automatically triggered by the `release-candidate` push when that is the repository contract; never trigger it separately.
   - Record the run URL, committed build-number convention, final artifact build number or numbers, destinations, and distribution result.
   - Fix hosted-only failures on the same candidate branch, push follow-up commits normally, and rerun without publishing immutable version tags. Use `--force-with-lease` only after an intentional history rewrite or branch recreation.
   - Require the final hosted archive and intended distribution to succeed before continuing.
6. After the final required local or hosted gate passes, create an annotated tag named exactly `<version>` on the validated candidate head. Refuse to move an existing semantic-version tag.
7. Maintain exactly one movable `release_notes` tag by deleting its local reference when present and recreating it on the same validated commit.
8. Push the immutable semantic-version tag. Force-update only the intentionally movable remote `release_notes` tag; never force-update a semantic-version tag.
9. After the required gates and tags succeed, integrate the release without GitHub's merge operation when integration is requested:
   - Require clean persistent release and primary worktrees, then fetch `origin`.
   - Verify `origin/release-candidate` still points to the validated and tagged candidate.
   - Fast-forward the local default branch from `origin`, then merge `release-candidate` into it with local Git using a non-squash merge that preserves the tagged candidate commit.
   - Push the merged default branch normally. Do not use `gh pr merge`, the GitHub merge API, or the GitHub merge button. If branch protection rejects the push, report that exact blocker and do not silently fall back to a GitHub merge.
   - Verify `refs/heads/release-candidate` still exists remotely after the default-branch push and still points to the intended candidate. If hosting automation deleted it, immediately recreate it by pushing the local branch normally, then verify the remote ref again.
   - Leave `origin/release-candidate` present. Do not delete it locally or remotely.
10. Leave the persistent release worktree on `release-candidate` after completion so the next release reuses it. Keep the primary worktree on the merged default branch.

## Failure Handling

- Keep edits scoped to release work; do not fix unrelated issues.
- Never merge a GitHub pull request whose head is `release-candidate`.
- Never reuse an existing version tag for different content.
- If remote publication fails, preserve the coherent local commit and report the exact failed operation.
- Treat “no pull request” as the successful expected state for `release-candidate`.

## Final Output

Report:

- target platform and build result
- release-note comparison range and the main-branch note commit
- marketing version, committed build-number convention, and embedded artifact build number or numbers
- App Store and internal release-note destinations
- release commit hash
- semantic-version and `release_notes` tag actions
- pushed branch and tags
- confirmation that no pull request was created for `release-candidate`
- verified remote `release-candidate` commit after default-branch integration
- selected release mode; Xcode Cloud run URL and distribution result only when hosted publication was requested

End with `RELEASE NOTES CREATED AT <CURRENT DATE>`, including day, month, year, hour, and minute.
