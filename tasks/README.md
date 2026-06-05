# Task Locks

This directory coordinates parallel agent work so multiple agents do not claim or execute the same task at the same time.

Each `*.md` file is a lightweight lock for one claimed task. The files here are operational state, not repository backlog records.

## What the files mean

- One file per claimed task.
- Filename format: `<task-id>.md`.
- Typical statuses: `wip`, `blocked`, or `finished`.
- The file body is frontmatter that records the task id, human title, project, branch, worktree, timestamp, and agent identity.

Example shape:

```md
---
task_id: 1779573002
task_name: Show mission status as an icon on cards
status: wip
project: lylat_app
branch: claude/1779573002-mission-status-icon-on-cards
worktree: /absolute/path/to/worktree
last_updated: 00:05 06/06/2026
agent: claude
---
```

## How it is used

- Before starting work, an agent checks this directory for an existing task id.
- If the task is unclaimed, the agent creates a lock file here before editing code.
- If the task is blocked, the lock file stays and its status is updated.
- If the task is finished and merged, the lock file should be deleted.

## Important distinction

This directory is separate from a repository's own `tasks/pending/`, `tasks/wip/`, or `tasks/finished/` workflow. Those are project task records. This directory is only the cross-agent coordination layer for active claims.
