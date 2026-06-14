Use the `backlog-task-execution` skill.
If screenshot verification fails only because affected baselines are stale, rerun the relevant screenshot record workflow, update the references, rerun verification, and continue the task instead of marking it blocked.
Prefer the narrowest dedicated snapshot or screenshot test that covers the changed surface before broader suites.
If the repository exposes one canonical script to refresh all definitive screenshot baselines, use that script when the task needs a full multi-platform baseline refresh.

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

Pre-work:
- Pull from the main branch before creating any worktree.
