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
- If the requested release version does not match `MARKETING_VERSION`, pause active-release metadata and ask the owner to resolve the target. Historical preparation may proceed only when the owner explicitly names or approves an immutable release tag; keep all notes, screenshots, manifests, and product-page canvases under `release-metadata/versions/<version>/` so active-version files remain unchanged. Do not solve a mismatch by changing the version.
- Every release version must have a self-contained package under `release-metadata/versions/<version>/`, following the 1.5.3 layout: `README.md`, `RELEASE_NOTES.md`, `TestFlight/WhatToTest.en-US.txt`, localized release notes, `screenshots/<Platform>/{raw,marketing}/`, a version-scoped screenshot upload manifest, and the iPhone search-results canvas. Keep the root `release-metadata/` files as the active handoff while preparing the release, and keep the root and version package synchronized. Never overwrite an existing version package for a different release.
- Keep already-published release notes as evidence. Do not roll current release metadata backward to recreate an older version's note set.

## Shared repository guidance

Read the shared [`~/.agents/AGENTS.md`](../../AGENTS.md) for execution, privacy, worktree, validation, screenshot, and pull-request requirements. Repository `AGENTS.md` files add project-specific constraints; follow both.

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
- Store assets as `screenshots/<Platform>/{raw,marketing}/`, retaining filenames such as `screenshots/iPhone/raw/Ecelyo-iPhone17-1-projects.png`. Use `macOS`, `iPhone`, or `iPad` as the platform folder. Keep each platform's raw and marketing names and order aligned.
- For an active release, the screenshot root is `release-metadata/screenshots/`. For an explicitly approved historical release, use `release-metadata/versions/<version>/screenshots/`; keep the version-scoped upload manifest there and never replace the active root manifest or images. A historical capture should build from the named tag while derived data and temporary artifacts stay in the task worktree. Set explicit source, artifact, and output roots on capture wrappers when supported.
- Keep capture scripts, marketing composition, validator, upload manifest, search-results-canvas inputs, asset manifest, and screenshot README in sync when paths change. The normal uploader reads only the active root manifest; a version-scoped manifest is an archival upload handoff. Add only marketing images to an upload manifest. For iPhone captures, regenerate the search-results canvas from that version's `iPhone/raw/` inputs and save it inside the same version package.
- Read `specifications/v1/app-store-screenshot-refresh-workflow.md` and `scripts/appstore/README.md`. Use the narrowest platform capture wrapper for the task; do not run the all-platform wrapper if it would create or use devices outside the approved task set.
- Inspect changed images at full size. Validate exact dimensions, opacity, nonblank content, duplicates, filenames, ordering, and the product-page canvas when iPhone source captures change.

- After the active release assets are final, copy the complete approved notes, tester copy, screenshot tree, version-scoped manifest, and search-results canvas into `release-metadata/versions/<version>/`. The version package is the durable record for that release; the active root remains the uploader handoff until the owner completes submission.

## Preserve the release-candidate branch

- `release-candidate` is a persistent branch and must always remain available on the remote. Never use `release-candidate` as the head branch of the PR that integrates a release into `main`, because GitHub may delete the PR head after merge.
- Before opening or merging the release integration PR, create a versioned integration branch from the exact candidate SHA, such as `release/1.5.4` or `release-candidate-1.5.4`, push it, and use that branch as the PR head.
- Merge the versioned integration branch through the PR. Do not delete `release-candidate`, and do not enable or accept automatic deletion for it. After merging, verify that the remote `release-candidate` branch still exists and points to the candidate SHA; recreate it from that SHA if necessary.
- Keep the versioned integration branch and its PR evidence so the release candidate, metadata package, and merge source remain auditable.

## Keep submission and publication owner-controlled

Screenshot generation and local validation do not upload anything. App Store Connect, signing, review submission, approval, and publication remain owner-controlled. Register those as explicit per-platform tasks with the correct prerequisites and a human-review gate. Do not upload, submit, or publish unless the current task or conversation explicitly authorizes that action.

After any asset or note changes, use the Ecelyo repository's required validation and pull-request workflow. Preserve unrelated checkout changes, commit the in-scope files, and report the source/version range, screenshot devices, validation, PR state, and remaining owner actions in the task closeout.
