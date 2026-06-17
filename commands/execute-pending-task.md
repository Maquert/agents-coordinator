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
- Do not require any automation-specific PR label such as `codex-automation`.
- If the repository or current task explicitly requires PR labels, follow those local instructions instead of adding automation-default labels.

Pre-work:
- Pull from the main branch before creating any worktree.
