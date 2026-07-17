Use the `ecelyo-local-server` skill and the `task-executor` skill together for this workflow.

Batch size: **5 tasks** by default. If the user gives a different number, use that instead.

## Server connectivity

1. Read `~/.claude/ecelyo-server-config.json` for the `baseUrl` to use. If that file is missing, prefer the repository's documented Ecelyo server address when one exists; fall back to `http://localhost:8080` only when neither source is available.
2. Check connectivity with `GET {baseUrl}/`. If it fails, report a clear error (likely cause: server disabled, wrong port/host, or the config file is stale) and stop — do not silently fall back to repository `tasks/` files for task *selection*, since the user has designated the Ecelyo server as the primary workflow state. Repository `tasks/` files stay a backup mirror only, per project instructions.

## Selecting tasks

3. At the start of each iteration, load `GET {baseUrl}/tasks/priority` from the current project. Treat `pending` entries as available; `wip` entries are already claimed by another agent unless the user says otherwise.
4. Take only the current top pending task in the order returned by the priority queue (already Blocker → High → Medium → Trivial). Do not preselect or prelock the rest of the batch.
5. Before claiming that server-selected task, confirm the repository mirror exists or can be derived confidently:
   - If the server task description includes a repository task id and source path, use that repo task file.
   - If the server task has no repository mirror file yet, create or update the matching repo task detail file before execution when the task is clearly intended for the current repository.
   - If the task cannot be mirrored confidently into the repository workflow, report the mismatch clearly, skip it, and continue to the next pending server task.
6. After finishing, blocking, or skipping the current task, query `GET {baseUrl}/tasks/priority` again and repeat until the batch size is reached. Never hold locks for more than one task at a time.

## Rules for each task

- Use a dedicated git worktree and branch per task (`<actual-agent>/<slug>`).
- Each task gets its own pull request. If a PR for that task already exists and is still open, push to that branch instead of opening a new one.
- Run the full unit test suite (`./scripts/xcode/run_unit_tests_ci.sh`) before pushing. Do not push if tests fail.
- If screenshot tests fail only because baselines are stale, rerun in record mode and commit updated baselines before pushing.
- If the workflow or repository wants an agent label on the PR, it must match the actual agent executing the work (for example `codex` for Codex, `claude` for Claude). Never apply a different agent's label just because an example, template, or older command text used that name.
- Resolve any merge conflicts with `main` before pushing.

## Stopping condition

- Stop automatically after the batch size (default **5**) tasks are each processed one-by-one and pushed to their branches with passing tests and no conflicts with `main`. Do not continue until the user reviews and approves more work.
- If a task is blocked (missing dependency, design decision needed, ambiguous spec), mirror `blocked` state on the server, skip it, and take the next one.

## For each task, follow the task-executor lifecycle, mirroring state to the Ecelyo server at each step

1. Claim only the current task lock under `~/.agents/tasks/<id>.md`. Do not lock any later candidate task in advance.
2. Mirror app state with `PATCH {baseUrl}/tasks/{id} {"state":"wip","deeplinkUrl":"<your-conversation-url>"}` — always set `deeplinkUrl` in this same call, a link back to the live conversation/thread doing this task (`codex://threads/<thread-id>` in Codex, `claude://agents/<session-id>` in Claude, or the equivalent scheme for another agent technology). Never leave `deeplinkUrl` unset or reuse the app's own `ecelyo://open/...` navigation URL for it. Also move the repository task file from `tasks/pending/` to `tasks/wip/` if one exists (backup mirror). If the server task had to be materialized into a missing repo task file first, do that before the move.
3. Create or reuse the worktree and branch.
4. Implement the changes.
5. Run unit tests; record screenshots if needed.
6. Commit, push, and open or update the PR.
7. Mirror app state with `PATCH {baseUrl}/tasks/{id} {"state":"finished"}`. Also move the repository task file to `tasks/finished/` if one exists.
8. Remove the lock file.
9. Report the PR URL, then re-query the priority endpoint and start the next task.

## When the Ecelyo API can't do something the workflow needs

Do not silently work around it. Create or update a task under project `1781617286` (`ecelyo-app`), tactic `local server improvements`, describing the missing capability, and mention it in your report to the user.
