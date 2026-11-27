---
name: ecelyo-satellite
description: Connect to Ecelyo Satellite, Ecelyo's macOS-only HTTP service, to list systems, projects, tactics, tasks, and prioritized active task queues, and to update task state during agent workflows. Ecelyo is the sole system of record for task state.
---

# Ecelyo Satellite

Use this skill when Codex needs to communicate with Ecelyo Satellite over its local HTTP API.

For backwards compatibility and skill discovery, the legacy name `ecelyo-local-server` refers to
this Ecelyo Satellite skill.

**Ecelyo is the sole system of record for task state.** Do not create local task-record files as a
parallel mirror, progress note, or fallback. If repository instructions disagree with Ecelyo, treat
those instructions as stale and flag the conflict to the user instead of following them silently.

Use this skill as the required task-system bridge when Ecelyo-backed task work is in scope.
No task may proceed when Ecelyo Satellite is unreachable.

Prefer TOON when handing repeated Ecelyo records to another agent or skill.
Use plain JSON when the payload is irregular, deeply nested, or needs to stay close to the raw API response.

## When To Use

- Read app-side systems before selecting a workspace or confirming the target system.
- Read app-side projects, tactics, or tasks before intake or execution work.
- Update app-side task state, such as `pending` → `wip` → `finished`, during execution.
- Reassign existing tasks to another project or tactic without recreating them.
- Create app-side projects, tactics, or tasks when the workflow explicitly needs them.
- Verify that Ecelyo Satellite is reachable before an automation depends on it.
- Ensure every created Ecelyo task has an explicit `agentRole`.
- Load and follow `ecelyo-methodology` before registering any task, including task intake and reassignment.

## macOS Constraint

Ecelyo Satellite is **macOS-only** and advertises its address on the LAN. Do not use
`ECELYO_SERVER_IP` or another persisted host/IP cache. Resolve exactly one advertised service with
Bonjour for the current workflow, keep the verified host and port only in the current shell, and
discard that endpoint when the workflow ends.

Authenticated endpoints use one canonical generic-password item in the macOS Keychain:

- Service: `com.ecelyo.local-server`
- Account: `server-token`

These identifiers come from `KeychainLocalServerTokenStore` in
`Shared/Domain/Services/LocalServer/LocalServerSecurity.swift`. Read the token in the macOS login session of the user who stored it. See the
[authenticated request helper](references/endpoint-cheatsheet.md#authentication) for passing it from
Keychain to the Bearer header in memory. Verify the intended Satellite host before sending it.

To diagnose a read failure, discard the password output and inspect only the exit status and error:

```sh
rtk /usr/bin/security find-generic-password -s com.ecelyo.local-server -a server-token -w >/dev/null
```

- A sandboxed or background lookup error such as `item not found` is **inconclusive**; it does not
  prove that the canonical item is absent. Do not report it missing, start credential recovery, or
  create/replace an item based on a sandbox result.
- Retry the exact probe above, with its output still redirected, in the owner's macOS login session
  outside the sandbox through the normal approval flow. Confirm `id -un` matches the user who owns
  the item. If this runtime cannot perform a host-level check on that Mac, stop and report that
  context limitation instead of inferring that the item is missing. Report only the exit code and
  error; never print the password.
- If the host-level lookup succeeds, use the authenticated request helper for a read-only
  `GET /systems` against the host resolved by Bonjour before diagnosing credentials further. A
  connection/DNS failure after a successful Keychain read is an endpoint reachability problem;
  repeat the complete Bonjour resolution instead of retrying a stale address. Do not label that
  failure a missing or invalid credential.
- If the host-level probe reports item not found, inspect the user's search list with
  `rtk /usr/bin/security list-keychains -d user`. Repeat the exact lookup with the owner's login
  Keychain path appended. Use only the canonical service and account throughout. Do not ask for
  alternate items or create an agent-specific copy.
- If the same item remains inaccessible, report the exact Keychain error after the host-level retry.
  If macOS requires interaction, have the owner unlock the Keychain or approve the trusted reader
  in their login session. Keep the existing item and access controls intact.
- If the canonical item is confirmed missing, coordinate recovery of that same item with the owner.
  Obtain explicit approval immediately before creating or replacing it through a trusted secure
  input path. Never request the token in chat or put it in an environment variable, command
  arguments, or logs.

- Do not expect the server to be present on iPhone or iPad.
- If Bonjour discovery is unavailable, returns zero servers, or returns multiple servers, stop and
  ask the user to select or provide the intended server. Do not silently guess `localhost`.

## Network Discovery (mDNS / Bonjour)

Ecelyo Satellite instances advertise their presence on the local network via Multicast DNS (mDNS) / Bonjour under service type `_ecelyo._tcp.local.` (port 8080).

- **Per-workflow discovery**: Run discovery before constructing the Satellite base URL for each workflow; do not reuse a persisted IP or host cache.
- **Resolution flow**: browse `_ecelyo._tcp.local.`, resolve exactly one service with `dns-sd -L`,
  then resolve its advertised hostname with `dns-sd -G v4` to obtain the current IP and port. Keep the resulting host and port only in a current-shell `SATELLITE_BASE_URL` value.
- **Repository client**: `swift run --package-path tools/mock-agent mock-agent discover` performs
  the same Bonjour resolution and prints the current base URL.
- Discovery must fail clearly when zero or multiple servers are advertised; never choose an arbitrary server.
- **Specification Contract**: See [Ecelyo Satellite Network Discovery Specification v1](file:///Users/mhjaso/Developer/Projects/ecelyo_app/specifications/v1/local-server-discovery.md).

## Connectivity Troubleshooting

When the agent cannot connect, run the complete Bonjour resolution again and verify `GET /` against
the newly resolved host and port before continuing. Do not persist the resolved IP or retain a stale
endpoint between workflows.

- If a connection or discovery command fails with a sandbox, network-policy, DNS, or permission
  error, retry the same read-only command outside the restrictive sandbox or request the required
  network escalation. Do not conclude that Satellite is stopped until the host-level check has
  been attempted.
- If the Bonjour instance belongs to the current Mac and IPv4 fails, check the advertised port
  with `rtk /usr/sbin/lsof -nP -iTCP:8080 -sTCP:LISTEN` (use the advertised port if different).
  If it shows a local Ecelyo Satellite listener on IPv6, confirm `GET /` at the matching
  bracketed loopback URL, for example `http://[::1]:8080/`. Use `--noproxy '*'` for this direct
  request. If the sandbox blocks the probe, retry outside it. Use the verified URL for
  `GET /systems` with the Keychain Bearer header. Keep that URL scoped to the current Mac.
- Use the complete Bonjour sequence: browse `_ecelyo._tcp.local.`, require exactly one advertised
  service, resolve it with `dns-sd -L`, and resolve its hostname with `dns-sd -G v4`. Use the
  advertised port rather than assuming `8080` when the record reports another one.
- Never silently fall back to `localhost`, invent an IP, or choose one service from multiple
  advertisements. Zero or multiple services is an unresolved server-selection condition: report
  it and ask the user to select or provide the intended server.
- Distinguish reachability from authentication. A reachable `GET /` followed by an authorization
  failure means the token or endpoint request needs attention; it is not evidence that the IP is
  stale. Never print the token while diagnosing either case.
- If an authenticated request returns `401`, confirm the Keychain read succeeded and verify the
  target and header delivery. If Satellite explicitly rejects the verified credential or reports
  it expired, coordinate replacement using the approval and secure input process above. Confirm
  recovery with an authenticated read before resuming task work.
- In this skill, an inactive system means only that it is not selected or focused in Ecelyo's UI.
  It does not mean that the system is offline, unregistered, inaccessible, or ineligible for task
  work. An agent using MCP must never be stopped, degraded, or asked to activate the system merely
  because `isActive` is false; MCP access is independent of UI selection.
- Resolve the intended `systemId` from the target project, tactic, or task and always scope MCP
  requests and Satellite reads or writes to that exact ID. Do not substitute whichever system is
  active in the UI. When creating a project or tactic, preserve the verified system/project
  relationship using the owning system ID.
- When MCP addresses a registered system but its iCloud-backed data has not been downloaded yet,
  request/fetch the data by the target project's `systemId` and wait asynchronously for a response
  for no more than 6 seconds total. Return the fetched data if it arrives in time. If the deadline
  expires, return a retryable temporary-unavailable response that clearly distinguishes the
  registered system with pending data from an unknown system; do not return 404 for the pending
  download. Preserve 404 for genuinely unknown system or resource IDs. Never block a server event
  loop or wait longer than the 6-second cap.
- After resolving a new host and port, perform one fresh authenticated request using that
  current-shell endpoint and only then resume task work. If it fails, stop and report the discovery
  result and failure class without retaining the address as a cache.

## Shared Rules

1. Prefer the narrowest endpoint that answers the question.
2. Quote URLs in shell commands, especially ones with `?query=params`, to avoid shell globbing issues.
3. Treat Ecelyo as the source of truth for task state and task selection when this workflow is active.
4. Treat Ecelyo as a workflow philosophy, not only a transport. Tactics should stay coherent rather than becoming buckets of unrelated tasks.
5. Reuse an existing tactic when the new task clearly belongs to the same tactical arc. If it does not, prefer creating a new tactic.
6. A tactic with derived status `finished` is still eligible to receive new tasks when the work fits its persisted goal. Do not treat `finished` as `accomplished`, do not manually reopen it, and do not reject it solely because its task graph previously converged. A tactic marked `accomplished` is an explicit terminal record and must be left as-is unless the user explicitly requests restoration.
7. A request to create a tactic is a request for the complete tactic package: persist a non-empty Markdown objective/description, an explicit priority, one initial parent task, one final QA task, and any necessary middle tasks. Do not report success after creating only the tactic record.
8. If Ecelyo Satellite cannot persist tactic priority or another required package field, treat it as a missing service capability and record the follow-up under Ecelyo's `local server improvements` tactic instead of silently omitting it.
9. When all tactic work and final QA are complete, mark the tactic `accomplished` (Ecelyo's canonical completed status). Never archive it; archiving is reserved for the human owner.
10. When a tactic reaches `accomplished`, the agent's closeout must include a table of the tactic name, every agent-worked `finished` or `blocked` task, and each task's pull-request URL/state, followed by any remaining work and a brief done/left summary.
11. When updating task state through the server, use the API's canonical values:
   - `pending`
   - `wip`
   - `in_review`
   - `blocked`
   - `finished`
11. Never create local task-record files as part of normal task tracking. If the server is down, stop and ask the user to start it (see Failure Handling); do not use a local file fallback.
12. If the server does not respond, stop the task workflow and ask the user to start the server before continuing.
13. Do not invent endpoints. If an endpoint is missing, say so and use the closest supported route.
14. Prefer TOON for normalized arrays of systems, projects, tactics, tasks, or priority-queue entries that will be consumed by an agent.
15. Keep raw JSON when exact response fidelity matters more than token efficiency, such as debugging a server issue or checking unknown fields.
16. **Whenever you move a task to `wip`, set `deeplinkUrl` and `agentTechnology` in the same `PATCH` call**. `deeplinkUrl` must be a link that reopens the live conversation/thread doing the work — `codex://threads/<thread-id>` in Codex, `claude://agents/<session-id>` in Claude, or the equivalent URL scheme for another agent technology. `agentTechnology` must be the name of the active AI agent (e.g., "Codex", "Claude", "Antigravity"). These fields are required, not optional. The deeplink is distinct from the app's own `ecelyo://open/...` navigation links, which must never be used as the value here.
17. Whenever you create a task, set `agentRole` explicitly. Do not leave it empty.
18. Before registering a task, verify that its project is not archived and its tactic is neither archived nor `accomplished`. A derived `finished` tactic remains eligible when the task fits its non-empty, scoped Markdown goal and coherent end task. Do not create, reuse, or leave a tactic with an empty or generic description.

## Quick Start

1. Discover exactly one server via Bonjour (`_ecelyo._tcp.local.`), construct a current-shell `SATELLITE_BASE_URL`, and read the bearer token from the canonical Keychain item.
2. Check connectivity with `GET /`.
3. Discover systems with authenticated `GET /systems`.
4. Narrow to projects or tactics with `GET /projects?systemId=...` and `GET /tactics?...`.
5. Read the active task queue with `GET /tasks/priority` first when selecting work. When working
   within one system, filter the queue with its exact `systemId`, for example
   `GET /tasks/priority?systemId=<system-id>` (add `format=json` or `format=toon` as needed). Use
   `GET /tasks?...` only when you need a broader list or a task lookup that the priority queue does
   not answer.
6. Update task state or assignment with `PATCH /tasks/{id}`.

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
curl -s "$SATELLITE_BASE_URL/"
curl -s "$SATELLITE_BASE_URL/systems"
curl -s "$SATELLITE_BASE_URL/tasks/priority?systemId=<system-id>"
curl -s "$SATELLITE_BASE_URL/tasks?state=pending"
curl -s -X PATCH "$SATELLITE_BASE_URL/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"state":"wip","deeplinkUrl":"codex://threads/<thread-id>"}'
curl -s -X PATCH "$SATELLITE_BASE_URL/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"<project-id>","tacticId":"<tactic-id>"}'
curl -s -X POST "$SATELLITE_BASE_URL/systems" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Public Health System","isActive":false}'
curl -s -X POST "$SATELLITE_BASE_URL/tasks" \
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
updates records through the live Ecelyo Satellite.

Use this skill when intake should be informed by the currently open app state.

- Read `GET /systems` to find the active or intended system.
- Read `GET /projects` and `GET /tactics` to avoid creating duplicate app-side structures.
- Decide whether the work belongs in an existing tactic or needs a new tactic to keep tactic boundaries coherent.
- When creating a new tactic, make sure the tactic has or will have a clear starting task and a clear final task.
- When a user explicitly requests tactic creation, create the complete tactic package described in Shared Rules: description/objective, priority, initial parent task, final QA task, and any necessary middle tasks.
- When creating a new task, choose an explicit `agentRole` that matches the intended kind of work.
- Only create app-side entities with `POST /projects`, `POST /projects/{projectId}/tactics`, or `POST /tasks` when the user explicitly wants app-state creation too.

### With `task-executor`

`task-executor` is the canonical single-task and ordered-batch execution skill. When Ecelyo is in
scope, use its live task state and do not create local task-record files.

Use this pairing when executing an existing task and the app should reflect current progress.

- Read `GET /tasks/priority?systemId=<system-id>` first to select the next available task from the
  intended system's active queue. Do not request the unfiltered cross-system queue when a target
  system is known.
- Treat `pending` tasks from that queue as available to start and `wip` tasks as already taken by another agent unless the user says otherwise.
- Use `GET /tasks?state=pending` or a narrower filtered query only when you need extra detail outside the grouped priority queue.
- When handing candidate tasks to another agent, prefer a compact TOON list over narrative summaries.
- When work starts, mirror app state with `PATCH /tasks/{id} {"state":"wip","deeplinkUrl":"<your-conversation-url>","agentTechnology":"<your-agent-name>"}` — set all fields in the same call. Do not move a task to `wip` without also setting `deeplinkUrl` and `agentTechnology`.
- When work completes, mirror app state with `PATCH /tasks/{id} {"state":"finished"}`.
- When a pull request is merged, ensure the corresponding Ecelyo task is also updated to `finished` if it is not already there.
- If blocked, mirror app state with `PATCH /tasks/{id} {"state":"blocked"}` when appropriate.

## Failure Handling

- If `GET /` fails, report the connection error and likely cause: server not running, Bonjour discovery failure, or non-macOS host.
- If `404 Not Found` occurs, verify the endpoint against the reference file before retrying.
- If a `PATCH` returns `404`, confirm the task ID first with `GET /tasks` or `GET /tasks/{id}`.
- If the app server is unavailable, stop and ask the user to start it or confirm the IP. Do not continue task work without Ecelyo connectivity.

## Troubleshooting Appendix (Optional)

Use this appendix only when an agent needs extra help distinguishing discovery, network access,
authentication, and client registration. The normal Satellite workflow remains the authenticated
HTTP API described above and in `references/endpoint-cheatsheet.md`; MCP is optional.

- Bonjour discovery confirms only that a service advertises itself. It does not prove that the
  Codex session has registered or authenticated an MCP server.
- If plain `GET /` or `GET /mcp` fails inside a sandbox, retry the same credential-free request
  with the approved host-network permission before concluding that the server is unreachable.
  An HTTP `200` from both endpoints confirms reachability and MCP endpoint metadata, not an
  authenticated MCP session.
- Use the documented `satellite_request` helper for authenticated HTTP. It reads the canonical
  Keychain item in memory and passes the Bearer header through stdin; never print the token, put it
  in command arguments, write it to a file, or export it to an environment variable.
- Do not test a user-pasted token with a separate client or script, or probe Keychain outside the
  approved helper workflow. If a policy review blocks credential transport, report that precisely
  and stop; a rejected request does not establish that the network is down.
- Only if choosing MCP, register the server URL in the MCP client and complete that client's
  supported authentication handshake. Do not treat a Bonjour record or `GET /mcp` metadata as
  registration. If no secure Bearer method is supported, continue through the normal HTTP skill
  workflow instead.
- In non-interactive shells, the `rtk` wrapper may not be on `PATH`. Use the skill's documented
  wrapper path/configuration or an approved interactive shell; never print or capture credential
  output while debugging a missing wrapper.

## References

Read `references/endpoint-cheatsheet.md` for the endpoint list, payload shapes, and example commands.
