---
name: backlog-task-intake
description: Turn raw backlog intake items into normalized pending task records for a software repository, without implementing them. Use when Codex needs to process a backlog source file such as tasks/intake.md into task detail files with titles, acceptance criteria, priorities, and assigned branch slugs, deduplicating against existing task records.
---

# Backlog Task Intake

Use this skill to convert raw backlog items into normalized task records. Keep each automation prompt short: specify the backlog source file, the task detail destination, the duplicate-check source, and the exact output shape required by the automation.

Task records must carry an assigned branch name from intake onward. Store the canonical branch slug without an agent prefix, for example `branch: increase_padding`. When an agent later starts the task, it will create or use the concrete git branch `<agent>/<branch>`, such as `claude/increase_padding` or `codex/increase_padding`.

If the repository does not already expose the paths or files that the automation expects, stop before making workflow changes and explain how to configure the repository. Use [references/project-setup.md](references/project-setup.md) for the baseline layout and [references/path-mapping.md](references/path-mapping.md) for alternate structures and path overrides.

## Operating Rules

1. Read only the files needed for intake. Avoid broad repo scans.
2. Read the automation memory file first when one is provided and reuse it to avoid duplicate work.
3. Keep edits scoped to intake: do not implement tasks or fix unrelated repository issues.
4. Respect repository instructions from `AGENTS.md` and any task-lifecycle files.

Before executing, verify that the required project structure exists. If it does not:

1. Do not invent hidden assumptions.
2. Report the missing files or directories precisely.
3. Explain the minimum configuration the repository needs.
4. Suggest either creating the baseline structure or updating the automation prompt to map the workflow to the repository's existing paths.
5. Reference the setup guidance so the user can make the repository compatible.

## Required Inputs

- A backlog intake source file
- A task detail destination directory
- A backlog index file or another duplicate-check source
- A task file shape that can store an assigned branch name

If one of those is missing, stop and explain the setup using the references files. Seed missing files from [references/intake-template.md](references/intake-template.md) and [references/tasks-index-template.md](references/tasks-index-template.md) when the user wants the baseline layout.

## Execution Pattern

1. Open the source file and collect unordered list items.
2. Ignore headings, blank lines, and already-processed items.
3. Stop immediately if there are no eligible items.
4. Rewrite each item into a concise task title suitable for a task detail file.
5. Check for duplicates against the existing task detail files and any duplicate-check source named by the caller.
6. For each non-duplicate item, derive a canonical branch slug from the normalized task title.
7. The slug must be lowercase, use underscores between words, and omit any agent prefix. Example: `increase_padding`.
8. Ensure the derived branch slug is unique among existing task records and any duplicate-check source. If needed, append a short deterministic suffix.
9. For each non-duplicate item, create a new pending task record that follows repository task conventions and stores that assigned branch name.
10. Include a short summary, acceptance criteria derived from the source item, constraints, obvious dependencies, and an explicit `priority` field.
11. Use repository-defined task priorities when they exist. If the caller does not provide a priority and the repository has no stronger rule, default new tasks to `Trivial`.
12. When the repository uses front matter for task headers, the task template may also include an optional `depends on:` field to record another task id or reference that must be completed first.
13. Update the backlog index only when the repository still uses one for local convenience; do not require a backlog index when task files are the source of truth.
14. Remove each source item only after the task was created successfully or confirmed as a duplicate.
15. Leave ambiguous or unprocessable items in the source file and report why they were skipped.
16. Do not implement the tasks.

## Default Output

- Created task ids and titles
- Skipped duplicates
- Remaining source items and blockers

## Automation Prompt Contract

Keep automation prompts short and supply only:

- Repository path or current working directory
- Any memory file path
- The backlog source file and task destination paths
- Task id and priority rules that differ from the default
- Any path overrides when the repository does not use the baseline `tasks/` layout
- Required final output or finish message

Do not restate the full workflow in each automation unless the repository has a real exception to this skill.
