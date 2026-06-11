---
name: repository-cleanup
description: Clean up software repository branches and worktrees safely and apply lightweight repository hygiene. Use when Codex needs to delete merged branches, prune stale worktrees, protect active task branches from deletion, or run narrow file hygiene such as removing stale localization markers, with optional validation afterwards.
---

# Repository Cleanup

Use this skill for low-risk branch and workspace hygiene. Keep each automation prompt short: specify the main integration branch, the protected-branch sources, any memory file, any extra file hygiene, and the exact output shape required by the automation.

## Operating Rules

1. Read only the files needed for cleanup. Avoid broad repo scans.
2. Read the automation memory file first when one is provided and avoid repeating already-completed deletions.
3. Keep edits scoped to the requested maintenance actions. Do not fix unrelated repository issues.
4. Respect repository instructions from `AGENTS.md` and any task-lifecycle files.
5. If validation fails because of likely concurrent or unrelated changes, retry once after a short wait only when that is cheap and safe.

## Required Inputs

- A main integration branch name
- Optional active-task paths used to protect branches from deletion
- An optional validation command

If the repository has no task directories, continue only when the automation prompt defines another reliable source of protected branches. Examples of alternate protected-branch sources: a maintained keep-list file, branch naming rules, or a project board export committed in the repo.

## Execution Pattern

1. Refresh remote refs, usually with `git fetch --prune`.
2. Build a protected-branch keep list from the automation prompt plus any branches referenced by active WIP tasks.
3. Never delete protected branches locally or remotely.
4. Delete only branches already merged into the main integration branch named by the caller.
5. Prune worktrees that belong to deleted branches.
6. Apply any narrow file hygiene requested by the automation, such as removing stale localization markers.
7. Validate with the repository's standard test command when the caller requires validation.
8. If cleanup changes repository files, propose or create a focused commit as instructed.

## Default Output

- Deleted local branches
- Deleted remote branches
- Deleted worktrees
- File-hygiene result
- Validation result
- Proposed commit message when changes exist

## Automation Prompt Contract

Keep automation prompts short and supply only:

- Repository path or current working directory
- Any memory file path
- The main integration branch and protected-branch rules
- Whether remote branch deletion is allowed
- Any narrow file hygiene to apply
- Validation command preferences
- Required final output or finish message

Do not restate the full workflow in each automation unless the repository has a real exception to this skill.
