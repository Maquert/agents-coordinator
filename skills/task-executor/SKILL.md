---
name: task-executor
description: Execute implementation-ready Ecelyo tasks end-to-end with explicit validation, pull-request gates, cleanup, and live task-state synchronization.
---

# Task Executor

This is the canonical execution skill for one Ecelyo task per run. Ecelyo is the only task store:
select, claim, update, and close work through the live server. Do not create local task records,
lock files, or mirrored workflow state.

## Readiness

Before editing, verify `GET /` and read `GET /tasks/{id}`. Use the task's goal, non-goals, affected
surfaces, constraints, dependencies, validation plan, and `acceptanceCriteria` as the execution
contract. If criteria are missing or materially ambiguous, add clear criteria through Ecelyo or
stop and ask the user.

Right before starting work, present:

| Field | Value |
| --- | --- |
| ID | Task ID |
| Name | Task title |
| Project | Project name and ID |
| Tactic | Tactic name and ID |

## Selection and ownership

Use `GET /tasks/priority` when the user asks for the next task. Follow Ecelyo's priority order and
completion-first tactic selection. A `wip` task belongs to another agent unless the user explicitly
reassigns it. Keep one task in progress per agent.

## Thread naming

Rename the live agent thread as soon as the execution unit is resolved and before beginning any
editing, worktree creation, or code execution. Use the exact project, tactic, and current task names
stored in Ecelyo. The base title format is:

```text
[Project name] (Tactic name) Current task name
```

Prefix the base title with the execution state. Apply the corresponding title immediately when the
Ecelyo state changes:

- `> ` — the thread is active and the task is being executed (`wip`);
- `X ` — the task is blocked (`blocked`); and
- `= ` — the task is finished (`finished`).

At the start of work, once the task is claimed, use the active form:

```text
> [Project name] (Tactic name) Current task name
```

For a tactic-level execution thread, use only the project and tactic names. When the instruction is
to complete an entire tactic, or when no specific task has been selected yet, use this compact title
and keep it for the whole tactic run while processing child tasks sequentially:

```text
> [Project name] (Tactic name)
```

Do not append `Complete tactic`, a child-task name, an ID, or another suffix to a tactic-level title.
Task-level threads continue to use the current task name after the tactic name.

Do not add agent prefixes, IDs, or additional status labels. Use the active agent platform's
thread-title operation (for example, Codex's thread-title tool). This display title is separate
from the Ecelyo `deeplinkUrl`, which must still point to the live conversation in the task's `wip`
update. If the title cannot be changed, report that limitation before execution rather than
silently using a misleading title.

Examples:

```text
> [Papiplan] (Test-Host Crash Regression Fix) Fix PapiplanApp compile break and test-host persistence crash
X [Papiplan] (Test-Host Crash Regression Fix) Fix PapiplanApp compile break and test-host persistence crash
= [Papiplan] (Test-Host Crash Regression Fix) Fix PapiplanApp compile break and test-host persistence crash
```

Before editing, update the selected task in one request:

```json
{
  "state": "wip",
  "deeplinkUrl": "codex://threads/<thread-id>",
  "agentTechnology": "Codex"
}
```

Use the actual agent identity and conversation URL. Never substitute an app-navigation URL.

## Execution

1. Confirm the destination project and tactic are active and that the task fits the tactic goal.
2. Resolve the assigned canonical branch slug and use a dedicated non-main worktree.
3. Read only the named source, tests, scripts, and specifications needed for the task.
4. Implement within scope and preserve unrelated user changes.
5. Run the narrowest sufficient validation first, then the required project gate.
6. Verify every acceptance criterion with concrete evidence.

## Pull request and closeout

Default delivery is one focused commit and one pull request per task. Push the task branch, inspect
all review comments, address actionable feedback, and merge according to priority and project policy.
Do not mark a task finished merely because code or a pull request exists.

After merge, remove the dedicated worktree and associated branches when permitted, verify cleanup,
then update Ecelyo with `PATCH /tasks/{id} {"state":"finished"}`. If blocked, preserve the accurate
active state and record the blocker in Ecelyo; do not claim completion.

The final response must include task title and ID, project, tactic, branch, validation, pull request
URL and state, cleanup result, acceptance-criteria result, and an unambiguous task status.

When a tactic reaches its completed (`accomplished`) state, also include a clearly labeled tactic
completion summary. The summary must contain a Markdown table with the tactic name and every task
the agent worked on whose final state is `finished` or `blocked`, plus each task's state and its
pull-request URL/state (`N/A` when no pull request exists). After the table, identify any remaining
unresolved tasks or gates so the human can see what is left. End with a brief, short summary of what
was completed and what remains; explicitly say when nothing remains.

## Batch mode

For an explicitly requested batch, execute tasks sequentially. Refresh Ecelyo after each completion,
never pre-claim the batch, and stop when a task is unavailable, blocked, fails validation, or cannot
complete its delivery and cleanup gates.
