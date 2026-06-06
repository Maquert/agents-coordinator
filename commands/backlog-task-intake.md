Use the `software-backlog-workflow` skill in `backlog-task-intake` mode.

- Read backlog items from `tasks/intake.md`.
- Create new task detail files using the repository task rules from `AGENTS.md`.
- New tasks must start in `tasks/pending/`.
- Update `tasks/tasks.md` as the backlog index, preserving source order.
- De-duplicate against existing task detail files and `tasks/tasks.md`.
- Remove each source item from `tasks/intake.md` only after successful task creation or confirmed duplication.
- Leave ambiguous or unprocessable items in `tasks/intake.md` and report the blocker.
- Do not implement any task.
- Once a task is created, remove it from `tasks/intake.md` (do not leave it as marked).
- Commit the changes.

Output expectations:
- Briefly list created task ids and titles.
- Briefly list skipped duplicates.
- Briefly list any items left in `tasks/intake.md` with the reason.
- `tasks/tasks.md` should be modified, gitignored but kept on disk with all the changes.
