---
name: lylat-local-server
models: gpt-5.4-mini, claude-sonnet-4-6
description: Connect to Lylat's macOS-only local HTTP server to list systems, projects, tactics, tasks, and prioritized active task queues, and to update task state during agent workflows. Use together with task-processor and task-executor when app-side task state should be inspected or synchronized.
---

# Lylat Local Server

Use this skill when Codex needs to communicate with Lylat's local HTTP server over HTTP.
This skill is the app-state bridge for workflows that otherwise use `task-processor`
and `task-executor` for repository task files, branches, locks, validation, and PRs.

Do **not** use this skill as a replacement for repository task lifecycle management.
Use it only when the app's in-memory/server-backed state needs to be read or updated.

## When To Use

- Read app-side systems before selecting a workspace or confirming the target system.
- Read app-side projects, tactics, or tasks before intake or execution work.
- Update app-side task state, such as `pending` → `wip` → `finished`, during execution.
- Create app-side projects, tactics, or tasks when the workflow explicitly needs them.
- Verify that the local server is reachable before an automation depends on it.

## macOS Constraint

Lylat's local server is **macOS-only**.

- Expect the server at `http://localhost:{port}` on macOS.
- Do not expect the server to be present on iPhone or iPad.
- If the server is unreachable, report that clearly and continue with file-based task work when possible.

## Shared Rules

1. Prefer the narrowest endpoint that answers the question.
2. Quote URLs in shell commands, especially ones with `?query=params`, to avoid shell globbing issues.
3. Treat server reads as advisory app state by default. If the user explicitly says Lylat is the source of truth, prefer Lylat task state and selection order over local repository lifecycle files.
4. When updating task state through the server, use the API's canonical values:
   - `pending`
   - `wip`
   - `blocked`
   - `finished`
5. If a task is being executed with `task-executor`, keep the repo task file lifecycle, lock file, and git branch rules from that skill. This skill only mirrors app-side state.
6. If a task is being created with `task-processor`, keep project/tactic assignment and task-file creation rules from that skill. This skill can optionally create matching app-side entities only when needed.
7. Do not invent endpoints. If an endpoint is missing, say so and use the closest supported route.

## Quick Start

1. Check connectivity with `GET /`.
2. Discover systems with `GET /systems`.
3. Narrow to projects or tactics with `GET /projects?systemId=...` and `GET /tactics?...`.
4. Read the active task queue with `GET /tasks/priority` first when selecting work. Use `GET /tasks?...` only when you need a broader list or a task lookup that the priority queue does not answer.
5. Update task state with `PATCH /tasks/{id}` when execution starts or finishes.

## Preferred Commands

Use `curl` or the repository's mock client.

### curl

```bash
curl -s "http://localhost:8080/"
curl -s "http://localhost:8080/systems"
curl -s "http://localhost:8080/tasks/priority"
curl -s "http://localhost:8080/tasks?state=pending"
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"state":"wip"}'
```

### mock-agent

When working inside the Lylat repository, you may use:

```bash
swift run --package-path tools/mock-agent mock-agent list-tasks --state pending
swift run --package-path tools/mock-agent mock-agent update-task <task-id> --state wip
```

## Workflow Pairings

### With `task-processor`

Use this pairing when intake should be informed by the currently open app state.

- Read `GET /systems` to find the active or intended system.
- Read `GET /projects` and `GET /tactics` to avoid creating duplicate app-side structures.
- Run `task-processor` to create repository task files.
- Only create app-side entities with `POST /projects`, `POST /projects/{projectId}/tactics`, or `POST /tasks` when the user explicitly wants app-state creation too.

### With `task-executor`

Use this pairing when executing an existing task and the app should reflect current progress.

- Read `GET /tasks/priority` first to select the next available task from the active queue.
- Treat `pending` tasks from that queue as available to start and `wip` tasks as already taken by another agent unless the user says otherwise.
- Use `GET /tasks?state=pending` or a narrower filtered query only when you need extra detail outside the grouped priority queue.
- Run `task-executor` for the repository task workflow.
- When work starts, mirror app state with `PATCH /tasks/{id} {"state":"wip"}`.
- When work completes, mirror app state with `PATCH /tasks/{id} {"state":"finished"}`.
- If blocked, mirror app state with `PATCH /tasks/{id} {"state":"blocked"}` when appropriate.

## Failure Handling

- If `GET /` fails, report the connection error and likely cause: disabled server, wrong port, or non-macOS host.
- If `404 Not Found` occurs, verify the endpoint against the reference file before retrying.
- If a `PATCH` returns `404`, confirm the task ID first with `GET /tasks` or `GET /tasks/{id}`.
- If the app server is unavailable, continue with repository task processing/execution when the main workflow does not strictly depend on app-state synchronization.

## References

Read `references/endpoint-cheatsheet.md` for the endpoint list, payload shapes, and example commands.
