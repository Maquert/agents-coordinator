---
name: lylat-local-server
models: gpt-5.4-mini, claude-sonnet-4-6
description: Connect to Lylat's macOS-only local HTTP server to list systems, projects, tactics, tasks, and prioritized active task queues, and to update task state during agent workflows. Use together with task-processor and task-executor when app-side task state should be inspected or synchronized.
---

# Lylat Local Server

Use this skill when Codex needs to communicate with Lylat's local HTTP server over HTTP.
This skill is the app-state bridge for workflows that otherwise use `task-processor`
and `task-executor` for repository task files, branches, locks, validation, and PRs.

Use this skill as the required task-system bridge when Lylat-backed task work is in scope.
No task may proceed when the Lylat server is unreachable.

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
8. Do not fall back to repository `tasks/` workflow when the server is down unless the user explicitly changes the policy.
9. If the server does not respond, stop the task workflow and ask the user to start the server before continuing.
10. Do not invent endpoints. If an endpoint is missing, say so and use the closest supported route.

## Quick Start

1. Check connectivity with `GET /`.
2. Discover systems with `GET /systems`.
3. Narrow to projects or tactics with `GET /projects?systemId=...` and `GET /tactics?...`.
4. Read the active task queue with `GET /tasks/priority` first when selecting work. Use `GET /tasks?...` only when you need a broader list or a task lookup that the priority queue does not answer.
5. Update task state or assignment with `PATCH /tasks/{id}`.

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
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"<project-id>","tacticId":"<tactic-id>"}'
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
- Decide whether the work belongs in an existing tactic or needs a new tactic to keep tactic boundaries coherent.
- When creating a new tactic, make sure the tactic has or will have a clear starting task and a clear final task.
- Run `task-processor` only when the broader workflow still explicitly requires repository task files in addition to Lylat state.
- Only create app-side entities with `POST /projects`, `POST /projects/{projectId}/tactics`, or `POST /tasks` when the user explicitly wants app-state creation too.

### With `task-executor`

Use this pairing when executing an existing task and the app should reflect current progress.

- Read `GET /tasks/priority` first to select the next available task from the active queue.
- Treat `pending` tasks from that queue as available to start and `wip` tasks as already taken by another agent unless the user says otherwise.
- Use `GET /tasks?state=pending` or a narrower filtered query only when you need extra detail outside the grouped priority queue.
- When work starts, mirror app state with `PATCH /tasks/{id} {"state":"wip"}`.
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
