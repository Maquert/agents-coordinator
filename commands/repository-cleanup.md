Use the `repository-cleanup` skill.

- Read the accompanying `memory.md` file first, if present, and avoid repeating already-completed deletions.
- Refresh refs with `git fetch --prune origin`.
- Protect `main`, `release/*`, and `hotfix/*` branches.
- Parse `tasks/wip/*.md` and protect any declared task branch from local or remote deletion.
- Delete only local branches that are safe to remove after checking both Git reachability and GitHub merge state. Treat a branch as eligible if it is either merged into `main`/`origin/main` or confirmed merged on GitHub for that head branch (including squash/rebase merges that do not remain reachable from `main`).
- Prefer `gh pr list --state merged --head <branch>` or equivalent GitHub merge verification for branches not reachable from `main` but may still be merged.
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
