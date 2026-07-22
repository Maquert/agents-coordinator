Use the `repository-cleaner` skill.

## Rules
- Opened PRs branches must be protected. They should never be deleted.
- The primary worktree and its main integration branch must be protected.
- Worktrees and branches referenced by active Ecelyo tasks or active agent sessions must be protected.
- Finished tasks branches must be removed if no other task is using the same branch.
- Stale branches must be deleted: branches opened more than 5 days ago with not recent updates (by recent we mean 2 days).
- Never describe a branch as unmerged solely because `git merge-base --is-ancestor`, `git branch --merged`, or commit counts do not find it in `main`. Squash merges, rebases, and cherry-picks legitimately change commit ancestry.
- Never force-remove a dirty worktree or discard its files. Report it as blocked unless the user explicitly authorizes discarding those exact changes.
- Never delete remote branches unless the user explicitly requests remote deletion.

## Related skills
Use git-repo-compactor to delete stale information from the repository, such as big orphaned blobs.

## Steps
- Read the accompanying `memory.md` file first, if present, and avoid repeating already-completed deletions.
- Refresh refs with `git fetch --prune origin`.
- Run `git worktree list --porcelain` and inspect every linked worktree with `git status --short --branch` before deleting anything. Resolve all worktrees that share the same common Git repository only once.
- Protect `main`, `release/*`, and `hotfix/*` branches.
- Query Ecelyo, the sole source of truth for task state, and protect branches and worktree paths referenced by active tasks. Do not use repository `tasks/` files or `~/.agents/tasks` as task-state authority.
- When available, inspect active agent sessions and protect any worktree they are currently using.
- If a branch is not reachable from `main`/`origin/main`, report it as "not reachable from main" and resolve the ambiguity before deleting it by checking GitHub and Ecelyo. Do not equate reachability failure with an unmerged branch.
- Use `gh pr list --state merged --head <branch>` or equivalent GitHub merge verification to confirm a merged PR when Git reachability does not prove safety. Treat a merged PR as authoritative evidence even when the branch's original commit IDs are absent from `main`.
- If GitHub no longer retains a branch-to-PR association, compare the branch patch/tree with `main` and accept an explicit maintainer confirmation that the work was merged.
- If there is no open PR for the branch and GitHub does not prove it merged, consult Ecelyo to determine whether the branch is currently assigned to an active task.
- Only delete a branch when both GitHub and Ecelyo support that it is stale or already merged.
- Remove each clean stale worktree with `git worktree remove <absolute-path>` before deleting its local branch, then run `git worktree prune` to clear orphaned administrative metadata.
- Treat a worktree as stale when its branch is safely deletable, its branch no longer exists, or its registered path is missing, provided no active task, PR, or agent session still claims it.
- When the user explicitly says to remove all worktrees except the primary/main worktree and their branches, that authorizes removal of every clean, unprotected non-main worktree and force-deletion of its local branch after reporting commits that are not reachable from `main` and checking the merge evidence above. It does not authorize deleting remote branches.
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
