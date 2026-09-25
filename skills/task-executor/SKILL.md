---
name: task-executor
description: Execute implementation-ready Ecelyo tasks end-to-end with explicit validation, pull-request gates, cleanup, and live task-state synchronization.
---

# Task Executor

This is the canonical execution skill for one Ecelyo task per run. Ecelyo is the only task store:
select, claim, update, and close work through the live server. Do not create local task records,
lock files, or mirrored workflow state.

Whenever communicating with the human during execution—including clarification, progress, review,
blocker, or closeout messages—also load and use `task-manager-assistant`. Every such message must
identify the task by title and ID plus its project and tactic names and IDs, include direct artifact
links and inline visuals when relevant, and make the requested decision or next action explicit.
If any required gate enters or may enter a blocked state, activate `task-manager-assistant`
immediately, before reporting the blocker or requesting a decision.

## Readiness

Before editing, verify `GET /` and read `GET /tasks/{id}`. Use the task's goal, non-goals, affected
surfaces, constraints, dependencies, validation plan, and `acceptanceCriteria` as the execution
contract. If criteria are missing, analyze the task and create a small set of agent-proposed criteria
through Ecelyo, then tell the human what was added. If criteria or other details are materially
ambiguous, ask a targeted question with a proposed default while continuing safe, reversible
investigation; pause only when the ambiguity is a real scope, permission, or irreversible-action
gate.

## Parent-task prerequisite

Before claiming or starting a task, inspect its `parentIds` and read each parent task from Ecelyo. A task with no parents is eligible under this gate. If it has parents, every parent must have state `finished` before the child may be claimed or work may begin. If any parent is unfinished, blocked, missing, or its state cannot be verified, do not claim or reassign the child, set it to `wip`, create its worktree, or begin implementation; choose another ready task or wait for the prerequisite to finish. Recheck this gate immediately before claiming so a stale task listing cannot bypass it.

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

## Project and task-state gates

- Never claim or start a task belonging to a project whose name contains the word `IceBox` (case-insensitive). Exclude those tasks from selection and do not set them to `wip`.
- Use `blocked` only when the agent genuinely cannot proceed because of a concrete execution blocker, such as an inconvenient external constraint, a source-code conflict, an impossible or contradictory requirement, an unavailable dependency or access requirement, or another condition that requires resolution outside the agent's current control.
- When a task is genuinely blocked, update its Ecelyo description with a clear Markdown `## Blocker` section before or together with the state update. Record the concrete reason, relevant evidence, and the smallest required resolution; do not only write the reason in a progress message.
- Human review is not a blocker. When the work is ready for a person to inspect, approve, or decide, use the Ecelyo state `in review` and describe the requested review or decision. Do not use `blocked` merely because human review is required.

## Stale tactics and tasks

A tactic or task is **stale** when:
1. It is not finished or closed (i.e. not in `finished`, `accomplished`, `archived`, or `closed` status/state); and
2. Its last update timestamp (`updatedAt`, or `createdAt` if never updated) was **2 days ago or more** relative to current time.

### Handling stale items

- **Stale tactics**: Unfinished tactics with no updates for 2 days or more indicate stalled initiatives, stranded worktrees, or obsolete goals. When auditing or selecting tactics, inspect stale tactics to verify whether they should be resumed, rescoped, marked `finished`, or archived by the human owner.
- **Stale tasks**: Unfinished tasks with no activity for 2 days or more (e.g. abandoned `wip` or `pending` tasks without active agent sessions) should be reviewed for stale premises before execution.
- **Verification before resumption**: Before claiming, resuming, or building upon a stale tactic or task, verify that its prerequisites, acceptance criteria, and target code remain valid against the latest `main` branch.


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
thread-title operation:
- In **Codex**: use Codex's thread-title tool.
- In **Antigravity**: update the `title` field in `~/.gemini/antigravity/annotations/<conversation-id>.pbtxt`.
- In **Claude**: update the session title via platform tooling when available.

This display title is separate from the Ecelyo `deeplinkUrl`, which must still point to the live
conversation in the task's `wip` update (e.g. `antigravity://conversations/<conversation-id>`,
`codex://threads/<thread-id>`, or `claude://agents/<agent-id>`). If the title cannot be changed,
report that limitation before execution rather than silently using a misleading title.

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
  "deeplinkUrl": "antigravity://conversations/<conversation-id>",
  "agentTechnology": "Antigravity"
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
then update Ecelyo with `PATCH /tasks/{id} {"state":"finished"}`. If a genuine execution blocker
prevents completion, update the task description with the blocker reason and set its state to
`blocked`; do not claim completion. If only human inspection, approval, or a decision remains, set
the state to `in review` instead of `blocked`.

The final response must include task title and ID, project, tactic, branch, validation, pull request
URL and state, cleanup result, acceptance-criteria result, and an unambiguous task status. Report
`**BLOCKED**` only for a genuine execution blocker, including its owner and required next action;
when human review is the only remaining gate, report `**IN REVIEW**` and use Ecelyo state `in review`.
Use `task-manager-assistant` to make that closeout human-readable: include direct links to relevant
files or review artifacts, show useful renders or screenshots inline when possible, and mark an
unresolved execution blocker as `**BLOCKED**` with its owner and required next action.

When a tactic reaches its completed (`finished`) state, also include a clearly labeled tactic
completion summary. Agents mark a completed tactic as `finished` using
`PATCH /tactics/{id} {"status":"finished"}`; agents are explicitly forbidden from accomplishing,
closing, or archiving tactics, which remain human-owned lifecycle actions. A finished current-week
Maintenance tactic may be reopened or reused when additional work arrives during the same week.
The summary must contain a Markdown table with the tactic name and every task the agent worked on
whose final state is `finished` or `blocked`, plus each task's state and its pull-request URL/state
(`N/A` when no pull request exists). After the table, identify any remaining unresolved tasks or
gates so the human can see what is left. End with a brief, short summary of what was completed and
what remains; explicitly say when nothing remains.

## Batch mode

For an explicitly requested batch, execute tasks sequentially. Refresh Ecelyo after each completion,
never pre-claim the batch, and stop when a task is unavailable, blocked, fails validation, or cannot
complete its delivery and cleanup gates.
