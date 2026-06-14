---
name: backlog-task-execution
description: Select and execute one backlog task end-to-end in a software repository. Use when Codex needs to pick a pending task from the backlog and finish it, or advance and finish a single WIP task, including agent task-lock claiming, branch ownership, validation, focused commits, push, and pull request creation or update.
---

# Backlog Task Execution

Use this skill to execute one backlog task per run. Keep each automation prompt short: specify the workflow mode, the repository-specific paths, any memory file, any versioning or branch policy that differs from the default, and the exact output shape required by the automation.

Default remote behavior is to push the working branch and create or update a pull request after a successful local validation and focused commit. Automations should mention remote-action details only when they need to opt out, change the PR target or metadata, or add extra remote steps.

Task records must carry an assigned branch name from intake onward. The task file stores the canonical branch slug without an agent prefix, for example `branch: increase_padding`. When an agent starts the task, it should create or use the concrete git branch `<agent>/<branch>`, such as `claude/increase_padding` or `codex/increase_padding`.

For UI-relevant work, pull request descriptions should include a `## Visual Changes` section with at least one relevant screenshot when a screenshot is available and useful. SwiftUI UI changes must also add or update screenshot coverage for every impacted platform contract before the task is considered complete. This section is optional for non-UI work and may be omitted when no meaningful screenshot applies. If the repository PR template does not already include `## Visual Changes`, the agent should add that section to the template the first time it prepares a PR description that uses it.

When linking screenshots from files already committed in the repository, do not use `raw.githubusercontent.com` URLs for private repositories because GitHub renders those as anonymous fetches and they return `404`. Prefer authenticated GitHub blob URLs with `?raw=1`, or GitHub-uploaded attachments when the image is not tracked in the repo.

If the repository does not already expose the paths or files that the automation expects, stop before making workflow changes and explain how to configure the repository. Use the `backlog-task-intake` skill references (`references/project-setup.md` for the baseline layout and `references/path-mapping.md` for alternate structures and path overrides) as the setup guidance.

## Workflow Selection

Choose one mode first:

- `pending-task-execution`: Choose a pending task, start and finish it.
- `wip-task-execution`: Advance or finish a single WIP task with minimal repo scanning.

If the automation does not name the mode explicitly, infer it from the prompt and state the chosen mode in the response.

## Agent Task-Lock Protocol

Before picking any task, every agent must consult `~/.agents/tasks/` to avoid collisions with agents running in parallel. Follow [references/task-lock-protocol.md](references/task-lock-protocol.md) for the lock file location, template, claim rules, and lifecycle.

## Shared Operating Rules

Apply these rules in both modes unless the automation overrides them:

1. Read only the files needed for the selected mode. Avoid broad repo scans.
   - When the selected task file already names relevant files, treat that list as the default narrowing scope and widen only if those files no longer explain the work.
2. Read the automation memory file first when one is provided and reuse it to avoid duplicate work.
3. When a concrete approach fails, record a short memory note before ending the run or changing direction:
   - use a `Don't retry this:` label for the failed path
   - add a matching `Better path:` label for the preferred replacement
   - keep the note specific enough that the next turn can avoid repeating the same dead end
4. Verify branch continuity before editing files.
5. If the run is tied to an assigned branch, stay on that branch for the full session.
6. Do not silently switch to a different branch once work begins.
7. Keep edits scoped to the selected task.
8. Use the narrowest sufficient validation first.
   - For UI work, prefer dedicated component or screen snapshot tests before broader screenshot suites unless the task changes shared shell chrome or the focused contract is missing.
9. Do not fix unrelated repository issues.
10. Respect repository instructions from `AGENTS.md` and any task-lifecycle files.
11. Treat push and PR creation as part of the default finished state unless the automation explicitly disables remote actions.
12. When a task has an assigned branch, always report the PR location in the final output:
   - include the PR URL when one exists
   - otherwise state explicitly that no PR exists yet and why, such as not pushed, blocked before PR creation, or remote access failure
13. Always report the task id and concrete branch name in a compact Markdown table in the final output.
   - use columns `task id` and `branch`
   - include exactly the selected task id and the concrete working branch name such as `codex/increase_padding`
14. When preparing a PR description for UI-relevant work, include a `## Visual Changes` section with at least one relevant screenshot when applicable. If screenshots come from tracked repo files in a private repository, use GitHub blob URLs with `?raw=1` rather than `raw.githubusercontent.com`. If the repository has a PR template and that section is missing, add it the first time this requirement is used.

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

## Screenshot Validation

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

When the assertion is failing because the UI change is intentional and the rendered output is correct, rerun the relevant record workflow immediately, update every affected baseline for the impacted platform contracts, rerun screenshot verification, and continue the task. Do not move the task to blocked for stale-but-correct baselines alone.
When the repository provides a canonical script that refreshes all definitive platform baselines sequentially, prefer that script over ad hoc multi-command record sequences whenever the task needs the full baseline set updated.

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

1. Read `~/.agents/tasks/` and collect all claimed task ids. These are off-limits for the entire run.
2. Inspect the pending task directory and collect eligible pending task files.
   - Eligible means the task file is under `pending/`, its status is `pending` or the repository equivalent, **and its id is not in the claimed set**.
3. Read only the pending task files needed to determine priority and choose the highest-priority eligible task.
4. Resolve ties by oldest creation date when available, otherwise by smallest stable id or filename order.
5. Read the selected pending task file before reading broader code.
6. Immediately write the lock file to `~/.agents/tasks/<task-id>.md` with `status: wip` before touching any code.
7. Verify the task is truly not started:
   - Task file location is under `pending/`.
   - Task status is `pending` (or the repository’s equivalent).
   - Missing priority is treated with the repository fallback, which is `Trivial` unless overridden.
8. Resolve branch ownership from the task file:
   - The task file must already declare the canonical branch slug assigned during intake, such as `increase_padding`.
   - The working git branch for this run must be `<agent>/<branch>`, such as `codex/increase_padding`.
   - If the current branch does not match that concrete branch name, create or switch to it from the repository’s base branch before doing work.
   - If the task file does not declare a branch, stop and warn the user with a leading `⚠️` instead of inventing one during execution.
9. Move the task detail file from `pending/` to `wip/` (and update its status field) before making implementation changes.
10. Execute the task end-to-end:
   - Read only the code, docs, scripts, and tests required for the selected task.
   - Follow repository technical requirements, PRD/specifications, and `AGENTS.md` instructions.
11. Validate the task using the repository’s preferred validation scripts and runners (prefer `scripts/` wrappers over raw commands).
12. If validation passes, create a focused local commit containing only task-related changes, push the task branch, create or update a pull request against the repository's default integration branch unless the repository says otherwise, set the pull request title to begin with the task id (#123) such as `#1234 My PR title`, ensure the PR description uses `## Visual Changes` with at least one relevant screenshot for UI-relevant work, use GitHub blob URLs with `?raw=1` for tracked screenshot files in private repositories, and add that section to the repository PR template if needed, move the task file to `finished/`, then **delete** `~/.agents/tasks/<task-id>.md`.
13. If blocked, record the blocker, update the lock file to `status: blocked`, and move the task to `blocked/` (or keep it `wip/` if that is the repository convention), leaving the repository on a safe non-main branch with work preserved.
14. Stop after the first pending task that required action.

Default output:

- Selected task (title + id + priority)
- Selected task file path
- Task id / branch table
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

If the repository has WIP work tracked elsewhere, explain how to map that structure using the `backlog-task-intake` references instead of guessing.

Execution pattern:

1. Read `~/.agents/tasks/` and collect all claimed task ids. Any id with `status: wip` claimed by a **different agent** is off-limits for this run.
2. Inspect only the WIP task directory named by the caller.
3. If no WIP task exists, stop.
4. Pick the oldest WIP task (not already locked by another agent) unless the memory file provides a better reason to skip it.
5. Read that task file before reading broader code.
6. If no lock file exists yet for this task, write one to `~/.agents/tasks/<task-id>.md` with `status: wip` before making changes.
7. Resolve branch ownership from the task file.
8. The task file must already declare the canonical branch slug assigned during intake, such as `increase_padding`.
9. The working git branch for this run must be `<agent>/<branch>`, such as `claude/increase_padding`.
10. If the current branch does not match that concrete branch name, create or switch to it from the current base state.
11. If no branch is declared, stop and warn the user with a leading `⚠️` instead of inventing one during execution.
12. Read only the code, docs, scripts, and tests needed for that task.
13. Decide whether the task is already complete, incomplete, or blocked.
14. If complete, add concise completion notes, move it to the finished state requested by the repository workflow, and **delete** `~/.agents/tasks/<task-id>.md`.
15. If incomplete, continue the task end-to-end.
16. If blocked, record the blocker in the task file, update the lock file to `status: blocked`, and keep or move the task to the appropriate blocked/WIP state.
17. Validate only what is necessary to close the task safely.
18. Create a focused local commit only when the task is validated or the caller explicitly wants preservation of blocked work.
19. After a validated task commit, push the branch and open or reuse a pull request by default. Set the pull request title to begin with the task id in square brackets such as `[1234] My PR title`. For UI-relevant work, ensure the PR description includes `## Visual Changes` with at least one relevant screenshot when applicable. For tracked screenshot files in private repositories, use GitHub blob URLs with `?raw=1` instead of `raw.githubusercontent.com`, and add that section to the repository PR template the first time it is needed if the template lacks it. Skip remote actions only when the automation explicitly disables them or local context proves they are impossible.
20. Stop after the first WIP task that required action.

Default output:

- Selected WIP task
- Task id / branch table
- Branch used or created
- Work completed
- Validation run
- Local commit status
- Push status
- PR URL or reuse status, or an explicit no-PR reason when the branch has no PR
- Memory update summary if a memory file was provided

## Automation Prompt Contract

Keep automation prompts short and supply only:

- The workflow mode
- Repository path or current working directory
- Any memory file path
- Task lifecycle directories
- Branch naming or protection rules that differ from the default
- Validation command preferences
- Any remote-action override such as `no_pr`, custom PR base, or custom PR metadata
- Any path overrides when the repository does not use the baseline `tasks/` layout
- Required final output or finish message

Do not restate the full workflow in each automation unless the repository has a real exception to this skill.
