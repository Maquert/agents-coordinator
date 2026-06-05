Use the `software-backlog-workflow` skill.

Mode: `pending-task-execution`.

Repository paths:
- Pending tasks: `tasks/pending/`
- WIP tasks: `tasks/wip/`
- Finished tasks: `tasks/finished/`
- Blocked tasks: `tasks/blocked/`

Mention the chosen task at the beginning of the session and mark it with this emoji "💻".

Repository override:
- When a task has no assigned branch name, invent one with the prefix `codex/`.

PR labeling:
- After creating or updating the PR, apply a label that matches the agent identity recorded in the lock file (`agent:` field). For example: if `agent: claude`, apply label `claude`; if `agent: codex`, apply label `codex`.
- If multiple agents worked on the task (detectable from the git log or co-authorship in commits), apply one label per agent.
- Use `gh pr edit <number> --add-label "<agent>"` to apply each label.

