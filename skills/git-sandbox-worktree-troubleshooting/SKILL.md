---
name: git-sandbox-worktree-troubleshooting
description: Use when git work is blocked by sandbox permissions, worktree metadata writes, index locks, non-interactive GPG signing, patch transfer between worktrees, or push/PR flows that fail because the current workspace cannot mutate the required git metadata.
---

# Git Sandbox And Worktree Troubleshooting

Use this skill when a task is blocked by git operations that fail because the current workspace cannot write the git metadata it needs.

## Focus

- Sandbox permission failures on `.git`, `.git/worktrees`, `.git/refs`, or cache paths.
- Worktree-specific failures while branching, applying patches, committing, or staging.
- Non-interactive commit signing failures such as `gpg: cannot open '/dev/tty'`.
- Clean handoff from a sandboxed worktree to a writable branch/worktree for commit, push, and PR steps.
- GitHub CLI auth or PR flows that fail inside the sandbox even though the real host environment is correctly authenticated.

## Quick Triage

Check the exact failing command and error first.

- `Operation not permitted` on `.git/worktrees/.../index.lock`:
  The current context can edit files but cannot mutate the git metadata for that worktree. Re-run the git mutation with escalation, or move the validated patch into a clean worktree created outside the sandbox.
- `cannot lock ref 'refs/heads/...'` or cannot create branch directories:
  Branch creation is writing through the main repo git dir, not only the current filesystem checkout. Escalate `git worktree add` or equivalent branch creation.
- `git apply --index` fails on `index.lock`:
  The patch itself is fine; the git index for that worktree is blocked. Escalate `git apply --index`.
- `gpg: cannot open '/dev/tty'` during commit:
  The commit is blocked by interactive signing, not by the diff. Re-run only that commit with `git -c commit.gpgsign=false commit ...` if a local unsigned automation commit is acceptable.
- `Could not resolve package dependencies` mixed with sandbox cache errors:
  Distinguish dependency resolution from filesystem restrictions. If the failing path is under global caches or requires network/package resolution, use a reusable elevated wrapper script.
- `gh auth status` says the token is invalid, but the user reports a valid login:
  Treat this as a sandbox-vs-host credential mismatch first, not as a confirmed auth failure. Re-run `gh auth status` with escalation before telling the user to re-authenticate.
- `gh pr view` or `gh pr create` fails right after a successful push and the branch exists on origin:
  Assume the branch state may be fine and the failure may be sandbox-related. Verify auth outside the sandbox, then retry the PR command with escalation instead of stopping at the first CLI error.

## Preferred Recovery Pattern

When implementation and validation can happen in a sandboxed worktree but publication cannot:

1. Validate the change where you are.
2. Stage only the task files.
3. Export a patch from the staged diff:
   `git diff --cached --binary > /private/tmp/task.patch`
4. Create a clean worktree from `main` outside the sandbox:
   `git worktree add /private/tmp/<task-worktree> -b <branch> main`
5. Apply the patch in the clean worktree:
   `git apply --index /private/tmp/task.patch`
6. Commit there.
7. Push and open the PR from that clean worktree.

Use this pattern when trying to force commits from the original sandboxed worktree would create repeated permission friction.

When git push already works but GitHub CLI steps do not:

1. Confirm the branch is pushed to the expected remote.
2. If `gh auth status` fails unexpectedly in the sandbox, re-run it with escalation.
3. Check for an existing PR with `gh pr view <branch>` outside the sandbox.
4. If no PR exists, prepare the PR body from the repository template before the elevated create step.
5. Run `gh pr create` with explicit base, head, title, and body file outside the sandbox.
6. If label edits are optional and require another approval path, do not block PR creation on them.

Use this path when the real blocker is host/sandbox credential visibility rather than git metadata writes.

## Reusable Script Guidance

If the same elevated action will happen more than once, wrap it in a stable script and request approval for the script path instead of the long raw command.

Good candidates:

- `scripts/record_<platform>_snapshots.sh`
- `scripts/verify_<workflow>.sh`
- `scripts/publish_<artifact>.sh`
- narrow `gh` command families such as `gh auth status`, `gh pr view`, and `gh pr create`

The goal is to get a narrow reusable approval surface that matches one workflow.

## Minimal Decision Rules

- If the failure is about repo metadata writes, escalate the specific git command.
- If the failure repeats across several git mutation commands, move to the clean-worktree patch-transfer flow.
- If the failure is only GPG/TTY, do not redesign the workflow; override signing for that one local commit.
- If GitHub CLI auth looks invalid only inside the sandbox, verify it outside the sandbox before asking the user to rotate credentials.
- If a push succeeds but PR creation fails, separate branch publication from GitHub CLI auth and retry the `gh` step with escalation.
- If a repo has a PR template, prepare the completed body before the elevated `gh pr create` call so the privileged step is a single concrete action.
- If validation has not passed yet, do not branch/push/PR. Fix validation first.

## What To Report

When you unblock the task, report:

- the failing command family
- the real root cause
- whether you escalated in place or switched to a clean worktree
- whether the issue was sandbox-only or a real host auth/config problem
- any reusable script or approval path added to avoid the same blocker next time
