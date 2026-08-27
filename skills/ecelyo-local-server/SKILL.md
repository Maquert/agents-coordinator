---
name: ecelyo-local-server
models: gpt-5.4-mini, claude-sonnet-4-6
description: Connect to Ecelyo's macOS-only local HTTP server to list systems, projects, tactics, tasks, and prioritized active task queues, and to update task state during agent workflows. Ecelyo is the sole system of record for task state.
---

# Ecelyo Local Server

Use this skill when Codex needs to communicate with Ecelyo's local HTTP server over HTTP.

**Ecelyo is the sole system of record for task state.** Do not create local task-record files as a
parallel mirror, progress note, or fallback. If repository instructions disagree with Ecelyo, treat
those instructions as stale and flag the conflict to the user instead of following them silently.

Use this skill as the required task-system bridge when Ecelyo-backed task work is in scope.
No task may proceed when the Ecelyo server is unreachable.

Prefer TOON when handing repeated Ecelyo records to another agent or skill.
Use plain JSON when the payload is irregular, deeply nested, or needs to stay close to the raw API response.

## When To Use

- Read app-side systems before selecting a workspace or confirming the target system.
- Read app-side projects, tactics, or tasks before intake or execution work.
- Update app-side task state, such as `pending` → `wip` → `finished`, during execution.
- Reassign existing tasks to another project or tactic without recreating them.
- Create app-side projects, tactics, or tasks when the workflow explicitly needs them.
- Verify that the local server is reachable before an automation depends on it.
- Ensure every created Ecelyo task has an explicit `agentRole`.

## macOS Constraint

Ecelyo's local server is **macOS-only** and lives on the LAN, not `localhost`. The host is set once
in the `ECELYO_SERVER_IP` environment variable (in `~/.zshenv`, so every shell and agent picks it up).
Base URL: `http://$ECELYO_SERVER_IP:8080`.

- Do not expect the server to be present on iPhone or iPad.
- If `ECELYO_SERVER_IP` is unset, or the server is unreachable, stop and ask the user rather than guessing `localhost`.

## Network Discovery (mDNS / Bonjour)

Ecelyo local server instances advertise their presence on the local network via Multicast DNS (mDNS) / Bonjour under service type `_ecelyo._tcp.local.` (port 8080).

- **Browse active local servers**: `dns-sd -B _ecelyo._tcp local.`
- **Lookup server details**: `dns-sd -L "Ecelyo Server" _ecelyo._tcp local.`
- **Specification Contract**: See [Local Server Network Discovery Specification v1](file:///Users/mhjaso/Developer/Projects/ecelyo_app/specifications/v1/local-server-discovery.md).

## Shared Rules

1. Prefer the narrowest endpoint that answers the question.
2. Quote URLs in shell commands, especially ones with `?query=params`, to avoid shell globbing issues.
3. Treat Ecelyo as the source of truth for task state and task selection when this workflow is active.
4. Treat Ecelyo as a workflow philosophy, not only a transport. Tactics should stay coherent rather than becoming buckets of unrelated tasks.
5. Reuse an existing tactic when the new task clearly belongs to the same tactical arc. If it does not, prefer creating a new tactic.
6. Each tactic should normally include a meaningful starting task and a meaningful final task that makes tactic completion explicit.
7. When updating task state through the server, use the API's canonical values:
   - `pending`
   - `wip`
   - `blocked`
   - `finished`
8. Never create local task-record files as part of normal task tracking. If the server is down, stop and ask the user to start it (see Failure Handling); do not use a local file fallback.
9. If the server does not respond, stop the task workflow and ask the user to start the server before continuing.
10. Do not invent endpoints. If an endpoint is missing, say so and use the closest supported route.
11. Prefer TOON for normalized arrays of systems, projects, tactics, tasks, or priority-queue entries that will be consumed by an agent.
12. Keep raw JSON when exact response fidelity matters more than token efficiency, such as debugging a server issue or checking unknown fields.
13. **Whenever you move a task to `wip`, set `deeplinkUrl` and `agentTechnology` in the same `PATCH` call**. `deeplinkUrl` must be a link that reopens the live conversation/thread doing the work — `codex://threads/<thread-id>` in Codex, `claude://agents/<session-id>` in Claude, or the equivalent URL scheme for another agent technology. `agentTechnology` must be the name of the active AI agent (e.g., "Codex", "Claude", "Antigravity"). These fields are required, not optional. The deeplink is distinct from the app's own `ecelyo://open/...` navigation links, which must never be used as the value here.
14. Whenever you create a task, set `agentRole` explicitly. Do not leave it empty.

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
  5718301F-A30D-436A-BA61-85F6E1BA38B2,"Add context menu copy ID actions for projects and tasks",Trivial,pending,"Ecelyo App",Foundations
  2947CCE5-41CD-46E8-8214-0678A1EC4F74,"Add a copy button beside the task ID",Medium,pending,"Ecelyo App",Foundations
```

### JSON Example

```json
{"success":true,"data":{"message":"Ecelyo is ready","version":"1"}}
```

### curl

```bash
curl -s "http://$ECELYO_SERVER_IP:8080/"
curl -s "http://$ECELYO_SERVER_IP:8080/systems"
curl -s "http://$ECELYO_SERVER_IP:8080/tasks/priority"
curl -s "http://$ECELYO_SERVER_IP:8080/tasks?state=pending"
curl -s -X PATCH "http://$ECELYO_SERVER_IP:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"state":"wip","deeplinkUrl":"codex://threads/<thread-id>"}'
curl -s -X PATCH "http://$ECELYO_SERVER_IP:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"<project-id>","tacticId":"<tactic-id>"}'
curl -s -X POST "http://$ECELYO_SERVER_IP:8080/systems" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Public Health System","isActive":false}'
curl -s -X POST "http://$ECELYO_SERVER_IP:8080/tasks" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Refine onboarding copy","projectId":"<project-id>","tacticId":"<tactic-id>","priority":"Medium","state":"pending","agentRole":"Localization Team"}'
```

When shaping output for another agent, prefer shell-native transforms or `jq` and emit compact TOON instead of verbose prose whenever the result is a repeated list with one schema.

### mock-agent

When working inside the Ecelyo repository, you may use:

```bash
swift run --package-path tools/mock-agent mock-agent list-tasks --state pending
swift run --package-path tools/mock-agent mock-agent update-task <task-id> --state wip
```

## Workflow Pairings

### With `task-processor`

Use `task-processor` for Ecelyo backlog intake when the user requests task capture. It creates and
updates records through the live Ecelyo server.

Use this skill when intake should be informed by the currently open app state.

- Read `GET /systems` to find the active or intended system.
- Read `GET /projects` and `GET /tactics` to avoid creating duplicate app-side structures.
- Decide whether the work belongs in an existing tactic or needs a new tactic to keep tactic boundaries coherent.
- When creating a new tactic, make sure the tactic has or will have a clear starting task and a clear final task.
- When creating a new task, choose an explicit `agentRole` that matches the intended kind of work.
- Only create app-side entities with `POST /projects`, `POST /projects/{projectId}/tactics`, or `POST /tasks` when the user explicitly wants app-state creation too.

### With `task-executor`

`task-executor` is the canonical single-task and ordered-batch execution skill. When Ecelyo is in
scope, use its live task state and do not create local task-record files.

Use this pairing when executing an existing task and the app should reflect current progress.

- Read `GET /tasks/priority` first to select the next available task from the active queue.
- Treat `pending` tasks from that queue as available to start and `wip` tasks as already taken by another agent unless the user says otherwise.
- Use `GET /tasks?state=pending` or a narrower filtered query only when you need extra detail outside the grouped priority queue.
- When handing candidate tasks to another agent, prefer a compact TOON list over narrative summaries.
- When work starts, mirror app state with `PATCH /tasks/{id} {"state":"wip","deeplinkUrl":"<your-conversation-url>","agentTechnology":"<your-agent-name>"}` — set all fields in the same call. Do not move a task to `wip` without also setting `deeplinkUrl` and `agentTechnology`.
- When work completes, mirror app state with `PATCH /tasks/{id} {"state":"finished"}`.
- When a pull request is merged, ensure the corresponding Ecelyo task is also updated to `finished` if it is not already there.
- If blocked, mirror app state with `PATCH /tasks/{id} {"state":"blocked"}` when appropriate.

## Failure Handling

- If `GET /` fails, report the connection error and likely cause: server not running, `ECELYO_SERVER_IP` unset or stale, or non-macOS host.
- If `404 Not Found` occurs, verify the endpoint against the reference file before retrying.
- If a `PATCH` returns `404`, confirm the task ID first with `GET /tasks` or `GET /tasks/{id}`.
- If the app server is unavailable, stop and ask the user to start it or confirm the IP. Do not continue task work without Ecelyo connectivity.

## References

Read `references/endpoint-cheatsheet.md` for the endpoint list, payload shapes, and example commands.
