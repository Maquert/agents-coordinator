# Generate and integrate Ecelyo release notes

Use this command for recurring Ecelyo release-note refreshes. Finish before the scheduled nightly build whenever possible; start immediately and treat its start time as the hard deadline.

## Workflow

1. Read the repository `AGENTS.md`, `specifications/v1/release-notes-creation-contract.md`, and the user-facing vocabulary reference. Read the current marketing version from its `.xcconfig` source of truth.
2. Start from the latest source branch and use a dedicated linked worktree and `<agent>/<slug>` branch. Never edit the primary `main` worktree.
3. Follow the release-note contract exactly. For intermediate builds, select up to the 15 newest eligible user-facing commits within the rolling seven-day window, newest first. Write one synthesized entry per selected commit. Do not pad with older/internal commits or invent locale destinations; the current recurring contract specifies English TestFlight notes only. Refresh the source range against latest `main` before finalizing.
4. Make only the necessary note changes. Run the contract's fast release-note validations (metadata/version parity, string-catalog JSON, and `git diff --check`). Release-note-only changes do not require app unit/UI/screenshot tests or the full pre-merge app gate.
5. Commit the complete note change on the dedicated branch, push it, open a PR to `main`, and integrate it by merging the PR as soon as the required checks pass. Never push directly to `main`.
6. Verify that `main` contains the intended change and record the PR/merge result. Remove the task worktree and branch after successful integration, following repository policy.

## Completion rule

The task is complete only after the PR has merged and the resulting `main` contains the intended release-note update. A draft, local edit, commit, pushed branch, or open PR is not integration. Do not stop after committing or opening a PR. If a gate blocks completion, continue all independent work and promptly report the exact blocker, evidence, and remaining step. Never claim integration without verifying it.

For public version notes, follow the explicit public-release workflow and owner-review requirement; do not treat this recurring intermediate-build command as authorization to change public notes. Report any iCloud schema-deploy requirement to the owner; do not access Apple-hosted services or deploy schemas.
