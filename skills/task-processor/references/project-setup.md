# Minimal Project Setup

Use this reference when a repository wants to adopt the backlog skills (`backlog-task-intake` and `backlog-task-execution`) with the default file layout.

## Baseline Layout

The backlog skills work best when the repository exposes a lightweight task lifecycle under `tasks/`:

```text
tasks/
  intake.md
  tasks.md
  task_assets/                        ← shared image assets for all tasks
  {project_id}-{project-name}/        ← one directory per project
    tactics/
      {tactic_id}-{tactic-name}.md   ← one file per tactic
    pending/
    wip/
    blocked/
    finished/
```

Recommended supporting files:

- `AGENTS.md`: Repository-specific task rules, formatting, validation, and git expectations
- `scripts/run_unit_tests_ci.sh`: Default validation command for cleanup or task completion when the repo uses one
- `references/intake-template.md`: Seed template to copy when `tasks/intake.md` does not exist yet
- `references/tasks-index-template.md`: Seed template to copy when `tasks/tasks.md` does not exist yet

## File Roles

- `tasks/intake.md`: Raw backlog intake items, usually a checklist or plain bullet list. If the file is missing, create it from `references/intake-template.md`.
- `tasks/tasks.md`: Human-readable backlog index used for duplicate checks and backlog visibility. If the file is missing, create it from `references/tasks-index-template.md`.
- `tasks/task_assets/`: Shared image assets for all tasks, named `{task_id}_{task_slug}_{sequence}.png`.
- `tasks/{project_id}-{project-name}/`: Project directory. Contains lifecycle subdirectories and a `tactics/` folder.
- `tasks/{project_id}-{project-name}/tactics/{tactic_id}-{tactic-name}.md`: Tactic file describing a group of related tasks within a project.
- `tasks/{project_id}-{project-name}/pending/`: Task detail files that are ready to be started.
- `tasks/{project_id}-{project-name}/wip/`: Task detail files currently being executed.
- `tasks/{project_id}-{project-name}/blocked/`: Task detail files waiting on an external dependency or decision.
- `tasks/{project_id}-{project-name}/finished/`: Completed task detail files with brief notes about what was done.

## Minimal Task File Shape

The backlog skills do not require one exact template, but WIP-capable task files should be able to hold:

- Task title
- Short summary
- Acceptance criteria
- Constraints or dependencies
- Current status
- Project id (`project:` field) — **required**
- Tactic id (`tactic:` field) — **required**
- Branch ownership, typically a `branch:` field
- Completion notes or blocker notes
- Optional task dependency metadata, typically a `depends on:` field when one task must wait on another

Front matter is recommended because it makes branch ownership, project, tactic, and status extraction easier and more consistent.

Example front matter header:

```yaml
---
id: TASK-123
title: Example task
status: pending
priority: Medium
project: 1781617286
tactic: 1781617300
branch: feat/task-123
depends on: TASK-101
---
```

Treat `depends on:` as optional. Use it only when the task is blocked on another task, issue, or equivalent tracked dependency. `project` and `tactic` are always required.

## When The Repository Is Not Ready

If one of these structures is missing, the automation should stop and explain:

1. Which path is missing
2. Which skill or mode requires it
3. Whether the user should create the baseline structure or remap the automation to existing paths

Use `references/path-mapping.md` for non-standard repositories.
