Use the `task-executor` skill in `batch-task-execution` mode.
Use `ecelyo-methodology` for work selection and sequencing, and
`ecelyo-local-server` for Ecelyo connectivity, priority-queue reads, and task-state updates.

## Request interpretation

- **"Next task"** means take exactly one task: use batch size `1`.
- **"Next N tasks"** means execute an ordered batch of `N` tasks.
- If the user names a project, select only tasks belonging to that Ecelyo project. Otherwise use
  the project associated with the current repository or the project supplied by the surrounding
  context; do not guess when the target is ambiguous.

## Selection rules

- Verify the Ecelyo server with `GET /` before doing task work. If it is unavailable, stop and ask
  the user to start it; never fall back to repository `tasks/` files.
- Read `GET /tasks/priority` first and use that live endpoint as the source of truth. Confirm the
  selected task's full record, project, tactic, state, acceptance criteria, and branch before
  claiming it.
- Select only the next task. For a batch, refresh `/tasks/priority` after every completed task;
  never reserve or pre-claim the whole batch.
- Keep at most one task in progress. A task is not complete until its validation, PR, merge,
  worktree/branch cleanup, and Ecelyo `finished` update are complete.
- For a batch with more than one task, do not select a `High` or `Blocker`/`Blocking` task for any
  slot before the final slot when an eligible `Medium` or `Trivial` task is available. If no
  eligible lower-priority task exists for an earlier slot, stop the batch rather than taking a
  human-intervention task early. The final slot may select the highest-priority remaining task,
  including `High` or `Blocker`/`Blocking`.
- Apply the methodology's WIP, tactic-coherence, archived-project/tactic, and completion-first
  rules. Move a task to `wip` with its live conversation deeplink and `agentTechnology` in the
  same Ecelyo `PATCH`, and keep Ecelyo synchronized as the task advances.

## Execution

Execute each selected task end to end using the `task-executor` skill's normal readiness,
acceptance-criteria, validation, branch/worktree, commit, push, PR, review-gate, merge, cleanup,
and Ecelyo closeout rules. Present the required task-identification table immediately before
starting each task.

For every task, report its project and tactic, task id and title, branch, worktree cleanup,
acceptance-criteria results, validation, commit/push status, PR URL and merge state, Ecelyo state,
and an unambiguous `Task Status: **FINISHED**` or `Task Status: **BLOCKED**` with the exact blocker.
For a batch, include one closeout for each task and a final batch status.
