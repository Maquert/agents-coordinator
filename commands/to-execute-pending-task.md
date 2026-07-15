Use the `task-executor` skill.
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

Lylat deeplink requirement:
- When taking a task and moving it to `wip` through the Lylat local server (see the `lylat-local-server` skill), set the task's `deeplinkUrl` field in the same `PATCH /tasks/{id}` call — do not send `{"state":"wip"}` alone.
- `deeplinkUrl` must be the URL that reopens the live agent conversation/thread doing the work, e.g. `codex://threads/<thread-id>` for Codex or `claude://agents/<session-id>` for Claude — never the app's own `lylat://open/...` navigation URL.
- Example: `curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" -H 'Content-Type: application/json' -d '{"state":"wip","deeplinkUrl":"codex://threads/<thread-id>"}'`.
- If the session/thread id is not yet known when the task is taken, set `deeplinkUrl` as soon as it is available with a follow-up `PATCH /tasks/{id} {"deeplinkUrl":"..."}` before continuing further work on the task.
