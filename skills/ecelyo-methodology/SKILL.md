---
name: ecelyo-methodology
description: Apply the Ecelyo way of work as a task-system philosophy. Use when agents or humans need guidance on how to select work, structure tactics, prioritize completion, limit work in progress, keep archived projects and tactics closed to new work, and coordinate execution through Ecelyo. Ecelyo is the sole system of record — repository `tasks/` files are a deprecated legacy workflow. Use together with `ecelyo-local-server` when actual task state must be read or updated.
---

# Ecelyo Methodology

Use this skill when the task is not only about calling the Ecelyo server, but about following the Ecelyo way of work.

This skill defines the working philosophy.
The companion skill `ecelyo-local-server` defines how to connect to the server and update live task state.

If the workflow requires reading or mutating task state, load `ecelyo-local-server` as well.

## Core Idea

Ecelyo is a completion-first task system.

The point is not to accumulate tasks in progress.
The point is to keep tactics coherent, move work visibly, and finish things.

## Mandatory Rules

1. Ecelyo, meaning the Ecelyo system and its board wherever it is surfaced, is the **sole** source of truth for tracked work. Repository `tasks/` files (`tasks/pending/`, `tasks/wip/`, `tasks/blocked/`, `tasks/finished/`) are a deprecated legacy workflow, not a parallel or backup record. Do not create, move, or edit `tasks/` files as part of Ecelyo-backed work — not to mirror state, not as a progress note — even if a repository's own `AGENTS.md`/`CLAUDE.md` describes a `tasks/` system as "the tracked project record." Treat that as stale, pre-Ecelyo documentation and flag the conflict to the user rather than following it. Only touch `tasks/` files when the user explicitly asks for that legacy workflow in the current conversation.
2. No task work may proceed without a working Ecelyo server connection. If the server is down, stop and ask the user to start it — do not fall back to `tasks/` files as a substitute.
3. Tactics must share one common goal and move toward one common end task.
4. Tactics are not buckets. When work does not share that goal or end task, create a new tactic instead of adding clutter.
5. Scoped tactics are better than massive tactics. When in doubt, create a new tactic.
6. Completion beats parallelism. Agents should prefer finishing work over opening more work.
7. An agent must not hold two tasks in progress at the same time as a normal working state.
8. If an agent already has more than one task in progress, its main priority is to find the simplest and quickest one to finish, finish it, and only then continue with another one.
9. When choosing between several valid next steps, prefer the one that reduces WIP and increases clarity.
10. Task state must be updated promptly when reality changes so the system stays trustworthy.
11. Every Ecelyo task must have an explicit `agentRole`; do not leave task ownership semantics implicit.
12. Archived projects and archived tactics must never receive new tasks. Before creating or reassigning a task, verify that both destination containers are not archived. Do not silently reactivate an archived project or tactic to make an assignment fit.

## Work Selection

When selecting work:

- prefer work in this order:
  1. critical-priority tasks
  2. blocked tasks: either finish the blocking task or create a new task to unblock it and make that new task the parent task
  3. in-progress tasks not currently claimed by anyone
  4. pending tasks by priority
  5. trivial tasks or maintenance work
- check whether the agent already owns a `wip` task before starting a new one
- if more than one task is already `wip` for the same agent, stop selecting new work and finish the quickest one first
- do not start a second task merely because it looks interesting or important if another task can be finished now
- when creating tasks, choose an `agentRole` that reflects the kind of work the task is for, not just who happened to create it
- before creating or reassigning a task, read the destination project and tactic status; reject the assignment if either one is archived

Preferred role defaults:

- `Product Manager`: create or refine tasks
- `Developer`: code execution
- `QA`: validation and verification, with fixes only when needed
- `Localization Team`: wording, semantics, and internationalization-related work
- `Product Designer`: visual descriptions, assets, icons, and aesthetic refinement

Create a custom role when these do not fit, but never leave `agentRole` empty.

## Tactic Design

A good tactic should have:

- a clear beginning
- a coherent middle
- a visible end

Typical tactic shape:

- first task: define scope, establish the base, or remove the main blocker
- middle tasks: execute the coherent body of work
- last task: integrate, verify, clean up, or explicitly close the tactic

Create a new tactic when:

- the new task does not share the same goal
- the new task does not contribute to the same end task
- the only reason to keep it in the current tactic would be convenience
- the current tactic would become bloated or harder to finish coherently

### Archived Project And Tactic Guard

Treat archived projects and tactics as closed historical records.

- Never create a task in an archived project or archived tactic.
- Never reassign an existing task into an archived project or archived tactic.
- Verify both destination statuses immediately before task creation or reassignment; do not rely on stale context.
- If the intended destination is archived, select another active destination only when it shares the same goal and tactical arc.
- Otherwise create a new appropriately scoped active project or tactic when authorized, or ask the user where the task belongs.
- Do not unarchive a project or tactic unless the user explicitly requests reactivation as a separate action.

## Agent Behavior

Agents following Ecelyo should:

- optimize for fewer open loops
- keep task state honest
- avoid speculative WIP
- make progress legible through tactic structure
- stop immediately when Ecelyo connectivity is unavailable

Agents should not:

- keep multiple tasks open just to feel busy
- turn tactics into miscellaneous holding areas
- hide blockers by leaving stale `wip` tasks behind
- continue task work after Ecelyo synchronization fails

## Relationship To `ecelyo-local-server`

Use `ecelyo-methodology` to decide:

- what kind of work to start
- whether to reuse or create a tactic
- whether WIP should be reduced before anything else
- how to prioritize completion
- whether the destination project and tactic are active and eligible to receive work

Use `ecelyo-local-server` to:

- verify connectivity
- read systems, projects, tactics, and tasks
- inspect the active priority queue
- update task state and assignment

## Initial Rule Draft

Use this draft as the starting point for refining the Ecelyo methodology with the user:

1. Ecelyo, meaning the Ecelyo system and its board, is the sole source of truth for important tracked work. Repository `tasks/` files are a deprecated legacy workflow, not a valid substitute or mirror.
2. No Ecelyo connection, no task work — and no falling back to `tasks/` files instead.
3. Completion is more important than new starts, and work should be prioritized in this order: critical tasks, blocked-task resolution, unclaimed in-progress tasks, pending tasks by priority, then trivial or maintenance work.
4. One agent should normally own only one `wip` task at a time.
5. Tactics must stay coherent.
6. New tactics are better than messy tactics.
7. Every tactic should share one end task and one goal.
8. Task state must be updated immediately when reality changes.
9. Scoped tactics are better than massive tactics.
10. Every task needs an explicit `agentRole`.
11. Archived projects and tactics are closed records: never create or reassign tasks into them, and never reactivate them implicitly.
