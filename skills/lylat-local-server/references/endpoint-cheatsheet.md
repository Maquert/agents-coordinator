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

You may also update `title` or `description` in the same payload.

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
    "priority":"Medium",
    "state":"pending"
  }'
```

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
