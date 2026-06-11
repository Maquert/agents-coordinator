# Agent Task-Lock Protocol

Before picking any task, every agent must consult `~/.agents/tasks/` to avoid collisions with agents running in parallel (Claude, Codex, Gemini, or any other). This directory acts as a lightweight distributed lock: one file per in-flight task.

## Lock file location and naming

- Directory: `~/.agents/tasks/`
- Filename: `<task-id>.md` — the task id alone, no prefix, no suffix other than `.md`.

## Lock file template

```markdown
---
task_id: <task-id>
task_name: <human-readable task title>
status: <wip | finished | blocked>
project: <repository name>
branch: <git branch name>
worktree: <absolute path to the worktree, or "main" if working in the main checkout>
last_updated: <HH:MM DD/MM/YYYY>
agent: <agent identity, e.g. claude, codex, gemini>
---
```

## Claim rules

1. Before selecting a task, list all files under `~/.agents/tasks/`. Any task id present there is already claimed — skip it.
2. Immediately after selecting a task, write the lock file with `status: wip` and the current timestamp. Do this **before** touching any code.
3. Update `last_updated` whenever the task status changes (e.g. moving from wip to blocked).
4. When the task reaches `finished` **and** the branch is merged into main, **delete** the lock file. A finished task must not remain in `~/.agents/tasks/`.
5. If the agent is blocked and stops, set `status: blocked` in the lock file and leave it — do not delete it. Another agent will see it and skip the task.
6. Never delete a lock file that belongs to a different agent unless explicitly instructed by the user.

## Lock file lifecycle summary

```
[task selected] → write lock (status: wip)
                → [work in progress] → update last_updated as needed
                → [task finished + merged] → DELETE lock file
                → [task blocked] → update status: blocked, leave file
```
