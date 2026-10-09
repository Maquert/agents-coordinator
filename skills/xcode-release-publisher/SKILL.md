---
name: xcode-release-publisher
description: Prepare and publish Alpha internal builds or Beta/public releases for Xcode projects by honoring the repository-defined version/build system, selecting the approved branch and BUILD_TYPE lane, handing pushes to Xcode Cloud without invoking it, and integrating release-only changes back into main through a pull request. Use when Codex needs to prepare, validate, or publish a release or build for an Xcode app or Apple-platform project.
---

# Xcode Release Publisher

Prepare the complete release candidate, not only its notes. Load and follow `xcode-terminal-operator` and `xcode-output-parser` for Xcode discovery and builds, and `github-cli-operator` for GitHub authentication, branch pushes, and tags.

Before drafting or reviewing customer-facing release notes for Ecelyo, read the repository's
[user-facing vocabulary](https://github.com/Maquert/Ecelyo_app/blob/main/specifications/v1/app-user-facing-vocabulary.md).
Use its canonical names for app areas and views, including their platform-neutral forms. Treat
those names as the product vocabulary: never replace them with source-file, type, target, or other
implementation terminology in release notes, store metadata, beta notes, or in-app copy.

## Release Intent and Version Decision

Classify the developer's release intent before selecting a branch, checking tags, changing
metadata, or pushing anything. The approved project contract is maintained in
[`specifications/v1/release-process-contract.md`](https://github.com/Maquert/Ecelyo_app/blob/main/specifications/v1/release-process-contract.md).

| Intent | Source branch | Schedule or trigger | Required build type | Result |
| --- | --- | --- | --- |
| Internal testing / Alpha | `main` | Xcode Cloud's daily scheduled release, at an unspecified time between 02:00 and 06:00 Europe/Madrid; any tag pushed to `main` also triggers an internal-testing build | `BUILD_TYPE=ALPHA` | Internal testing build; Alpha enables functionality by default |
| External testers / public candidate / Beta | `release-candidate` | Every commit pushed to `release-candidate` triggers a new Xcode Cloud release build | `BUILD_TYPE=BETA` | External-tester/public candidate; Beta disables functionality by default |

The human-approved conflict resolution is **automatic Beta-on-push**, not on-demand
`release-candidate` releases. An on-demand request is therefore a request to prepare a deliberate
candidate commit and obtain human confirmation of its scope before pushing; it is never a reason to
invoke Xcode Cloud manually or to bypass the branch trigger.

Xcode Cloud owns version/build generation after it captures the push. The agent prepares the
repository, commits, tags where the lane requires them, and pushes the selected branch or tag; the
agent does not invoke Xcode Cloud, manufacture a hosted version/build, or access Apple-hosted
services. A push to `release-candidate` is itself a new Beta release trigger, and every follow-up
push creates another hosted release build.

For a versioned release, ask explicitly whether the developer wants to bump `MARKETING_VERSION`
before editing it. Do not infer a patch, minor, or major bump from the word “release” alone. If the
developer confirms a bump, record the chosen target version in the handoff table and continue with
the normal release-note and version-parity workflow. If the request is build-only, keep the current
marketing version and do not rewrite release notes unless explicitly requested.

Before any version metadata change, re-upload, or repeated build activity, check whether the exact
semantic-version tag already exists. If it exists, stop and ask the human to confirm the repeat;
never move or reuse an immutable version tag silently. Every change to `MARKETING_VERSION` must be
paired with the exact annotated semantic-version tag, and the tag must point to the commit that
introduced that version. For a dedicated, owner-authorized version-bump PR, create and push that
tag on the PR head immediately before merging, then use the repository's allowed merge method.
Prefer a non-squashing merge that preserves the tagged commit; if repository policy permits only
squash, the already-pushed tag remains the immutable tag for the exact version-bump commit and the
merged tree must be verified to contain the same version. Do not merge a version-bump PR while its
version tag is missing. A normal
release-candidate still follows the hosted/manual gate before tagging; this explicit version-bump
sequence is the only exception and does not grant Apple-hosted access.

The version decision and selected lane must be visible in the handoff table. A build-only request
must explicitly show `Marketing version: unchanged (<current version>)`.

## Approved Dual-Lane Operating Rules

- **Alpha:** work from `main`; use `BUILD_TYPE=ALPHA`. The scheduled Alpha release runs daily in
  the 02:00–06:00 Europe/Madrid window, but no exact start hour is promised. A tag pushed to
  `main` starts the Xcode Cloud internal-testing build and separates that build from the next
  version. Do not describe the scheduled window as a fixed-hour cron job.
- **Beta:** recreate `release-candidate` directly from the latest `origin/main` before adding
  release-only changes; use `BUILD_TYPE=BETA`. Every commit pushed to that branch starts a new
  Xcode Cloud public-release build. Do not add an on-demand trigger, invoke Xcode Cloud, or route
  public promotion through `main`.
- **Feature flags:** `BUILD_TYPE=ALPHA` enables functionality by default and `BUILD_TYPE=BETA`
  disables functionality by default. Each feature flag must record whether it follows that default
  or intentionally overrides it, including the override reason and owner/review decision. Agents
  must consult the project's feature-flag registry rather than infer an exception from source code.
- **Apple ownership:** Xcode Cloud, App Store Connect, TestFlight, Apple Developer, and CloudKit
  Console remain developer-owned. A hosted build is a handoff until an authorized status source or
  developer confirms its result.

### Lane examples

| Scenario | Required selection | Confirmation or stop condition |
| --- | --- | --- |
| Daily overnight internal build | `main` + `BUILD_TYPE=ALPHA` | Proceed with repository-side preparation; do not wait for an exact hour |
| New internal version tag | `main` + `BUILD_TYPE=ALPHA` | Confirm the semantic-version tag is absent before changing version metadata or pushing the tag |
| Existing internal version tag | `main` + `BUILD_TYPE=ALPHA` | Stop and ask the human before any re-upload or repeated version build |
| Internal manual request | `main` + `BUILD_TYPE=ALPHA` | Treat as an internal lane request; never route it to `release-candidate` or invoke Xcode Cloud |
| Release-candidate commit | `release-candidate` + `BUILD_TYPE=BETA` | Push only after local checks and deliberate scope review; the push automatically starts Xcode Cloud |
| On-demand Beta request | `release-candidate` + `BUILD_TYPE=BETA` | Explain that on-demand is not an approved trigger; obtain scope confirmation, then use a deliberate candidate commit |
| External tester build / public candidate | `release-candidate` + `BUILD_TYPE=BETA` | External distribution may proceed after hosted validation; App Store promotion remains owner-controlled |
| Failed candidate | Same exact candidate branch and `BUILD_TYPE=BETA` | Fix on the same branch, push the follow-up, and wait for that new hosted result; do not tag or promote the failed SHA |
| Public promotion | `release-candidate` + `BUILD_TYPE=BETA` | Require the validated exact candidate and developer-owned Apple action; `main` cannot bypass this gate |

## Tag branch guard

Tags are branch-lane operations even though Git stores a tag on a commit. Before creating or
publishing any release tag, inspect `git branch --show-current` and verify that the current branch
is one of the two approved release branches:

- **Alpha/internal tags:** create and push only from `main` with `BUILD_TYPE=ALPHA`.
- **Beta/public-candidate tags:** create and push only from `release-candidate` with
  `BUILD_TYPE=BETA`.

Never create or push release tags from a feature branch, any other branch, or a detached `HEAD`.
If the current branch does not match the selected lane, stop before running `git tag` or pushing a
tag. A tag command or tag push must not be treated as permission to bypass this branch guard.

## Release Modes

There are two supported release modes. Select one explicitly at the start of every release and state it in the handoff:

- **Xcode Cloud** — the current default. Follow the repository's Xcode Cloud workflow, hooks, hosted build-number ownership, and distribution gates. Validate the release build configuration before pushing `release-candidate`, then follow the non-blocking handoff protocol below. Hosted success remains mandatory before publishing a semantic-version tag or integrating the candidate. Do not use a local distribution-archive script in this mode; Xcode Cloud owns the hosted archive and distribution gate. If build configuration validation fails, create a task in Ecelyo under the "App Store" project and "Release" tactic, then stop.
- **Xcode manual** — opt out only when the developer explicitly requests it or the repository release request names it. The developer opens the pushed `release-candidate` branch in Xcode and owns the signed archive, App Store Connect upload, and final release action. Use the repository's local build phase or other documented local build-number generator, validate the embedded artifact locally when Xcode is available, and stop at the developer handoff. When the repository provides `scripts/xcode/archive_distribution_apps.sh`, treat it as the canonical manual archive workflow: after immediate approval for private-key use, execute it to archive every supported distribution scheme sequentially, including `Ecelyo` for generic macOS and `Ecelyo iOS` for generic iOS, with the repository's distribution signing inputs. Do not assume Xcode Cloud, trigger hosted workflows, create release tags, or merge the candidate unless the developer asks to continue after upload.

If the developer does not name a mode, use **Xcode Cloud**.

## Developer-Owned Apple Access Boundary

App Store Connect, TestFlight, Xcode Cloud's web console, Apple Developer, and CloudKit Console
access are reserved exclusively for the developer/account owner. This is an ownership boundary,
not merely a missing-credential workaround.

- The agent must not open these services to sign in, use a saved browser session, enter or request
  passwords or two-factor codes, use App Store Connect API keys, or operate Apple-hosted records.
- The agent must not create or modify Xcode Cloud workflows, app records, tester groups, build
  assignments, metadata, submissions, CloudKit schemas, or Production data through Apple services.
- The agent must not upload, submit, distribute, or verify a build in App Store Connect or
  TestFlight. The developer performs those actions and supplies any hosted result if needed.
- Repository-side preparation, local unsigned validation, GitHub operations, and observable CI
  status checks may proceed without Apple account access. A hosted URL is a handoff reference, not
  permission to open the service or proof that processing, distribution, or tester assignment
  succeeded.
- Never ask the developer to paste Apple passwords, one-time codes, private keys, or API secrets in
  chat. If an Apple-hosted gate is required, stop at the developer handoff and state exactly what
  remains for the account owner.

## Xcode Cloud Handoff

Apply this protocol whenever the selected Alpha or Beta lane is using Xcode Cloud:

- Xcode Cloud starts the build after its scheduled Alpha event, an Alpha tag push to `main`, or a
  Beta commit push to `release-candidate`. The agent does not invoke Xcode Cloud, click a workflow,
  generate a hosted version/build, or wait for a fixed scheduled minute. A push is the handoff.
- After an Alpha tag push or Beta `release-candidate` push, do not wait synchronously, repeatedly
  poll, or keep the task open solely for the hosted run. Make at most one immediate status lookup
  using a repository-authorized, non-Apple status surface (for example, GitHub checks/status when
  the repository exposes the run). Never open Xcode Cloud's web console. If no permitted source
  exposes a result and the developer has not supplied one, report the status as unavailable; do not
  infer success or failure.
- Record the exact pushed commit SHA, lane, `BUILD_TYPE`, run URL when available, last observed
  status, and UTC observation time. Report build numbers, archive results, destinations, or
  distribution only when that source explicitly confirms them.
- If the run is pending, in progress, or unavailable, finish this execution as a candidate handoff,
  not as a completed release. Do not publish a semantic-version, per-build, or iCloud impact tag,
  or integrate the candidate until the required gate is confirmed. State that those gates remain
  pending and can be resumed in a later request after a result is available.
- Before a later requested tag or integration action, make one fresh permitted status lookup (or
  use a newly supplied developer result) and verify that the successful hosted run corresponds to
  the exact current pushed SHA. Any follow-up commit creates a new Beta candidate and its own hosted
  run; an earlier commit's success is not sufficient. If status is still pending or unavailable,
  hand off without waiting. If a failure is available, fix it on the same candidate branch before
  handing off to the newly triggered run.

## Release Contract

- Default the target platform to macOS. Honor an explicitly requested Apple platform.
- Use semantic versioning. The normal release is a patch bump. Use a minor bump when any database/model field changes, or when the developer explicitly requests a feature/minor release. Never choose a major bump unless the developer explicitly requests it. Keep a `0.x` app on `0.x` unless a major release is explicitly requested. Refuse to reuse or move an existing immutable version tag.
- Before selecting the app release version, load `icloud-persistence` when available and run its iCloud impact preflight. Compare the candidate with the latest immutable `icloud/vMAJOR.MINOR.PATCH` tag, or report `no iCloud baseline tag` when none exists. Include the affected commits, exact build, candidate commit, impact level, and whether CloudKit Console deployment is required. A build number never replaces a commit or schema baseline.
- Before any release work, require `release-candidate` to be recreated directly from the latest `origin/main`; it must be up-to-date with `origin/main`, never based on a rebase of an older candidate. Verify the two refs match before adding release changes.
- Follow the repository's build-number convention. In the absence of one, increment the highest numeric build number among the released app targets by one. When the repository commits a fake sentinel and generates timestamp-based build numbers during compilation, preserve the sentinel, never commit a generated build number, and validate the embedded artifact value instead. If a Unix epoch-minute value exceeds Apple's `CFBundleVersion` component limits, preserve the exact minute in an ordered 4.2.2-digit encoding such as `NNNN.NN.NN` rather than embedding an invalid oversized integer.
- Create or replace `RELEASE_NOTES.md` at the project root with App Store-facing notes. Read the
  Ecelyo user-facing vocabulary first and use its canonical area and view names. Keep the notes
  witty, amusing, informal, and nearly funny. Describe features users can experience when they
  start using the app and relevant fixes users would notice. Do not mention renames, legacy
  product identities, agent process, repository mechanics, or technical cleanup unless the
  developer explicitly asks for them. Do not claim changes unsupported by the release range.
- Require version-controlled store metadata on the selected release lane: the evergreen app description, version-specific App Store release notes, and beta tester “What to Test” notes for every repository-supported locale. Prefer `release-metadata/<locale>/app-description.md`, `release-notes.md`, and `beta-build-notes.md` unless the repository defines another location. These files are a reviewable handoff and do not authorize App Store Connect access or upload.
- Keep internal release notes separate. They may share content with `RELEASE_NOTES.md`, but one does not replace the other.
- For apps that display in-app release notes on startup (e.g., Ecelyo): update both the `ReleaseNotesPayload.current` struct and the localized strings each release so users see fresh notes. The app automatically triggers display when `generatedAt` is newer than the last-seen timestamp stored in user defaults; updating the timestamp is the mechanism for re-triggering display on each new version.
- Keep Beta source-controlled release changes, including `RELEASE_NOTES.md` and any required build-number update, on `release-candidate`; keep Alpha changes and internal release metadata on `main` when the Alpha contract requires them there.
- Use one persistent linked worktree for all releases, located beside the primary repository as `<repository-directory>-release`. Reuse it for every release; never create version-specific release worktrees. For Ecelyo, the required path is `~/Developer/Projects/ecelyo_app-release`.
- Create a GitHub pull request from `release-candidate` back to `main` for release-only changes
  (release notes, version metadata, startup-panel notes, build fixes, hotfixes, and required
  screenshot references). Do not include unrelated product work. Merge it only after the exact
  candidate has passed the required hosted/manual gate, and recreate the persistent remote branch
  if hosting automation deletes it after the merge.
- Whenever release notes are created or refreshed, including for a build-only request that
  explicitly asks for new notes, the release-notes PR is mandatory and must be merged back into
  `main` after the exact candidate passes the required hosted/manual gate. Do not leave a notes PR
  open merely because the marketing version did not change. A build-only request with no notes
  changes still needs no PR when `release-candidate` has no release-only diff.
- Create the release commit on `release-candidate`. Do not publish the immutable semantic-version tag until every required local and hosted release gate passes.
- A dedicated, owner-authorized version-bump PR is an exception to the preceding candidate rule:
  verify its exact semantic tag is absent, tag the exact PR head before merging, push the tag, and
  merge using the repository's allowed method. The matching tag is mandatory even when no hosted
  build is being prepared in the same change; after a squash merge, verify `main` carries the same
  version and content even though the tag points to the original PR commit.
- Push the candidate branch directly, then use the pull request for review and integration. Push
  only validated immutable semantic-version tags and per-build timestamp tags, and only while the
  current branch satisfies the Tag branch guard above.
- After the required release gates pass, merge the release-only pull request into `main`. Verify
  that the merged `main` contains only the intended release changes and that
  `origin/release-candidate` remains present and points to the validated candidate.
- Honor the Developer-Owned Apple Access Boundary above for every release, regardless of release
  mode or whether the developer explicitly asks for a hosted verification step.
- Keep release preparation proportional to the selected mode. Do not run local unit tests, screenshot tests, or other test suites unless the developer explicitly requests them for that release. In Xcode manual mode, run the narrowest requested local build/archive validation when Xcode is available; do not upload or access App Store Connect. In Xcode Cloud mode, run only fast repository and metadata contract checks before pushing and let Xcode Cloud perform the normal release validation.
- In Xcode manual mode, the final manual step before handoff is archiving every supported distribution platform. In the Ecelyo project, run `scripts/xcode/archive_distribution_apps.sh`; do not substitute ad hoc archive commands. Obtain immediate private-key approval before running it.

## 0. Prepare Release Notes for the Selected Lane

Skip this phase for a build-only request. Build-only work starts from the current marketing
version and does not modify release-note content or release-note version metadata.

For Beta, perform this phase in the persistent `release-candidate` worktree after recreating that
branch from the latest `origin/main`. For Alpha, perform only the explicitly requested internal
release-note work on `main` and do not create a Beta candidate. The primary `main` checkout is
read-only when a task is preparing a Beta candidate; release-only changes return to `main` through
the pull request in Phase 4.

1. Require a clean, up-to-date `release-candidate` worktree and fetch tags. Save the current
   `release_notes` tag (or the documented first-release fallback) as the comparison start before
   changing release metadata.
2. Read only the commits in that range that describe user-visible work. Filter out technical-only changes, group the remaining changes, and rewrite them as clear customer-facing release notes.
3. Remove stale release-note entries from the repository's existing release-note destination and `Localizable.xcstrings` or equivalent catalog when present. Create the new internal release-note list in the repository-defined destination. If the destination cannot be inferred safely, stop before editing.
4. Select the semantic version for this release using the release contract and carry it into the candidate phase. Bump the Xcode marketing version to this selected version in the *same commit* as the release notes, together with any version references in locale-specific release-metadata files and any internal release-notes spec used to validate version parity — never leave `RELEASE_NOTES.md` and the marketing version disagreeing on the default branch, even briefly, since a repository's CI may gate all test phases on that parity. Do not update the build number or perform any App Store Connect-only metadata change on main; those remain Phase 2 work on `release-candidate`.
5. Commit the release-note changes together with the marketing-version bump and any synced metadata as one commit on `release-candidate`, using `Prepare <version> release notes` unless repository instructions require another style. Do not push `main` or create release tags before the required hosted/manual build gate. Run the repository's fast release-metadata validator (when present) before committing to confirm nothing was missed.
6. Treat this candidate commit as the release-note baseline for the current release. Preserve it on `release-candidate`, create the release-only pull request after the candidate push, and integrate it back into `main` only after the final release gates pass. Do not regenerate the same notes from the candidate range.

## 1. Establish a Safe Release Range

For a build-only request, use the current marketing version as the release range label and do
not derive or rewrite customer-facing release notes. Still inspect the candidate diff for the
build handoff and collect the commits needed for the per-build timestamp tag.

1. Read the repository instructions and any supplied automation memory before editing.
2. Require a clean understanding of existing changes. Preserve unrelated user work and stop if it cannot be separated safely.
3. Verify GitHub CLI authentication, the `origin` repository, the default branch, and the Xcode workspace or project and shared scheme.
4. Fetch `origin` and tags.
5. Inspect the remote history for `release-candidate`. If a pull request currently uses it as the head branch, do not merge that pull request; close it before continuing so repository automation cannot delete the persistent branch.
6. Create the persistent sibling release worktree only when it does not already exist, then reuse it for every release. In that worktree, recreate local `release-candidate` from the updated `origin` default branch. If `release-candidate` is checked out in an obsolete release worktree, require it to be clean, remove that worktree, and attach the branch at the persistent path without losing its commit. Reusing this one worktree and branch is intentional; replace the remote branch later with `--force-with-lease`, never an unchecked force push.
7. Use the release-note comparison range and version captured in Phase 0. The moved `release_notes` tag now marks the committed note baseline; do not treat it as an empty release and do not discard the pre-generated notes.
8. Read only candidate-specific commits and changed files needed to identify additions after the Phase 0 note commit. Exclude technical-only maintenance from any note additions unless the developer requests it.

## 2. Select Versions and Write Notes

For a build-only request:

1. Keep `MARKETING_VERSION` and all release-note version references unchanged.
2. Do not update `RELEASE_NOTES.md`, localized release notes, beta notes, startup release-note
   payloads, or their localization entries unless the developer separately requests that work.
3. Apply only the repository-defined build-number workflow and prepare the per-build timestamp
   tag after the applicable hosted/manual build gate succeeds.

For a versioned release, follow the explicit version decision captured above before performing
the version-selection steps below.

1. Preserve the Phase 0 release-note list and selected version. If candidate-specific commits add user-visible work, append only those changes in customer language.
2. Confirm the Xcode marketing version already bumped in Phase 0 still matches the selected version. Recalculate and re-bump only when candidate-specific changes materially change the release scope; cross-check semantic-version tags and stop on unexplained version drift. If the version does change here, update `RELEASE_NOTES.md` and the Phase 0 metadata to match before continuing, so the eventual merge back to the default branch keeps everything in sync.
3. Inspect the effective Xcode build-number convention (`CURRENT_PROJECT_VERSION` or its repository-defined equivalent) for every released app target.
   - For a conventional committed number, require numeric values, choose the highest value plus one, and update all relevant configurations consistently. Prefer Apple Generic Versioning; otherwise update the authoritative build setting rather than a generated plist.
   - For a repository-defined fake sentinel plus build-time timestamp, require the sentinel to remain unchanged, verify every released app target uses the version-controlled generator, and do not write the generated value into source files.
   - Inspect documented build hooks and release specifications for the selected mode. In Xcode manual mode, preserve and validate the local date/timestamp generator. In Xcode Cloud mode, do not replace, disable, or duplicate Xcode Cloud's build-number ownership.
4. The marketing version was already applied in Phase 0 (step 2 above); only touch the authoritative Xcode setting again here if this phase's recalculation changed the selected version.
5. `RELEASE_NOTES.md` was already created in Phase 0; only append candidate-specific user-visible changes here, following the same App Store-notes tone, rather than recreating it from scratch.
6. Create or update the localized app description, App Store release notes, and beta tester build notes in the repository metadata directory. These carry the version bumped in Phase 0 forward; keep beta notes practical and test-oriented, and include the platform, version, build-number check, and the most important changed flows.
7. Update the in-app release notes display:
   - **For Ecelyo:** Update `Shared/Domain/Models/ReleaseNotesPayload.swift`:
     - Bump `version` to match the selected release version
     - Update `generatedAt` to the current date/time (use today's date at a reasonable time like 10:00 AM)
     - Update the `id` field to match today's date (format: YYYY-MM-DD)
     - Ensure the `itemKeys` array references keys that exist in `Localizable.xcstrings`
   - In `Ecelyo/Localizable.xcstrings`, update the localized strings for:
     - `release_notes.title` (e.g., "What's New")
     - `release_notes.item.*` entries (one for each bullet point in `RELEASE_NOTES.md`)
   - Ensure the number and content of items match the `RELEASE_NOTES.md` notes from Phase 0
   - This allows the app to display release notes to users on first launch after upgrading, with fresh content for each version
8. Confirm that the marketing version, effective build-number plan, internal notes, App Store notes, app description, and beta tester notes describe the same release.

## 2.5 Validate Build Configuration (Xcode Cloud Mode Only)

Before the selected lane's trigger—an Alpha tag push to `main` or a Beta push to
`release-candidate`—perform fast structural checks on the release build configuration:

1. Verify the Xcode project and workspace are discoverable and buildable.
2. Verify all required distribution schemes exist and are accessible.
3. Verify the build-number convention is correctly configured:
   - For Xcode Cloud: confirm `CURRENT_PROJECT_VERSION` uses the 9999 sentinel or a valid numeric value, and that `ci_scripts/ci_pre_xcodebuild.sh` is present and correctly injects the cloud build number.
   - Confirm every released app target has matching version settings.
4. Verify `MARKETING_VERSION` matches the selected release version.
5. Verify all entitlements, provisioning profiles, signing identities, and deployment targets are valid.
6. If any validation fails:
   - Preserve all coherent release work on the selected lane without pushing its trigger.
   - Create an Ecelyo task in the "App Store" project under the "Release" tactic describing the specific validation failure (e.g., "invalid build configuration", "missing provisioning profile", "scheme not discoverable").
   - Stop and report the validation blocker to the developer.
7. If all validation passes, push only the selected lane trigger and follow the Xcode Cloud Handoff protocol. Do not describe the hosted build as successful unless a permitted status source confirms it for this exact pushed SHA.

## 2.6 iCloud Impact Gate

When `icloud-persistence` is available, use its [iCloud impact and versioning protocol](../icloud-persistence/references/icloud-versioning.md) during every release. Before publishing the candidate:

1. Identify the latest immutable `icloud/vMAJOR.MINOR.PATCH` tag and compare it with the candidate's commits and changed content. If no marker exists, report `no iCloud baseline tag`.
2. Report the exact affected commits, candidate commit, build number, impact level, and whether the change affects the CloudKit schema or only synchronization/configuration.
3. If persisted properties, entities, relationships, indexes, field types, or schema definitions changed, require the reviewed CloudKit Console Development-to-Production deployment and a signed-device import/export smoke test before the release can be tagged or published.
4. If only sync code, entitlements, container selection, lifecycle, logging, or other configuration changed, require the focused sync validation and still include the iCloud warning in the release handoff.
5. After the final release gates and any required Production verification pass, create and push the next immutable annotated `icloud/v...` tag on the exact validated release commit. Never move or reuse that tag. Do not create a marker that claims Production verification when Console access or the deployment result is unknown.

The release report must include the complete iCloud warning block from the protocol. A successful
local or hosted build does not replace CloudKit Production schema verification.

## 3. Build and Validate the Release Candidate (Xcode Manual Mode Only)

For Xcode Cloud mode, build configuration validation has already passed in section 2.5; push the candidate and follow the Xcode Cloud Handoff protocol. Candidate preparation may finish while the release remains unfinalized; any later tag or integration action requires a fresh successful run for the exact candidate SHA.

For Xcode manual mode only:

1. Use the repository's documented fast release-contract entry points when available; otherwise discover the workspace or project and shared app scheme narrowly.
2. Do not run local unit tests, screenshot tests, other test suites, builds, archives, or the repository's full validation wrapper by default. Run them only when the developer explicitly requests them for the release or when a specific failure requires a narrow diagnostic reproduction. When a signed archive is requested and approved, run the repository's canonical local archive script if present (for Ecelyo, `scripts/xcode/archive_distribution_apps.sh`) and validate every generated archive; the developer owns the final signed build, upload, and release action.
3. Run only fast structural checks and the repository's release-metadata validator when present. Refuse to publish a candidate missing its shared schemes, app description, App Store release notes, beta tester notes, required localizations, or version parity.
4. Before any signed build, archive, export, upload, notarization, or other operation that can access a private key or trigger Keychain/SecurityAgent, obtain the developer's explicit approval immediately before execution. Release intent or an earlier request to publish is not sufficient private-key authorization. State which operation and identity will use the key and what prompt may appear; never launch it speculatively or in the background. If a prompt appears unexpectedly, stop the initiating process and wait for approval before retrying.
5. Do not archive or submit to App Store Connect unless explicitly requested or the developer asked to publish through a documented repository release workflow. An explicitly requested archive must use the repository's documented local archive workflow and all supported distribution schemes; do not substitute an Xcode Cloud workflow. Do not bypass signing or project settings merely to manufacture a passing result.
6. If a fast release-contract check fails, diagnose the failure, keep coherent release work safely on `release-candidate`, and do not tag or push release tags as though validation passed.

## 4. Commit, Publish the Candidate, Tag, and Integrate Locally

### Alpha publication

Use this path for internal testing. Alpha source and internal release metadata remain on `main`;
do not create a `release-candidate` branch or Beta PR for an Alpha build.

1. Review the intended `main` diff and confirm the selected `BUILD_TYPE=ALPHA` policy and feature-flag
   decisions. Keep unrelated work out of the release commit.
2. Check the exact semantic-version tag before changing version metadata. If it already exists, stop
   and ask the human whether a repeated internal build is authorized; never move the immutable tag.
3. After the local structural gate passes, push the approved annotated version tag (or the approved
   per-build tag) to `main`. That tag push is the Xcode Cloud internal-testing trigger and delimits
   the build from the next version. The agent does not invoke Xcode Cloud or generate the build.
4. Make at most one permitted status lookup, record the pushed SHA, `BUILD_TYPE=ALPHA`, UTC
   observation time, and any available status, then hand off if the result is pending or unavailable.

### Beta publication

1. Review the release diff and verify it contains no unrelated changes. Ensure both the version update and `RELEASE_NOTES.md` are present.
2. Create the initial release commit on `release-candidate`, using `Prepare <version> release` unless repository instructions require another style. Hosted-only fixes may add candidate commits before the final tag; do not pretend an unvalidated commit is immutable.
3. Replace `origin/release-candidate` with the local branch using `--force-with-lease`. In Xcode Cloud mode (default), this push triggers hosted validation; do not push release tags yet. Build configuration validation (section 2.5) must have passed before this push. When the repository configures Xcode Cloud to start on pushes to `release-candidate`, treat this push as the hosted-release trigger: complete every local gate first, never trigger the hosted workflow separately, and expect every follow-up push to start another build. In Xcode manual mode, this push is the developer's Xcode handoff; do not push release tags yet.
4. Create or update the release-only pull request from `release-candidate` to `main`. Keep the
   PR limited to release notes, version/build metadata, hotfixes, and required screenshot
   references. Do not merge it until the exact candidate SHA passes the required hosted/manual
   gate. If release notes were created or refreshed, always create/update this PR even when the
   marketing version is unchanged, and merge it after the gate succeeds.
5. For Xcode Cloud mode (default):
   - The `release-candidate` push triggers the run when that is the repository contract; never trigger it separately.
   - Follow the Xcode Cloud Handoff protocol for the permitted status lookup, handoff report, exact-SHA success gate, and non-blocking behavior.
   - If a hosted failure is reported or observed, fix it on the same candidate branch and push follow-up commits normally; the new head requires its own successful run before tagging or integration. Use `--force-with-lease` only after an intentional history rewrite or branch recreation.
6. For a normal release candidate, after the final required local or hosted gate passes, verify
   that the current branch is `release-candidate` under the Tag branch guard, then create an
   annotated tag named exactly `<version>` on the validated candidate head. For a dedicated,
   owner-authorized version-bump PR, verify the PR is version-only, create the annotated tag named
   exactly `<version>` on the exact PR head immediately before merge, and use the repository's
   allowed merge method. Refuse to move an existing semantic-version tag.
7. Create an annotated per-build tag named `<marketing-version>-<UTC timestamp>` on every validated build, including build-only requests. Refuse to reuse an existing immutable tag.
8. Maintain exactly one movable `release_notes` tag for versioned releases by deleting its local reference when present and recreating it on the same validated commit.
9. Push the immutable semantic-version tag (versioned releases only), the immutable per-build tag, and the intentionally movable `release_notes` tag when applicable. Never force-update an immutable tag.
10. After the required gates and tags succeed, merge the release-only pull request into `main`.
   This merge is mandatory whenever the candidate contains refreshed release notes, regardless of
   whether the marketing version changed:
   - Require clean persistent release and primary worktrees, then fetch `origin`.
   - Verify `origin/release-candidate` still points to the validated and tagged candidate.
   - Merge the PR with the repository-approved GitHub PR workflow; do not push directly to `main`.
   - Verify the merged `main` contains only the intended release-only changes.
   - Verify `refs/heads/release-candidate` still exists remotely after the merge and still points to the intended candidate. If hosting automation deleted it, immediately recreate it by pushing the local branch normally, then verify the remote ref again.
   - Leave `origin/release-candidate` present. Do not delete it locally or remotely.
11. Leave the persistent release worktree on `release-candidate` after completion so the next release reuses it. Keep the primary worktree on the merged default branch.

## Failure Handling

- Keep edits scoped to release work; do not fix unrelated issues.
- Never merge a pull request containing unrelated product work; the release PR must contain only
  release notes, version/build metadata, hotfixes, and required release references.
- Never reuse an existing version tag for different content.
- If remote publication fails, preserve the coherent local commit and report the exact failed operation.
- Treat the release-only pull request and its eventual merge into `main` as required completion
  gates; do not claim completion while it remains open.

## Final Output

Report:

- target platform
- release-note comparison range and the `origin/main` baseline commit
- marketing version, committed build-number convention, and confirmed Xcode build configuration
- App Store and internal release-note destinations
- release commit hash
- semantic-version, iCloud impact, and `release_notes` tag actions; explicitly mark candidate-specific tags as deferred when the hosted gate is pending
- pushed branch and tags
- release-only pull request URL and merge state
- selected release mode:
  - **Xcode Cloud (default):** report that build configuration validation passed, the candidate SHA, that `release-candidate` was pushed, the run URL when available, and the last observed status with its UTC observation time. If pending, in progress, or unavailable, say this was only a candidate handoff, the release is not finalized, and candidate-specific tags/integration are deferred; state the next action. Do not wait or imply success. Report artifact build numbers, destinations, and distribution only when actually observed.
  - **Xcode manual (opt-out only):** report that release-candidate was pushed for developer handoff to Xcode for signed archive and TestFlight submission
- verified remote `release-candidate` commit after integration (if auto-merge was requested)

End with `RELEASE NOTES CREATED AT <CURRENT DATE>`, including day, month, year, hour, and minute.
