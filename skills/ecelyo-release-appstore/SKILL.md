---
name: ecelyo-release-appstore
description: Plan Ecelyo App Store release work, including version-gated notes, platform screenshot refreshes, release-task chains, and owner-controlled submission and publication handoffs.
---

# Ecelyo App Store Release Workflow

Use this skill for Ecelyo macOS and iOS App Store release preparation. It complements `ecelyo-methodology`, `ecelyo-satellite`, and `task-executor`; those skills remain the source for general task tracking, API access, and execution lifecycle rules.

## Start with the release baseline

- Read the target task and tactic from Ecelyo. Check the project is not archived, the tactic is not accomplished, the task graph is coherent, and there are no duplicate release tasks.
- Read the app marketing version from `Configuration/Base.xcconfig`. Do not change the marketing version or build-number policy as part of release notes or screenshot work.
- Use the task's source branch and commit as the note-generation boundary. For public version notes, use the latest reachable version tag as the release baseline and follow the repository's 40-commit cap and three-day recency rule.
- If the requested release version does not match `MARKETING_VERSION`, record the exact tag, source commit, and configured version in the task, set it to `in_review`, and leave public release-note files and release screenshots untouched until the owner resolves the target. Do not solve a mismatch by changing the version.
- Keep already-published release notes as evidence. Do not roll current release metadata backward to recreate an older version's note set.

## Plan the task graph

Reuse matching tasks already in the tactic; do not duplicate completed release-note or platform work. Every new task needs an explicit `agentRole`, acceptance criteria, a branch slug, and correct task relationships.

Use this order for a release with separate macOS and iOS lanes:

1. Confirm the release version and source baseline.
2. Prepare shared public release notes, including separate macOS/iOS sections and all supported locales.
3. Create separate macOS and iOS screenshot tasks as parallel children of the notes task. The iOS task covers iPhone and iPad.
4. Make macOS submission depend on macOS screenshots and notes; make iOS submission depend on iOS screenshots and notes.
5. Give each platform its own release task after its submission/review task.
6. Add one final QA task that depends on both platform release tasks.

When a matching task already exists, update its description, role, review gate, and parent relationships rather than creating a duplicate. Use `needsHumanReview: true` for tasks that require an owner decision or owner-run App Store Connect action. Verify every accepted mutation and reread the complete parent/child graph; ensure it is acyclic and the two screenshot lanes are parallel.

## Refresh App Store screenshots

- Capture real app renders from the shipped example systems. Never fabricate or edit the UI captures.
- For iPhone App Store assets, use **iPhone 17 only**. Do not capture, keep, select, or upload iPhone 16 or iPhone 17 Pro Max variants.
- Use the approved iPad model recorded in the task; the current Ecelyo release workflow uses iPad Pro 13-inch (M5). macOS captures use the task's supported Mac target.
- Store assets under `release-metadata/screenshots/<Platform>/raw/` and `release-metadata/screenshots/<Platform>/marketing/`, retaining filenames such as `Ecelyo-iPhone17-1-projects.png`. Keep each platform's raw and marketing order aligned.
- Keep capture scripts, marketing composition, validator, upload manifest, search-results-canvas inputs, asset manifest, and screenshot README in sync when paths change. For iPhone captures, regenerate the search-results canvas after the raw source images change.
- Read `specifications/v1/app-store-screenshot-refresh-workflow.md` and `scripts/appstore/README.md`. Use the narrowest platform capture wrapper for the task; do not run the all-platform wrapper if it would create or use devices outside the approved task set.
- Inspect changed images at full size. Validate exact dimensions, opacity, nonblank content, duplicates, filenames, ordering, and the product-page canvas when iPhone source captures change.

## Keep submission and publication owner-controlled

Screenshot generation and local validation do not upload anything. App Store Connect, signing, review submission, approval, and publication remain owner-controlled. Register those as explicit per-platform tasks with the correct prerequisites and a human-review gate. Do not upload, submit, or publish unless the current task or conversation explicitly authorizes that action.

After any asset or note changes, use the Ecelyo repository's required validation and pull-request workflow. Preserve unrelated checkout changes, commit the in-scope files, and report the source/version range, screenshot devices, validation, PR state, and remaining owner actions in the task closeout.
