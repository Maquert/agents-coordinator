---
name: software-backlog-workflow
description: Run generic software-project backlog and maintenance automations. Use when Codex needs to process backlog intake items into task records, execute or finish a WIP task, clean up repository branches/worktrees safely, or generate and publish release notes for a software repository. This skill is for recurring automation prompts that should delegate workflow behavior to one reusable skill instead of repeating full step-by-step instructions.
---

# Software Backlog Workflow

Use this skill as the workflow engine for repository automations. Keep each automation prompt short: specify the workflow mode, the repository-specific paths, any memory file, any versioning or branch policy that differs from the default, and the exact output shape required by the automation.

Default remote behavior for implementation workflows is to push the working branch and create or update a pull request after a successful local validation and focused commit. Automations should mention remote-action details only when they need to opt out, change the PR target or metadata, or add extra remote steps.

If the repository does not already expose the paths or files that the automation expects, stop before making workflow changes and explain how to configure the repository. Use [references/project-setup.md](/Users/mhjaso/.codex/skills/software-backlog-workflow/references/project-setup.md) for the baseline layout and [references/path-mapping.md](/Users/mhjaso/.codex/skills/software-backlog-workflow/references/path-mapping.md) for alternate structures and path overrides.

## Workflow Selection

Choose one mode first:

- `backlog-task-intake`: Turn raw backlog items into normalized task records without implementing them.
- `pending-task-execution`: Choose a pending task, start and finish it.
- `wip-task-execution`: Advance or finish a single WIP task with minimal repo scanning.
- `repository-cleanup`: Remove safe-to-delete branches/worktrees and apply lightweight repository hygiene.
- `release-notes`: Derive customer-facing release notes from recent product changes and complete the release bookkeeping requested by the caller.

If the automation does not name the mode explicitly, infer it from the prompt and state the chosen mode in the response.

## Shared Operating Rules

Apply these rules in every mode unless the automation overrides them:

1. Read only the files needed for the selected mode. Avoid broad repo scans.
2. Read the automation memory file first when one is provided and reuse it to avoid duplicate work.
3. When a concrete approach fails, record a short memory note before ending the run or changing direction:
   - use a `Don't retry this:` label for the failed path
   - add a matching `Better path:` label for the preferred replacement
   - keep the note specific enough that the next turn can avoid repeating the same dead end
4. Verify branch continuity before editing files.
5. If the run is tied to an assigned branch, stay on that branch for the full session.
6. Do not silently switch to a different branch once work begins.
7. Keep edits scoped to the selected task or maintenance action.
8. Use the narrowest sufficient validation first.
9. Do not fix unrelated repository issues.
10. Respect repository instructions from `AGENTS.md` and any task-lifecycle files.
11. For implementation workflows, treat push and PR creation as part of the default finished state unless the automation explicitly disables remote actions.
12. When a task has an assigned branch, always report the PR location in the final output:
   - include the PR URL when one exists
   - otherwise state explicitly that no PR exists yet and why, such as not pushed, blocked before PR creation, or remote access failure

Before executing a mode, verify that the required project structure exists. If it does not:

1. Do not invent hidden assumptions.
2. Report the missing files or directories precisely.
3. Explain the minimum configuration the repository needs for that mode.
4. Suggest either creating the baseline structure or updating the automation prompt to map the workflow to the repository's existing paths.
5. Reference the setup guidance so the user can make the repository compatible.

## Stop And Block Handling

If the run stops or becomes blocked after making relevant file changes:

1. Do not leave the changes on `main`.
2. If the current branch is safe and non-main, keep the work there.
3. Otherwise create or switch to a branch prefixed `wip/`.
4. Commit the relevant changes locally before stopping when the repository state is coherent enough to preserve.
5. Report the blocker clearly and leave the repository ready for another agent.

If validation fails because of likely concurrent or unrelated changes, retry once after a short wait only when that is cheap and safe.

When screenshot validation or baseline refresh work is involved, use this checklist before recording or updating snapshots:

1. Inspect the current baseline image.
2. Inspect the newly rendered temporary image.
3. Confirm the chosen region is targeting the intended control.
4. Only then record or update snapshot references.

Use this small screenshot-debug protocol when a screenshot assertion fails:

1. Confirm the chosen host renders the intended control on each covered platform.
2. Compare the current baseline image with the newly rendered temporary image.
3. Confirm the asserted region is still targeting the intended control.
4. Update snapshot references only after the first three checks pass.

## Mode: backlog-task-intake

Use this mode when the caller points to a backlog source file such as `tasks/intake.md`.

Required inputs:

- A backlog intake source file
- A task detail destination directory
- A backlog index file or another duplicate-check source

If one of those is missing, stop and explain the setup using the references files.

Execution pattern:

1. Open the source file and collect unchecked checklist items or plain list items.
2. Ignore headings, blank lines, and already-processed items.
3. Stop immediately if there are no eligible items.
4. Rewrite each item into a concise task title suitable for a task detail file.
5. Check for duplicates against the existing task detail files and any duplicate-check source named by the caller.
6. For each non-duplicate item, create a new pending task record that follows repository task conventions.
7. Include a short summary, acceptance criteria derived from the source item, constraints, obvious dependencies, and an explicit `priority` field.
8. Use repository-defined task priorities when they exist. If the caller does not provide a priority and the repository has no stronger rule, default new tasks to `Trivial`.
9. Update the backlog index only when the repository still uses one for local convenience; do not require a backlog index when task files are the source of truth.
10. Remove each source item only after the task was created successfully or confirmed as a duplicate.
11. Leave ambiguous or unprocessable items in the source file and report why they were skipped.
12. Do not implement the tasks.

Default output:

- Created task ids and titles
- Skipped duplicates
- Remaining source items and blockers

## Mode: pending-task-execution

Use this mode when the caller wants one not-yet-started task taken from the backlog and finished end-to-end in priority order.

Definitions:

- A **pending task** is a task detail file living under the repository’s `pending/` lifecycle folder (for example `tasks/pending/`) and not already started in a `wip/` folder.
- The **priority order** comes from each task file’s `priority` field, not from checklist order.
- When multiple pending tasks share the same priority, prefer the oldest matching task by task creation date when available, otherwise by task id or filename order.
- Unless the repository defines a different vocabulary, use this descending order: `Blocker`, `High`, `Medium`, `Trivial`.
- If a pending task omits `priority`, treat it as `Trivial` unless the repository explicitly defines another fallback such as `Low`.

Required inputs:

- A pending task directory (for example `tasks/pending/`)
- A task file shape that can store an assigned branch name and priority
- Lifecycle destination(s) for finished/blocked tasks when the repository uses lifecycle folders

Execution pattern:

1. Inspect the pending task directory and collect eligible pending task files.
   - Eligible means the task file is under `pending/` and its status is `pending` or the repository equivalent.
2. Read only the pending task files needed to determine priority and choose the highest-priority eligible task.
3. Resolve ties by oldest creation date when available, otherwise by smallest stable id or filename order.
4. Read the selected pending task file before reading broader code.
5. Verify the task is truly not started:
   - Task file location is under `pending/`.
   - Task status is `pending` (or the repository’s equivalent).
   - Missing priority is treated with the repository fallback, which is `Trivial` unless overridden.
6. Resolve branch ownership from the task file:
   - If the task declares an assigned branch, verify the current branch matches it before doing work.
   - If the declared branch does not exist locally, create it from the repository’s base branch and switch to it.
   - If **no branch is declared**, do **not** silently proceed: warn the user with a leading `⚠️` and invent a branch name for this run using the caller’s preferred prefix, then record that branch name into the task file before continuing.
7. Move the task detail file from `pending/` to `wip/` (and update its status field) before making implementation changes.
8. Execute the task end-to-end:
   - Read only the code, docs, scripts, and tests required for the selected task.
   - Follow repository technical requirements, PRD/specifications, and `AGENTS.md` instructions.
9. Validate the task using the repository’s preferred validation scripts and runners (prefer `scripts/` wrappers over raw commands).
10. If validation passes, create a focused local commit containing only task-related changes, push the task branch, create or update a pull request against the repository's default integration branch unless the repository says otherwise, then move the task file to `finished/`.
11. If blocked, record the blocker and move the task to `blocked/` (or keep it `wip/` if that is the repository convention), leaving the repository on a safe non-main branch with work preserved.
12. Stop after the first pending task that required action.

Default output:

- Selected task (title + id + priority)
- Selected task file path
- Branch used or created (and whether a `⚠️` warning was emitted)
- Work completed
- Validation run
- Local commit status
- Push status
- PR URL or reuse status, or an explicit no-PR reason when the branch has no PR
- Task lifecycle moves performed
- Memory update summary if a memory file was provided

## Mode: wip-task-execution

Use this mode when the caller wants one WIP task advanced or finished per run.

Required inputs:

- A WIP task directory
- A defined task-file shape that can hold branch ownership and status notes
- A destination for finished or blocked tasks when the repository uses lifecycle folders

If the repository has WIP work tracked elsewhere, explain how to map that structure using the references files instead of guessing.

Execution pattern:

1. Inspect only the WIP task directory named by the caller.
2. If no WIP task exists, stop.
3. Pick the oldest WIP task unless the memory file provides a better reason to skip it.
4. Read that task file before reading broader code.
5. Resolve branch ownership from the task file.
6. If the task declares a branch, verify the current branch matches it.
7. If the declared branch does not yet exist locally, create it from the current base state and switch to it.
8. If no branch is declared, create a task branch using the caller's preferred prefix, record it in the task file, and continue on that branch.
9. Read only the code, docs, scripts, and tests needed for that task.
10. Decide whether the task is already complete, incomplete, or blocked.
11. If complete, add concise completion notes and move it to the finished state requested by the repository workflow.
12. If incomplete, continue the task end-to-end.
13. If blocked, record the blocker in the task file and keep or move the task to the appropriate blocked/WIP state.
14. Validate only what is necessary to close the task safely.
15. Create a focused local commit only when the task is validated or the caller explicitly wants preservation of blocked work.
16. After a validated task commit, push the branch and open or reuse a pull request by default. Skip remote actions only when the automation explicitly disables them or local context proves they are impossible.
17. Stop after the first WIP task that required action.

Default output:

- Selected WIP task
- Branch used or created
- Work completed
- Validation run
- Local commit status
- Push status
- PR URL or reuse status, or an explicit no-PR reason when the branch has no PR
- Memory update summary if a memory file was provided

## Mode: repository-cleanup

Use this mode for low-risk branch and workspace hygiene.

Required inputs:

- A main integration branch name
- Optional active-task paths used to protect branches from deletion
- An optional validation command

If the repository has no task directories, continue only when the automation prompt defines another reliable source of protected branches.

Execution pattern:

1. Refresh remote refs, usually with `git fetch --prune`.
2. Build a protected-branch keep list from the automation prompt plus any branches referenced by active WIP tasks.
3. Never delete protected branches locally or remotely.
4. Delete only branches already merged into the main integration branch named by the caller.
5. Prune worktrees that belong to deleted branches.
6. Apply any narrow file hygiene requested by the automation, such as removing stale localization markers.
7. Validate with the repository's standard test command when the caller requires validation.
8. If cleanup changes repository files, propose or create a focused commit as instructed.

Default output:

- Deleted local branches
- Deleted remote branches
- Deleted worktrees
- File-hygiene result
- Validation result
- Proposed commit message when changes exist

## Mode: release-notes

Use this mode when the caller wants release notes plus associated versioning, tagging, or PR work.

Required inputs:

- A release comparison rule such as a tag or previous version marker
- A destination for release notes
- Any version-file, string-catalog, or release-metadata locations that need updates

If those destinations are not supplied and cannot be inferred safely, stop and explain the missing configuration.

Execution pattern:

1. Determine the comparison range from the caller's release marker, tag, or previous release rule.
2. Read only the commits and files needed to understand user-visible changes.
3. Filter out technical-only or internal maintenance changes unless the caller wants them included.
4. Group the remaining changes into customer-facing bullets or sections.
5. Rewrite them in clear product language.
6. Update the release notes destination and remove stale release-note strings when the repository stores them in localization catalogs or similar files.
7. Apply the caller's versioning policy exactly.
8. Create the release commit locally when requested.
9. Move or recreate the release marker tag exactly as requested by the caller.
10. Push branches, tags, and create or update a PR by default when release work creates remote-facing changes, unless the automation explicitly disables remote actions.
11. If the caller requires ending on `main`, return there only after the work is safely committed elsewhere or fully finished.

Default output:

- Version change
- Release range used
- Customer-facing note summary
- Files updated
- Commit hash if any
- Tag actions
- Push status
- PR URL if any, or an explicit no-PR reason when release work used a branch but no PR exists

## Automation Prompt Contract

Keep automation prompts short and supply only:

- The workflow mode
- Repository path or current working directory
- Any memory file path
- Source directories or files
- Branch naming or protection rules that differ from the default
- Validation command preferences
- Any remote-action override such as `no_pr`, custom PR base, or custom PR metadata
- Versioning and tagging rules
- Any path overrides when the repository does not use the baseline `tasks/` layout
- Required final output or finish message

Do not restate the full workflow in each automation unless the repository has a real exception to this skill.
