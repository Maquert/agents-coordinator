Use the `backlog-task-intake` skill.

- Read backlog items from `tasks/intake.md`.
- Generate each task ID as the current Unix epoch second (`date +%s`). When multiple tasks are created in the same batch, increment by 1 for each subsequent task so IDs stay unique and ordered.
- If an intake item already carries a pre-assigned ID via `(id: <epoch>)`, use that ID for the task file instead of generating a new one.
- Create new task detail files using the repository task rules from `AGENTS.md`.
- New tasks must start in `tasks/pending/`.
- Every new task must be assigned a canonical branch slug during intake, stored in the task file without an agent prefix.
- Format branch slugs as lowercase words joined by underscores, for example `increase_padding`.
- Agents will turn that stored value into the concrete git branch `<agent>/<slug>`, for example `claude/increase_padding` or `codex/increase_padding`.
- De-duplicate against existing task detail files.
- Remove each source item from `tasks/intake.md` only after successful task creation or confirmed duplication.
- Leave ambiguous or unprocessable items in `tasks/intake.md` and report the blocker.
- Do not implement any task.
- Once a task is created, remove it from `tasks/intake.md` (do not leave it as marked).
- Commit the changes.

Output expectations:
- Briefly list created task ids and titles.
- Briefly list skipped duplicates.
- Briefly list any items left in `tasks/intake.md` with the reason.
