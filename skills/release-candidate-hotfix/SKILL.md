---
name: release-candidate-hotfix
description: Diagnose and repair a failed release-candidate build, verify locally, integrate the fix through a PR, and create an immutable timestamped build milestone.
---

# Release Candidate Hotfix Workflow

Use this skill when the current `release-candidate` Xcode Cloud build fails and an urgent fix is
required. Never push an unverified fix to `release-candidate`, and never push directly to `main`.

1. Inspect the hosted failure and reproduce the root cause in a dedicated linked worktree on a
   non-`main` branch. Preserve unrelated work and change only the required files.
2. Verify the fix locally with the repository's Xcode wrapper and `xcsift` output parsing. At
   minimum, run the Release build for the affected scheme; test additional architectures or
   configurations when the failure could be architecture/configuration-specific. Do not proceed
   while any compiler error remains.
3. Commit the focused hotfix and open a pull request into `main`. The PR must contain only the
   hotfix and its required tests/metadata. Do not commit or push the fix directly to `main`.
4. After the PR is merged, fetch `origin/main` and recreate the persistent
   `~/Developer/Projects/ecelyo_app-release` worktree's `release-candidate` from that commit.
5. Push `release-candidate` to trigger Xcode Cloud again. Use `--force-with-lease` only for the
   intentional branch recreation, never an unchecked force push.
6. After the account owner confirms the hosted build succeeds, create and push an annotated,
   immutable milestone tag named `<marketing-version>-<UTC-timestamp>`, such as
   `1.4.2-20260911-143000`. Never reuse an existing tag.
7. If the fix introduced release metadata or other new release-related changes not already
   merged, integrate them through a separate PR into `main` before the next candidate reset.

## Required guarantees

- Understand the root cause; do not mask symptoms or alter baselines to hide a failure.
- Find and fix all relevant errors before pushing the candidate.
- Keep the remote `release-candidate` branch available for Xcode Cloud.
- Report the hotfix PR, validated commit, local build result, hosted result, and timestamp tag.
