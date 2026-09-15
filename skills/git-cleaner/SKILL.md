---
name: git-cleaner
description: Audit and safely clean stale Git branches, worktrees, and checkout state in local repositories. Use when Codex needs to find old local branches without same-named remotes, inspect stale worktrees, or review uncommitted integration-branch changes.
---

# Git Cleaner

Use this skill for repository hygiene. Audit first, show exact candidates, and keep cleanup reversible wherever possible.

## Scope

- Prefer explicit repository paths. If a root is supplied, keep discovery bounded to its direct child repositories; do not sweep a home directory or every nested worktree.
- The common project root is `${DEVELOPER_PROJECTS_ROOT:-$HOME/Developer/Projects}`. The caller may override it.
- The default remote is `origin`; report when it is missing or when fetching fails.

## Stale-branch rule

A local branch is a stale candidate when both conditions hold:

1. Its latest commit is older than the requested threshold, defaulting to two full days.
2. The selected remote has no branch with the exact same name.

An upstream such as `origin/main` does not count as a same-named remote for a local branch with another name. Refresh remote-tracking refs with `git fetch --prune` before evaluating this rule, and include the cutoff timestamp in the report.

For every candidate, report its latest commit date, whether it is checked out, every worktree using it, whether it is merged into the integration branch, and whether it is protected. Include branches that are old but still remotely present in a non-candidate section when useful.

## Safety rules

- Never delete a branch merely because it matches the stale-branch rule. It must also be unprotected, not checked out in any worktree, and safe under the repository's integration policy. Require explicit approval of the exact deletion list.
- Protect the current branch, the repository's integration branch, and any branches named by the caller. Treat `main`, `master`, `develop`, and `release-candidate` as protected by default unless the caller explicitly changes that policy.
- Do not delete remote branches by default. Remote deletion requires a separate explicit request and an exact remote-branch list.
- List worktrees before cleanup. `git worktree prune` may remove only stale administrative records for missing worktree directories. Remove an existing worktree only with an explicit request, after checking its status; use `git worktree remove`, never filesystem deletion.
- If an integration branch such as `main` has uncommitted files, report the porcelain status and divergence from its upstream. Never reset, clean, stash, commit, or overwrite those files without the user's explicit choice.
- Do not run `git reset --hard`, `git clean`, `git branch -D`, reflog expiration, or aggressive garbage collection as part of an audit. Object pruning or garbage collection requires a separate explicit request after candidate reporting.
- Preserve unrelated edits and stop cleanup when repository state changes concurrently or when a required fetch/status check fails.

## Workflow

1. Verify each requested path is a Git worktree and record its current branch, repository root, remotes, and status.
2. Fetch/prune remote-tracking refs, unless the caller explicitly requests an offline audit; mark offline results as potentially stale.
3. Inspect local branches, remote branches, and all worktrees. Compute stale candidates using the rule above.
4. Present an audit with separate sections for stale local branches, protected/active branches, worktree records, uncommitted integration-branch files, and validation errors.
5. If cleanup is requested, present a dry-run containing exact commands and targets. Apply only the approved local actions, re-checking status after each repository-level mutation.
6. Re-run the audit and report what changed, what was skipped, and any remaining blockers.

## Helper

For repeatable read-only inventory, use [`scripts/audit_git.py`](scripts/audit_git.py). Pass `--repo` once per repository, `--fetch` when remote refs should be refreshed, and `--json` when another tool needs structured output. The helper only audits; it never deletes branches, worktrees, files, or Git objects.

## Output

Use compact Markdown tables with: repository, branch/worktree, last commit, age, same-named remote, active/protected state, merged state, and recommended action. State explicitly whether the result is audit-only or a completed cleanup.
