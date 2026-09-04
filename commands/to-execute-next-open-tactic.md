Use the `task-executor` skill in `batch-task-execution` mode to execute one complete Ecelyo tactic.
Use `ecelyo-methodology` for tactic selection and sequencing, and `ecelyo-local-server` for
Ecelyo connectivity (using cached `ECELYO_SERVER_IP` or Bonjour discovery when needed), live reads, and task-state updates.

## Selection contract

Select exactly one active tactic before starting work:

1. Use the cached `ECELYO_SERVER_IP` environment variable if available and reachable. If unset or
   unreachable, discover the Ecelyo server through Bonjour under `_ecelyo._tcp.local.` (deduplicating
   repeated interface announcements by advertised instance name; stopping if there is no instance or
   more than one distinct instance; never silently choosing a server or falling back to `localhost`),
   and cache the resolved IP in `ECELYO_SERVER_IP`.
2. When resolving via Bonjour, resolve the selected instance with `dns-sd -L`, resolve its advertised
   hostname with `dns-sd -G v4`, and use the resolved non-loopback address and advertised port. Require
   `ECELYO_SERVER_TOKEN` and send it only as `Authorization: Bearer ...`; never print or persist it.
3. Verify `GET /` succeeds, then read `GET /systems` and `GET /tasks/priority`. Use the active
   system unless the user explicitly supplied a system or project filter. If there is no unique
   active system, stop and ask for the intended scope.
4. Cross-reference each project's `tactics` metadata with its grouped `tasks` by `tacticId`.
   Use the narrowest additional `GET /tactics?...` or `GET /tasks?...` query only if the priority
   response lacks a required field; do not invent an endpoint.
5. A tactic is eligible only when all of these are true:
   - its system and project are in scope and not archived;
   - the tactic is not `accomplished` or archived;
   - its persisted `objective` is non-empty;
   - it has at least one `pending` task; and
   - none of its tasks has state `wip`.
6. Rank eligible tactics using the server's priority ordering. Within that ordering, prefer
   `Blocker`, then `High`, then `Medium`, then `Trivial`; preserve the server order for ties.
   Do not select a tactic merely because it has no `wip` tasks if it has no executable pending task.
7. Immediately refresh `/tasks/priority` and re-check the selected tactic's zero-`wip` condition
   before claiming any task. If another agent has started a task, discard the candidate and choose
   the next eligible tactic from a fresh response.

If no tactic qualifies, report that no unclaimed tactic with pending work exists and stop without
changing Ecelyo state or creating local task records.

## Tactic execution

After selection, stay within that tactic until it is resolved. Do not hop to another tactic because
one task is inconvenient.

1. Read the full selected task with `GET /tasks/{id}` before editing. Check its goal, non-goals,
   affected surfaces, dependencies, validation plan, branch, and acceptance criteria. If the task
   is materially ambiguous or lacks usable acceptance criteria, preserve the truthful state and
   stop for clarification.
2. Before each task begins, present this table:

   | Field | Value |
   | --- | --- |
   | ID | Task ID |
   | Name | Task title |
   | Project | Project name and ID |
   | Tactic | Tactic name and ID |

3. Claim only one task at a time with one atomic `PATCH /tasks/{id}` containing:

   ```json
   {
     "state": "wip",
     "deeplinkUrl": "codex://threads/<current-thread-id>",
     "agentTechnology": "Codex"
   }
   ```

   Use the equivalent live deeplink and agent technology when another supported agent runs the
   command. Never use an `ecelyo://open/...` navigation URL for `deeplinkUrl`.
4. Execute the claimed task end to end under `task-executor`: use its canonical branch and a
   dedicated worktree, implement only the task scope, validate narrowly first, complete the
   required project gate, push the branch, create and resolve the pull request according to the
   task priority, merge when policy allows, remove the clean worktree and branch when permitted,
   and then set the task to `finished`. If blocked, set `blocked` when appropriate and stop.
5. After every task completion, refresh `GET /tasks/priority`. Continue only if the same tactic
   still has pending tasks and zero `wip` tasks. Re-check the full task record before each next
   claim; never pre-claim or reserve the tactic's tasks.
6. When all tasks belonging to the tactic are resolved, verify its goal and final closure task are
   actually satisfied. Only then request `PATCH /tactics/{id}` with `{"status":"accomplished"}`
   when the tactic's closure contract is complete and the API accepts it. Do not force an
   accomplished status to hide unresolved, blocked, or unverified work.

## Completion report

Report the selected tactic, every task handled, acceptance-criteria evidence, validation results,
commit/push and pull-request state, branch and worktree cleanup, final tactic state, and any exact
blocker. Use `Task Status: **FINISHED**` only when the complete tactic workflow and cleanup gates
have passed; otherwise use `Task Status: **BLOCKED**` or preserve the accurate active state.
