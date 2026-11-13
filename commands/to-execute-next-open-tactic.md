Use the [task-executor skill](/Users/mhjaso/.agents/skills/task-executor/SKILL.md) in
`batch-task-execution` mode and follow its execution and closeout instructions. This command is
intended for scheduled tasks and routines.
Use `ecelyo-methodology` for tactic selection and sequencing, and `ecelyo-satellite` for
Ecelyo connectivity (using cached `ECELYO_SERVER_IP` or Bonjour discovery when needed), live reads, and task-state updates.

## Selection contract

Select exactly one active tactic before starting work:

1. Use the cached `ECELYO_SERVER_IP` environment variable if available and reachable. If unset or
   unreachable, discover Ecelyo Satellite through Bonjour under `_ecelyo._tcp.local.` (deduplicating
   repeated interface announcements by advertised instance name; stopping if there is no instance or
   more than one distinct instance; never silently choosing a server or falling back to `localhost`),
   and cache the resolved IP in `ECELYO_SERVER_IP`.
2. When resolving via Bonjour, resolve the selected instance with `dns-sd -L`, resolve its advertised
   hostname with `dns-sd -G v4`, and use the resolved non-loopback address and advertised port. Require
   `ECELYO_SERVER_TOKEN` and send it only as `Authorization: Bearer ...`; never print or persist it.
3. Verify `GET /` succeeds, then read `GET /systems` and `GET /tasks/priority`. Use the active
   system unless the user explicitly supplied a system or project filter. If there is no unique
   active system, stop and ask for the intended scope.
4. Read the version-scoped tactic candidates from Ecelyo's `GET /tactics/by-version` endpoint
   and, when using the MPC integration, from `list_tactics_by_version`. Treat the results from
   either source as authoritative candidates; do not discard a tactic merely because its status
   is `wip`.
5. Cross-reference each project's `tactics` metadata with its grouped `tasks` by `tacticId`.
   Use the narrowest additional `GET /tactics?...` or `GET /tasks?...` query only if the priority
   response lacks a required field; do not invent an endpoint.
6. A tactic is eligible only when all of these are true:
   - its system and project are in scope and not archived;
   - its project name does not contain the word `Release` or `Icebox` (case-insensitive); never
     pick a tactic from such a project, and never claim its tasks;
   - the tactic is not `accomplished` or archived. A `wip` tactic is eligible and resumable;
   - its persisted `objective` is non-empty;
   - it has at least one `pending` task; and
   - every candidate task selected for execution has a finished parent chain and is not owned by
     another agent. Do not claim a second task when the tactic already has a `wip` task owned by
     another agent. If the `wip` task belongs to this execution thread, continue that task instead.
7. Prefer eligible tactics whose persisted status is `wip` over every eligible tactic that has not
   started, regardless of priority or age. In other words, complete a current tactic before
   starting a new one. This preference applies equally to `wip` tactics returned by
   `GET /tactics/by-version` and `list_tactics_by_version`; those tactics may be claimed and
   continued after a fresh ownership and task-graph check. Hard exclusions (scope, archived or
   accomplished state, `Release`/`Icebox` projects, unfinished parents, and another agent's
   active task) still apply.
8. Sort candidates within the `wip` group and the not-started group by version, then keep only
   tactics matching the current system's
   `systemversion`. If the current `systemversion` is unavailable or no tactic matches it, skip
   this selection run without claiming work.
9. From the matching tactics, defer tactics in the Maintenance project whenever an eligible
   matching tactic exists in another project; claim a Maintenance tactic only when nothing else
   is eligible. Apply this Maintenance preference after the `wip`-versus-not-started preference.
   Within the selected group, sort candidates by priority from highest to lowest and select the
   highest-priority tactic; preserve server order for ties.
   Do not select a tactic merely because it has pending tasks if it has no executable pending task
   (for example, when every pending task depends on a parent that is not `finished`).
10. If the selected tactic belongs to the Maintenance project, execute no more than three tasks
   from it in this run, then stop even if it still has unfinished tasks.
11. Immediately refresh `/tasks/priority` and re-check the selected tactic's status, task ownership,
   parent chain, and executable pending task before claiming any task. If another agent has started
   a task, discard the candidate and choose the next eligible tactic from a fresh response. A tactic
   that is already `wip` remains the preferred candidate when its own work can be safely continued.

If no tactic qualifies, report that no unclaimed tactic with pending work exists and stop without
changing Ecelyo state or creating local task records.

## Tactic execution

After selection, stay within that tactic until it is resolved, or until the three-task limit for a
Maintenance tactic is reached. Do not hop to another tactic because one task is inconvenient. When
the Maintenance limit is reached, stop without marking an unfinished tactic accomplished.

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
