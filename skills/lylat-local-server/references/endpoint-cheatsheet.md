# Endpoint Cheatsheet

Use this reference only when you need the exact endpoint or payload shape.

## Base URL

```text
http://localhost:{port}
```

Default port is `8080`.

## Response Format

Responses use JSON by default. Clients may opt into Token-Oriented Object Notation (TOON) with `?format=toon` or the HTTP header `Accept: text/toon`. `?format=json` explicitly selects JSON, and the query parameter takes precedence over the header.

**TOON query example:**
```bash
curl -s "http://localhost:8080/tasks?format=toon"
```

**TOON header example:**
```bash
curl -s "http://localhost:8080/tasks" -H "Accept: text/toon"
```

---

## Connectivity

```bash
curl -s "http://localhost:8080/"
```

Expected success body:

```json
{"success":true,"data":{"message":"Lylat is ready","version":"1"}}
```

## Read Endpoints

### Systems

```bash
curl -s "http://localhost:8080/systems"
```

Fields:
- `id`
- `name`
- `isActive`
- `isShared`

### Projects

```bash
curl -s "http://localhost:8080/projects"
curl -s "http://localhost:8080/projects?systemId=<system-id>"
```

Fields:
- `id`
- `title`
- `systemId`

### Tactics

```bash
curl -s "http://localhost:8080/tactics"
curl -s "http://localhost:8080/tactics?systemId=<system-id>"
curl -s "http://localhost:8080/tactics?projectId=<project-id>"
```

Fields:
- `id`
- `title`
- `projectId`
- `systemId`

### Tasks

```bash
curl -s "http://localhost:8080/tasks/priority"
curl -s "http://localhost:8080/tasks"
curl -s "http://localhost:8080/tasks?state=pending"
curl -s "http://localhost:8080/tasks?systemId=<system-id>&state=pending"
curl -s "http://localhost:8080/tasks/<task-id>"
```

Use `GET /tasks/priority` first when selecting the next task to execute. It returns the active queue grouped by project, excludes `finished` work, and preserves the server's priority ordering.

Fields:
- `id`
- `title`
- `description`
- `state`
- `priority`
- `branch`
- `repositoryTaskId` — optional. Links this server-side task to its repository
  task-file numeric id (e.g. `1783751236` for
  `tasks/pending/1783751236-*.md`). `null`/absent when the task has no repo
  mirror.
- `deeplinkUrl` — **required before moving a task to `wip`.** The URL that
  reopens the live agent conversation/thread doing the work, e.g.
  `codex://threads/<thread-id>` or `claude://agents/<session-id>`. This is
  the agent's own conversation link, not an app-navigation URL. Empty string
  when unset. See "Set The Agent Conversation Deeplink" below.
- `parentIds` — direct parent task UUIDs in the same tactic.
- `childIds` — direct child task UUIDs in the same tactic.
- `projectId`
- `tacticId`
- `systemId`
- `createdAt`
- `updatedAt`

State values:
- `pending`
- `wip`
- `in_review`
- `blocked`
- `finished`
- `archived`

Priority values:
- `Trivial`
- `Medium`
- `High`
- `Blocker`

## Update Task State

### Start work

When taking a task, set `state` and `deeplinkUrl` together in the same
`PATCH` call:

```bash
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"state":"wip","deeplinkUrl":"codex://threads/<thread-id>"}'
```

`deeplinkUrl` must point back to the exact conversation/thread holding this
task, not a generic app URL. Example: opening the Codex app, starting a new
thread, and asking it to implement Feature A means that thread's own
`codex://threads/<thread-id>` link is the value to set — the same idea
applies to `claude://agents/<session-id>` in Claude. See "Set The Agent
Conversation Deeplink" below if you only need to attach or correct it
without changing state.

### Finish work

```bash
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"state":"finished"}'
```

### Block work

```bash
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"state":"blocked"}'
```

You may also update `title`, `description`, `branch`, `repositoryTaskId`,
`projectId`, or `tacticId` in the same payload.

### Attach or correct a repository task-file link

```bash
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"repositoryTaskId":"1783751236"}'
```

Use this to link an existing server task to its repo `tasks/pending/{id}-*.md`
file retroactively, or to correct drift after a repo task file is renumbered
or moved.

### Set the agent conversation deeplink

```bash
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"deeplinkUrl":"claude://agents/<session-id>"}'
```

Every agent taking a task must set this — it is what lets a human (or
another agent) reopen the exact live conversation doing the work. Set it in
the same request as `{"state":"wip"}` when starting a task; use this
standalone form to attach or correct it afterward (for example, if the
conversation was resumed under a new session id). The app's task-editor UI
displays this as a read-only "Task Deeplink URL" field — it is API-set only,
not directly editable in the UI. It is unrelated to the app's own internal
`lylat://open/...` navigation links, which are computed separately and never
need to be set manually.

### Replace task relationships

```bash
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"parentIds":["<task-uuid>"],"childIds":["<task-uuid>"]}'
```

Supply either or both arrays. Omit a side to preserve it, or pass `[]` to
clear it. The server atomically updates inverse relationships and rejects
unknown IDs, cross-tactic links, duplicates, self-links, and cycles without
partially mutating the graph. Do not combine relationship replacement with
`appendParentId` or tactic reassignment in one request.

## Reassign A Task

Move a task to another tactic in its current project:

```bash
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"tacticId":"<tactic-id>"}'
```

Move a task to another project and tactic:

```bash
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"<project-id>","tacticId":"<tactic-id>"}'
```

The server validates that referenced entities exist, belong to the task's
system, and that the tactic belongs to the resulting project. Send both IDs
when moving across projects so the combined reassignment is validated and
applied atomically. Invalid assignments return a 4xx response without a
partial mutation.

### Reassign project and/or tactic

```bash
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"<project-id>","tacticId":"<tactic-id>"}'
```

`projectId` and `tacticId` can be sent together or individually:

- Send both to move a task to a different tactic in a different project (e.g. migrating a task from one project's tactic to another).
- Send `tacticId` alone to move a task to a different tactic within its current project.
- Send `projectId` alone only when the task's current tactic already belongs to that project (rare — usually you also need `tacticId`).

The change is atomic: it either fully applies or is fully rejected. The resolved target tactic (payload `tacticId`, or the task's current `tacticId` if omitted) must belong to the resolved target project (payload `projectId`, or the task's current `projectId` if omitted), otherwise the request is rejected. All other task fields (title, description, priority, state, branch, timestamps) are left untouched.

Error responses:
- `400` — `projectId` or `tacticId` is not a valid UUID
- `404` — the resolved `projectId` or `tacticId` does not exist
- `422` — the resolved tactic does not belong to the resolved project, or the task is already assigned to that exact project/tactic

## Create Endpoints

Only use these when the workflow explicitly needs app-side object creation.

### Project

```bash
curl -s -X POST "http://localhost:8080/projects" \
  -H 'Content-Type: application/json' \
  -d '{"title":"New Project","systemId":"<system-id>"}'
```

### Tactic

```bash
curl -s -X POST "http://localhost:8080/projects/<project-id>/tactics" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Core Development","objective":"Ship the v1 features"}'
```

### Task

```bash
curl -s -X POST "http://localhost:8080/tasks" \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Fix login button",
    "projectId":"<project-id>",
    "tacticId":"<tactic-id>",
    "description":"",
    "branch":"",
    "repositoryTaskId":"1783751236",
    "priority":"Medium",
    "state":"pending"
  }'
```

`branch` is optional and defaults to `""`. Set it to the task's canonical
branch slug at creation time instead of a follow-up `PATCH` call — this sets
the same field `PATCH /tasks/{id}` can update later, and the created task's
response body echoes it back.

`repositoryTaskId` is optional and defaults to `null`. Set it to the
repository task file's numeric id (e.g. `1783751236` for
`tasks/pending/1783751236-*.md`) at creation time so `GET /tasks`,
`GET /tasks/{id}`, and `GET /tasks/priority` responses link straight back to
the repo file — no fuzzy title-matching needed. It can also be set or
corrected later via `PATCH /tasks/{id}`.

**Task-level repo id mapping exists; project/tactic mapping does not.**
`repositoryTaskId` on the task DTO links a server task to its repo
`tasks/{lifecycle}/{id}-*.md` file directly — prefer reading/setting this
field over fuzzy-matching on title. However, `GET /projects` / `GET /tactics`
(and the `projectId`/`tacticId` nested in task DTOs) still only expose
app-internal UUIDs; there is no equivalent field connecting them to the
repository's numeric epoch IDs used by
`tasks/projects/{project_id}-*/tactics/{tactic_id}-*.md` (see `AGENTS.md`).
Locate the matching repo project/tactic directory by fuzzy-matching on title
until that gap is filed and closed the same way.

## Mock Agent Shortcuts

Inside the Lylat repository:

```bash
swift run --package-path tools/mock-agent mock-agent list-projects
swift run --package-path tools/mock-agent mock-agent list-tactics --project <project-id>
swift run --package-path tools/mock-agent mock-agent list-tasks --state pending
swift run --package-path tools/mock-agent mock-agent update-task <task-id> --state wip
swift run --package-path tools/mock-agent mock-agent update-task <task-id> --parent-ids <id-1>,<id-2> --child-ids <id-3>
swift run --package-path tools/mock-agent mock-agent delete-task <task-id>
```

## Delete Endpoints

### Delete a task

```bash
curl -s -X DELETE "http://localhost:8080/tasks/<task-id>"
```

Permanently removes the task and returns the deleted task in the response body.
Use this to revert mistaken task creation without leaving stale entries in the
active queue. The deletion is immediate and cannot be undone through the API.

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* deleted task DTO */ }
}
```

**Error responses:**
- `400` — task ID is not a valid UUID
- `404` — no task with that ID exists
- `405` — no task ID provided (bare `DELETE /tasks`)

### Delete an acceptance criterion

```bash
curl -s -X DELETE "http://localhost:8080/tasks/<task-id>/acceptance-criteria/<criterion-id>"
```

Removes a single acceptance criterion from the task.

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error responses:**
- `404` — task or criterion not found

## Important Limits

- There is no `/missions` endpoint.
- The server is macOS-only.
- The app server does not replace repository task files, lock files, branches, or PR workflow.
