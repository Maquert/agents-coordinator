Use the `repository-cleaner` skill.

## Rules
- Opened PRs branches must be protected. They should never be deleted.
- Finished tasks branches must be removed if no other task is using the same branch.
- Stale branches must be deleted: branches opened more than 5 days ago with not recent updates (by recent we mean 2 days).

## Related skills
Use git-repo-compactor to delete stale information from the repository, such as big orphaned blobs.

## Steps
- Read the accompanying `memory.md` file first, if present, and avoid repeating already-completed deletions.
- Refresh refs with `git fetch --prune origin`.
- Protect `main`, `release/*`, and `hotfix/*` branches.
- Parse `tasks/wip/*.md` and protect any declared task branch from local or remote deletion.
- If a branch is not reachable from `main`/`origin/main`, resolve the ambiguity before deleting it by checking GitHub and `~/.agents/tasks`.
- Use `gh pr list --state merged --head <branch>` or equivalent GitHub merge verification to confirm a merged PR when Git reachability does not prove safety.
- If there is no open PR for the branch and GitHub does not prove it merged, consult `~/.agents/tasks` to determine whether the branch is currently assigned to an in-progress task. Treat any branch referenced by a `wip` task as protected.
- Only delete a branch when both GitHub and `~/.agents/tasks` support that it is stale or already merged.
- Do not delete any branches on the `origin` remote. Local branch deletion only.
- Remove or prune worktrees tied to deleted local branches.
- If a `Localizable.xcstrings` file exists, remove stale localization markers by deleting all `"extractionState" : "stale"` entries.
- If the repository contains Xcode projects (`.xcodeproj`/`.xcworkspace`), remove any `DerivedData` folders found within the repo (e.g. `**/DerivedData`, `.tmp-swift/**/DerivedData`).
- Validate with `./scripts/run_unit_tests_ci.sh` when available; otherwise use the primary existing test command for the stack.

Output format:
- Deleted local branches: <list or none>
- Deleted worktrees: <list or none>
- Localization cleanup: <changed/no-op/not-applicable>
- DerivedData cleanup: <removed paths/no-op/not-applicable>
- Validation: <pass/fail/not-run + key failing test if any>
- Proposed commit message if repo changes exist.
