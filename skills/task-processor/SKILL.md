---
name: task-processor
description: "Capture raw requests as implementation-ready Ecelyo backlog tasks without implementing them. Use when a prompt starts with 'New task:' or when the user explicitly requests backlog intake."
---

# Task Processor

Use this skill for backlog intake only. Do not implement the captured work in the same turn unless
the user explicitly requests both intake and implementation.

Ecelyo is the only task store. Read and write projects, tactics, tasks, and acceptance criteria
through the live Ecelyo server. Do not create a parallel local task record or repository mirror.

## New task prompt

When the first non-whitespace text is `New task:` (case-insensitive):

1. Remove only the prefix and treat the remainder as the raw task.
2. Normalize the request into a concise title.
3. Check Ecelyo for an equivalent existing task before creating a duplicate.
4. Resolve an active project and tactic. Infer them only when the context makes the assignment reliable; otherwise ask the user.
5. Create the task in Ecelyo with state `pending`, an explicit branch slug, an explicit priority, an explicit `agentRole`, and a due date.
6. Add every acceptance criterion through Ecelyo's acceptance-criteria endpoint.
7. Stop after intake; do not begin execution.

## Direct intake

For any explicit backlog-intake request:

1. Verify Ecelyo connectivity with `GET /`.
2. Read systems, projects, tactics, and the relevant task queue before assigning work.
3. Check the destination project and tactic are active and that the task fits the tactic's persisted goal.
4. If the user requests a new project or tactic, create it in Ecelyo under the active system with a clear title and objective.
5. Assign every created task a due date based on the intake batch size: use the current calendar date plus 2 calendar days when the batch contains fewer than 5 tasks; for batches of 5 or more, use plus 3 calendar days by default and plus 4 calendar days when the batch is exceptionally large or needs additional coordination. Store the resulting date explicitly as an ISO-8601 `dueDate` value when creating the task.
6. Write a Markdown task description containing:
   - Goal and non-goals
   - Current and desired behavior
   - Affected files, modules, APIs, or UI surfaces
   - Constraints and compatibility requirements
   - Dependencies and ordering
   - Validation plan
   - The same numbered acceptance criteria stored in Ecelyo
7. Create one Ecelyo acceptance-criteria record per numbered criterion with `POST /tasks/{taskId}/acceptance-criteria` and `{"text":"..."}`.
8. Use `Trivial` when no priority is supplied and no stronger project rule applies.
9. Use an agent role that reflects the captured work, such as `Product Manager`, `Developer`, `QA`, `Localization Team`, or `Product Designer`.
10. Report the created project, tactic, task, priority, role, branch slug, due date, and acceptance-criteria count.

## Required task contract

Every task must have an active project and tactic, a non-empty goal, an explicit role, a canonical
lowercase underscore branch slug without an agent prefix, an explicit due date, and testable
acceptance criteria. Use
`Unknown` or `TBD` only when the source genuinely does not provide the information. If a missing
detail would materially change implementation or validation, ask instead of guessing.

Keep tactic structure coherent. Link task relationships only when they represent a real prerequisite
or ordering constraint, and keep one clear starting point and one clear completion point when the
tactic contains multiple tasks.

## Output

Report:

- Created project and tactic, including their Ecelyo IDs
- Created task title and Ecelyo ID
- Priority, role, branch slug, and acceptance-criteria count
- Any skipped duplicate or blocker

Do not modify product code during intake.
