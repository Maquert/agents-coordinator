---
name: lylat-local-server
models: gpt-5.4-mini, claude-sonnet-4-6
description: Connect to Lylat's macOS-only local HTTP server to list systems, projects, tactics, tasks, and prioritized active task queues, and to update task state during agent workflows. Lylat is the sole system of record for task state — repository `tasks/` files are a deprecated legacy workflow (see `task-processor`/`task-executor`) and must not be created as part of normal Lylat-backed task work.
---

# Lylat Local Server

Use this skill when Codex needs to communicate with Lylat's local HTTP server over HTTP.

**Lylat is the sole system of record for task state.** Do not create, move, or edit files under
a repository `tasks/` directory (`tasks/pending/`, `tasks/wip/`, `tasks/blocked/`, `tasks/finished/`,
or any similarly-named lifecycle folder) as part of normal task tracking — not to "mirror" Lylat
state, not as a progress note, and not because a repository's own `AGENTS.md`/`CLAUDE.md` describes
a `tasks/` workflow. That file-based workflow is legacy (`task-processor`, `task-executor`) and is
off by default. If a repository's own instructions still describe `tasks/` as the tracked record,
treat that as stale documentation, not authorization — flag the conflict to the user instead of
following it silently. Only touch `tasks/` files when the user explicitly asks for that legacy
workflow in the current conversation.

Use this skill as the required task-system bridge when Lylat-backed task work is in scope.
No task may proceed when the Lylat server is unreachable.

Prefer TOON when handing repeated Lylat records to another agent or skill.
Use plain JSON when the payload is irregular, deeply nested, or needs to stay close to the raw API response.

## When To Use

- Read app-side systems before selecting a workspace or confirming the target system.
- Read app-side projects, tactics, or tasks before intake or execution work.
- Update app-side task state, such as `pending` → `wip` → `finished`, during execution.
- Reassign existing tasks to another project or tactic without recreating them.
- Create app-side projects, tactics, or tasks when the workflow explicitly needs them.
- Verify that the local server is reachable before an automation depends on it.

## macOS Constraint

Lylat's local server is **macOS-only**.

- Expect the server at `http://localhost:{port}` on macOS.
- Do not expect the server to be present on iPhone or iPad.
- If the server is unreachable, report that clearly as a blocking error and ask the user to start the server.

## Shared Rules

1. Prefer the narrowest endpoint that answers the question.
2. Quote URLs in shell commands, especially ones with `?query=params`, to avoid shell globbing issues.
3. Treat Lylat as the source of truth for task state and task selection when this workflow is active.
4. Treat Lylat as a workflow philosophy, not only a transport. Tactics should stay coherent rather than becoming buckets of unrelated tasks.
5. Reuse an existing tactic when the new task clearly belongs to the same tactical arc. If it does not, prefer creating a new tactic.
6. Each tactic should normally include a meaningful starting task and a meaningful final task that makes tactic completion explicit.
7. When updating task state through the server, use the API's canonical values:
   - `pending`
   - `wip`
   - `blocked`
   - `finished`
8. Never create, move, or edit repository `tasks/` files as part of normal task tracking, even when the Lylat server is unreachable. If the server is down, stop and ask the user to start it (see Failure Handling) — do not fall back to the deprecated `tasks/` workflow unless the user explicitly asks for it in the current conversation.
9. If the server does not respond, stop the task workflow and ask the user to start the server before continuing.
10. Do not invent endpoints. If an endpoint is missing, say so and use the closest supported route.
11. Prefer TOON for normalized arrays of systems, projects, tactics, tasks, or priority-queue entries that will be consumed by an agent.
12. Keep raw JSON when exact response fidelity matters more than token efficiency, such as debugging a server issue or checking unknown fields.
13. **Whenever you move a task to `wip`, set `deeplinkUrl` in the same `PATCH` call** to a link that reopens the live conversation/thread doing the work — `codex://threads/<thread-id>` in Codex, `claude://agents/<session-id>` in Claude, or the equivalent URL scheme for another agent technology. This is required, not optional: it is how a human or another agent can reopen the exact session that took the task. It is distinct from the app's own `lylat://open/...` navigation links, which are computed internally and must never be used as the value here.

## Quick Start

1. Check connectivity with `GET /`.
2. Discover systems with `GET /systems`.
3. Narrow to projects or tactics with `GET /projects?systemId=...` and `GET /tactics?...`.
4. Read the active task queue with `GET /tasks/priority` first when selecting work. Use `GET /tasks?...` only when you need a broader list or a task lookup that the priority queue does not answer.
5. Update task state or assignment with `PATCH /tasks/{id}`.

## Preferred Commands

Use `curl` or the repository's mock client.

## Output Format

Use the API response as the source data, then normalize it to the lightest useful format for the next step.

- Use TOON for repeated records with one stable schema, such as task queues, task search results, projects, or tactics.
- Use compact JSON for irregular payloads, one-off debugging, or when a downstream tool needs the raw response shape.
- If a user explicitly asks for JSON, return JSON instead of TOON.

### TOON Example

```toon
tasks[2]{id,title,priority,state,project,tactic}:
  5718301F-A30D-436A-BA61-85F6E1BA38B2,"Add context menu copy ID actions for projects and tasks",Trivial,pending,"Lylat App",Foundations
  2947CCE5-41CD-46E8-8214-0678A1EC4F74,"Add a copy button beside the task ID",Medium,pending,"Lylat App",Foundations
```

### JSON Example

```json
{"success":true,"data":{"message":"Lylat is ready","version":"1"}}
```

### curl

```bash
curl -s "http://localhost:8080/"
curl -s "http://localhost:8080/systems"
curl -s "http://localhost:8080/tasks/priority"
curl -s "http://localhost:8080/tasks?state=pending"
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"state":"wip","deeplinkUrl":"codex://threads/<thread-id>"}'
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"<project-id>","tacticId":"<tactic-id>"}'
```

When shaping output for another agent, prefer shell-native transforms or `jq` and emit compact TOON instead of verbose prose whenever the result is a repeated list with one schema.

### mock-agent

When working inside the Lylat repository, you may use:

```bash
swift run --package-path tools/mock-agent mock-agent list-tasks --state pending
swift run --package-path tools/mock-agent mock-agent update-task <task-id> --state wip
```

## Workflow Pairings

### With `task-processor`

`task-processor` is a legacy, off-by-default skill for repository `tasks/` files. Do not pair with
it, and do not create `tasks/` files, unless the user has explicitly asked for that legacy workflow
in the current conversation.

Use this skill when intake should be informed by the currently open app state.

- Read `GET /systems` to find the active or intended system.
- Read `GET /projects` and `GET /tactics` to avoid creating duplicate app-side structures.
- Decide whether the work belongs in an existing tactic or needs a new tactic to keep tactic boundaries coherent.
- When creating a new tactic, make sure the tactic has or will have a clear starting task and a clear final task.
- Only create app-side entities with `POST /projects`, `POST /projects/{projectId}/tactics`, or `POST /tasks` when the user explicitly wants app-state creation too.

### With `task-executor`

`task-executor` is a legacy, off-by-default skill for repository `tasks/` files. This pairing name
is historical — when Lylat is in scope, use only the Lylat state transitions below and do not create,
move, or edit `tasks/` files, unless the user has explicitly asked for the legacy file workflow.

Use this pairing when executing an existing task and the app should reflect current progress.

- Read `GET /tasks/priority` first to select the next available task from the active queue.
- Treat `pending` tasks from that queue as available to start and `wip` tasks as already taken by another agent unless the user says otherwise.
- Use `GET /tasks?state=pending` or a narrower filtered query only when you need extra detail outside the grouped priority queue.
- When handing candidate tasks to another agent, prefer a compact TOON list over narrative summaries.
- When work starts, mirror app state with `PATCH /tasks/{id} {"state":"wip","deeplinkUrl":"<your-conversation-url>"}` — set both fields in the same call. Do not move a task to `wip` without also setting `deeplinkUrl` to your own live conversation/thread link.
- When work completes, mirror app state with `PATCH /tasks/{id} {"state":"finished"}`.
- When a pull request is merged, ensure the corresponding Lylat task is also updated to `finished` if it is not already there.
- If blocked, mirror app state with `PATCH /tasks/{id} {"state":"blocked"}` when appropriate.

## Failure Handling

- If `GET /` fails, report the connection error and likely cause: disabled server, wrong port, or non-macOS host.
- If `404 Not Found` occurs, verify the endpoint against the reference file before retrying.
- If a `PATCH` returns `404`, confirm the task ID first with `GET /tasks` or `GET /tasks/{id}`.
- If the app server is unavailable, stop and ask the user to start the server. Do not continue task work without Lylat connectivity.

## References

Read `references/endpoint-cheatsheet.md` for the endpoint list, payload shapes, and example commands.
