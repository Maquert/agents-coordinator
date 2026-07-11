# Endpoint Cheatsheet

Use this reference only when you need the exact endpoint or payload shape.

## Base URL

```text
http://localhost:{port}
```

Default port is `8080`.

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
- `projectId`
- `tacticId`
- `systemId`
- `createdAt`
- `updatedAt`

State values:
- `pending`
- `wip`
- `blocked`
- `finished`

Priority values:
- `Trivial`
- `Medium`
- `High`
- `Blocker`

## Update Task State

### Start work

```bash
curl -s -X PATCH "http://localhost:8080/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"state":"wip"}'
```

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

You may also update `title`, `description`, `branch`, `projectId`, or `tacticId`
in the same payload.

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
    "priority":"Medium",
    "state":"pending"
  }'
```

`branch` is optional and defaults to `""`. Set it to the task's canonical
branch slug at creation time instead of a follow-up `PATCH` call — this sets
the same field `PATCH /tasks/{id}` can update later, and the created task's
response body echoes it back.

**No repo numeric ID mapping.** `GET /projects` / `GET /tactics` (and the
`projectId`/`tacticId` nested in task DTOs) only expose app-internal UUIDs.
There is no field connecting them to the repository's numeric epoch IDs used
by `tasks/projects/{project_id}-*/tactics/{tactic_id}-*.md` (see `AGENTS.md`).
Locate the matching repo task-file location by fuzzy-matching on title —
this is the intended interim approach, not a workaround for a missing
feature that's about to ship.

## Mock Agent Shortcuts

Inside the Lylat repository:

```bash
swift run --package-path tools/mock-agent mock-agent list-projects
swift run --package-path tools/mock-agent mock-agent list-tactics --project <project-id>
swift run --package-path tools/mock-agent mock-agent list-tasks --state pending
swift run --package-path tools/mock-agent mock-agent update-task <task-id> --state wip
```

## Important Limits

- There is no `/missions` endpoint.
- The server is macOS-only.
- The app server does not replace repository task files, lock files, branches, or PR workflow.
