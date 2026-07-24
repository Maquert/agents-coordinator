---
name: task-batch-executor
description: Execute several backlog tasks end-to-end in strict sequence, with one worktree, branch, validation cycle, pull request, merge, and task-state update per task. Use when the user asks an agent to take a batch, ordered list, or specified number of backlog tasks and requires each task to be completed and merged before the next task starts.
---

# Task Batch Executor

Execute a bounded batch without parallelizing or pre-claiming tasks. Treat every task as a full
`task-executor` run and treat a successful merge as the gate for starting the next task.

Before starting, load and apply:

- `ecelyo-methodology` for completion-first ordering and WIP limits.
- `ecelyo-local-server` for connectivity, task selection, and live state updates.
- `task-executor` for the per-task worktree, branch, validation, commit, PR, merge, lock, and
  recovery lifecycle.

When their instructions conflict, preserve these batch invariants:

1. Hold at most one task in progress.
2. Do not start the next task until the current task is merged and marked `finished`.
3. Stop the batch when the current task cannot be completed, validated, or merged.

Every task is gated on an implementation-ready record. Before claiming it, confirm the task has
technical context (current/desired behavior, affected surfaces, constraints, dependencies, and a
validation plan) plus numbered acceptance criteria. In Ecelyo, the criteria are the task's
`acceptanceCriteria` property; the executor must check every item, not infer completion from a
green build alone. If the record is missing or ambiguous, stop at that task and report the gap.

## Resolve The Batch

Require a repository path and either:

- an ordered list of task identifiers; preserve the user's order, or
- a batch size; default to 5 when omitted and select one task at a time from Ecelyo's current
  priority queue.

Do not snapshot, reserve, or lock the entire batch. When selecting by priority, refresh
`GET /tasks/priority` after every completed task because merging may change the queue or make later
work obsolete.

Use Ecelyo as the default source of truth. Only use or mutate repository `tasks/` lifecycle files
when the current user request explicitly opts into that legacy file workflow. In legacy mode, keep
the Ecelyo record synchronized as required by the project instructions.

Before the first task, verify:

- the Ecelyo server is reachable;
- the target repository and its instructions are available;
- the integration branch and remote can support the required PR-and-merge workflow;
- the requested tasks belong to the target repository; and
- no current task is already claimed by another agent.

If any prerequisite fails, stop before claiming a task.

## Sequential Execution Loop

Repeat until the requested number of tasks has merged.

### 1. Select One Task

For an explicit list, resolve only its next identifier. For a priority batch, query the live queue
and take only its top eligible pending task. Never skip an explicitly ordered task.

Check the task lock and current server state immediately before claiming it. Treat a task in `wip`
or locked by another agent as unavailable. If the next explicit task is unavailable, stop; if a
priority-selected candidate is unavailable, refresh the queue and select the next eligible task.

### 2. Claim One Task

Create only the current task's lock. Move the Ecelyo task to `wip` while setting both the live
conversation `deeplinkUrl` and the actual `agentTechnology` in the same update.

Apply the `task-executor` branch rules:

- use the task's assigned canonical branch slug;
- create the concrete `<actual-agent>/<slug>` branch from an up-to-date integration branch;
- work in a dedicated task worktree, never the main checkout; and
- keep one task mapped to one branch and one pull request.

### 3. Execute And Validate

Implement only the current task. Follow its technical context and validation plan. Use the narrowest sufficient validation first, then run every
repository-required merge check before pushing. If the repository provides
`./scripts/xcode/run_unit_tests_ci.sh` for the applicable Xcode project, run it before pushing.

If screenshot or snapshot validation fails, immediately load `screenshot-test-troubleshooter` and
classify the failure before changing code or recording baselines. Record new baselines only when
the rendered result is verified and the change is intentional.

Do not begin another task while validation, review fixes, or conflict resolution is in progress.

### 4. Deliver And Merge

Commit only current-task changes, push its branch, and create or update its single pull request.
Resolve conflicts with the latest integration branch and rerun affected validation before merge.

Apply the repository's review and merge policy. The batch request authorizes normal agent merges,
but it does not override a rule requiring human review. If policy, required review, failing checks,
or repository protection prevents merge, leave the task in its accurate active/review state and
stop the batch.

Do not count an open pull request as completed. Verify that the pull request is actually merged.

### 5. Close Before Continuing

Only after merge succeeds, apply the `task-executor` completion and cleanup gate:

1. confirm acceptance criteria and the task worktree are clean;
2. complete any explicitly requested legacy task-file lifecycle update inside the task worktree;
3. remove the dedicated task worktree from a different checkout;
4. delete the associated local branch and remote branch (unless already removed or protected);
5. verify the worktree and branch refs are gone;
6. update the Ecelyo task to `finished`;
7. remove the task lock;
8. refresh the integration branch from its remote; and
9. report the merged PR and cleanup before selecting the next task.

The next iteration must start from the integration branch containing the prior task's merge.

## Failure And Stop Rules

Stop at the current task when it is blocked, ambiguous, fails required validation, cannot be
pushed, cannot open or update its PR, or cannot merge. Do not skip forward merely to reach the
requested batch count.

When stopping after changes:

- preserve and commit current-task work on its non-main branch as required by `task-executor`;
- set the task to the accurate `blocked` or review state in Ecelyo;
- retain or update its lock according to the blocking lifecycle;
- report the exact failed gate and PR URL when one exists; and
- report how many tasks merged before the stop.

Never mark a task `finished`, delete its lock, or count it toward the batch until its PR is merged
and its worktree and associated branches are deleted.

## Final Report

Report tasks in execution order with:

- task id and title;
- project and tactic names and ids;
- concrete branch;
- worktree cleanup result;
- validation result;
- acceptance-criteria result for every criterion;
- commit and push status;
- PR URL and merge status; and
- final Ecelyo state.

End with an unambiguous status for every task and for the batch. Use `Task Status: **FINISHED**`
only after the task's PR is merged, its worktree and associated branches are deleted, and Ecelyo
is synchronized. If any gate remains unresolved, use `Task Status: **BLOCKED**`, state the exact
blocker in bold, and do not describe the task as finished. Include `N/A — <reason>` rather than
omitting project, tactic, PR, branch, or worktree fields. Confirm no later task was claimed early.
