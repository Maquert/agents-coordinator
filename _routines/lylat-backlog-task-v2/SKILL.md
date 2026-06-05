---
name: lylat-backlog-task-v2
description: Lylat - Backlog task v2. Runs the software-backlog-workflow skill in pending-task-execution mode for the Lylat app repository.
---

Use the `software-backlog-workflow` skill.

Mode: `pending-task-execution`.

Repository paths:
- Pending tasks: `tasks/pending/`
- WIP tasks: `tasks/wip/`
- Finished tasks: `tasks/finished/`
- Blocked tasks: `tasks/blocked/`

Repository override:
- When a task has no assigned branch name, invent one with the prefix `codex/`.
