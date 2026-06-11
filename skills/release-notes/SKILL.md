---
name: release-notes
description: Generate and publish customer-facing release notes for a software repository, including the associated versioning, tagging, commit, push, and pull request bookkeeping. Use when Codex needs to derive release notes from recent product changes, update release-note destinations or localization catalogs, bump versions, or move release marker tags.
---

# Release Notes

Use this skill when the caller wants release notes plus associated versioning, tagging, or PR work. Keep each automation prompt short: specify the release comparison rule, the destinations, the versioning policy, and the exact output shape required by the automation.

Default remote behavior is to push branches and tags and create or update a pull request when release work creates remote-facing changes. Automations should mention remote-action details only when they need to opt out, change the PR target or metadata, or add extra remote steps.

## Operating Rules

1. Read only the commits and files needed for the release. Avoid broad repo scans.
2. Read the automation memory file first when one is provided and reuse it to avoid duplicate work.
3. Keep edits scoped to release work. Do not fix unrelated repository issues.
4. Respect repository instructions from `AGENTS.md`.
5. Do not leave release changes stranded on `main`: if the run stops or becomes blocked after making relevant file changes, keep the work on a safe non-main branch (create one prefixed `wip/` if needed) and commit locally when the state is coherent enough to preserve.
6. Always report the PR location in the final output: include the PR URL when one exists, otherwise state explicitly why no PR exists.

## Required Inputs

- A release comparison rule such as a tag or previous version marker
- A destination for release notes
- Any version-file, string-catalog, or release-metadata locations that need updates

If those destinations are not supplied and cannot be inferred safely, stop and explain the missing configuration. If the repository stores release notes in markdown, JSON, or store metadata files instead of localization catalogs, point the automation to those destinations explicitly and omit string-catalog cleanup.

## Execution Pattern

1. Determine the comparison range from the caller's release marker, tag, or previous release rule.
2. Read only the commits and files needed to understand user-visible changes.
3. Filter out technical-only or internal maintenance changes unless the caller wants them included.
4. Group the remaining changes into customer-facing bullets or sections.
5. Rewrite them in clear product language.
6. Update the release notes destination and remove stale release-note strings when the repository stores them in localization catalogs or similar files.
7. Apply the caller's versioning policy exactly.
8. Create the release commit locally when requested.
9. When release work merges through a PR into `main`, move or recreate the release marker tag on the merged `main` commit, not on a branch-only pre-merge commit. If a temporary branch-local tag is needed during preparation, recreate it on `main` after merge so the final marker is contained in `main` history.
10. Push branches, tags, and create or update a PR by default when release work creates remote-facing changes, unless the automation explicitly disables remote actions.
11. If the caller requires ending on `main`, return there only after the work is safely committed elsewhere or fully finished.

## Default Output

- Version change
- Release range used
- Customer-facing note summary
- Files updated
- Commit hash if any
- Tag actions
- Push status
- PR URL if any, or an explicit no-PR reason when release work used a branch but no PR exists

## Automation Prompt Contract

Keep automation prompts short and supply only:

- Repository path or current working directory
- Any memory file path
- The release comparison rule and release-note destinations
- Versioning and tagging rules
- Any remote-action override such as `no_pr`, custom PR base, or custom PR metadata
- Required final output or finish message

Do not restate the full workflow in each automation unless the repository has a real exception to this skill.
