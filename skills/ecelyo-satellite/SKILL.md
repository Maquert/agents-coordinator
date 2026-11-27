---
name: ecelyo-satellite
description: Connect to Ecelyo Satellite through its authenticated MCP-over-HTTP adapter to list and update Ecelyo task records. Use the REST API only as a clearly identified fallback. Ecelyo is the sole system of record for task state.
---

# Ecelyo Satellite

Use this skill when an agent needs to communicate with Ecelyo Satellite. The primary integration is
Ecelyo's MCP adapter over HTTP: send MCP JSON-RPC messages to `POST /mcp` using the documented
Keychain-backed Bearer helper. This is MCP carried by HTTP, not a REST call to `/systems` or
`/tasks`. Use direct REST routes only when the needed MCP tool is unavailable or the user explicitly
requests REST, and label that path as REST.

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
  `POST /mcp` `initialize` request against the host resolved by Bonjour. After initialization,
  verify tools with `tools/list` and use MCP `list_systems` for system data. A connection/DNS
  failure after a successful Keychain read is an endpoint reachability problem; repeat the complete
  Bonjour resolution instead of retrying a stale address. Do not label that failure a missing or
  invalid credential.
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

## MCP First Contact over HTTP

The authoritative Ecelyo adapter contract is
[`local-server-mcp.md`](file:///Users/mhjaso/Developer/Projects/ecelyo_app/specifications/v1/local-server-mcp.md).
It defines the current Satellite MCP endpoint as `POST $SATELLITE_BASE_URL/mcp`, using JSON-RPC
2.0 and the app-supported initialize/session lifecycle. Follow that app contract rather than
guessing the newest generic MCP wire version or inventing an endpoint. The adapter is on the same
HTTP server as the REST API, but it is a separate protocol surface.

Use a registered MCP client only if it supports Ecelyo's documented `POST /mcp` HTTP and
session contract. Do not assume that a generic MCP client's newest transport/version is compatible
with this app-specific adapter. If no compatible client is registered in the agent runtime, the
skill's `satellite_request` helper can carry the documented MCP JSON-RPC POSTs over HTTP while
keeping the Keychain token out of command arguments and output. Do not describe a direct REST
request as an MCP call.

First contact has distinct checkpoints:

1. Resolve exactly one Bonjour service for this workflow and set the current-shell
   `SATELLITE_BASE_URL` to its verified host and advertised port. If the user explicitly supplies a
   current address, it may be checked for this workflow only; never persist it as a cache.
2. Send unauthenticated `GET $SATELLITE_BASE_URL/`. A successful response verifies base HTTP
   reachability only; it does not verify MCP or authentication.
3. After verifying the intended host, use the authenticated request helper for the normative
   `POST /mcp` `initialize` request. A successful JSON-RPC result should identify the Ecelyo MCP
   server, advertise the tools capability, and return a session ID.
4. Send `notifications/initialized`, then `tools/list`, including the returned `mcp-session-id`
   header on every post-initialize request. Confirm that the response contains the advertised tool
   catalog.
5. For an end-to-end read-only smoke check, call `tools/call` with the `list_systems` tool and
   confirm it returns a valid MCP result.

Example protocol messages, sent through the authenticated helper to the verified endpoint. For
each call, retain the JSON response needed for the next step; never print or capture the Bearer
header itself.

```sh
satellite_request -X POST "$SATELLITE_BASE_URL/mcp" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

Read `result.sessionId` from the MCP response. Use that value only in the current workflow as the
`mcp-session-id` header on subsequent requests:

```sh
satellite_request -X POST "$SATELLITE_BASE_URL/mcp" \
  -H 'Content-Type: application/json' \
  -H 'mcp-session-id: <session-id-from-initialize>' \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}'

satellite_request -X POST "$SATELLITE_BASE_URL/mcp" \
  -H 'Content-Type: application/json' \
  -H 'mcp-session-id: <session-id-from-initialize>' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

satellite_request -X POST "$SATELLITE_BASE_URL/mcp" \
  -H 'Content-Type: application/json' \
  -H 'mcp-session-id: <session-id-from-initialize>' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_systems","arguments":{}}}'
```

The corresponding JSON-RPC request bodies are:

```json
{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}
```

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_systems","arguments":{}}}
```

The app's optional unauthenticated `GET /mcp` metadata response is diagnostic convenience only.
It is not the MCP handshake and must not be used as proof of MCP connectivity. A successful
`GET /` is also not proof of MCP connectivity. Do not use an arbitrary `GET /mcp` failure to infer
that the MCP adapter is unavailable; check the app contract and exercise `POST /mcp`.

## Connectivity Troubleshooting

Classify each checkpoint separately. Do not collapse discovery, network reachability, Keychain
access, HTTP authentication, and the MCP handshake into “Satellite is down.”

| Observation | What it establishes | Next action |
| --- | --- | --- |
| A command returns `Operation not permitted`, a sandbox/network-policy error, `curl (7)`, timeout, or similar in the restricted run | Only that invocation failed. `curl (7)` alone does not identify whether the cause is the sandbox, route, host, or port. | Re-run the exact same read-only command with the runtime's approved host-network escalation (`require_escalated`). Record whether escalation was granted or rejected. |
| The elevated request succeeds after the restricted request failed | The restricted execution context blocked or lacked the route; Satellite is reachable from the approved host context. | Continue from the elevated context. State explicitly that the sandbox blocked the first attempt. |
| The runtime's approval reviewer rejects the elevated request | The request was not executed with host-network access; reachability remains untested. | Stop. Report that policy rejected the network escalation. Do not say Satellite is offline and do not try UI automation, a different shell, or another path to bypass the restriction. |
| `DNSServiceBrowse failed -65563 (Service Not Running)` or another Bonjour daemon error occurs in the restricted run | Bonjour discovery did not run successfully in that context; it does not prove there are zero services. | Re-run the same discovery in the owner's approved macOS login context. If host-level discovery still fails, report the exact DNS-SD error and ask the user for the intended current address or to restore Bonjour. |
| Bonjour succeeds, but the host-level `GET /` fails | The resolved host/port was not reachable at the time of the check. | Report the resolved host and advertised port, command exit code, HTTP status if any, and exact error. If this is the same Mac, inspect the advertised listening port with `rtk /usr/sbin/lsof -nP -iTCP:<port> -sTCP:LISTEN`; check IPv6 loopback only if a local listener is shown. |
| `GET /` succeeds but the authenticated `POST /mcp` returns HTTP `401` | The base service is reachable; the MCP request reached an authentication gate and was rejected. | Check Keychain access and that the helper attached the Bearer header. Do not rediscover the host solely because of `401`. If the stored credential is explicitly rejected, use the secure replacement process above. |
| `POST /mcp` returns HTTP `404`, `405`, or a JSON-RPC error | The HTTP server responded. This is an MCP path/method/version/request issue, not a basic network failure. | Compare the request with `local-server-mcp.md`; report HTTP status and JSON-RPC error code/message. Do not infer that the host is unreachable. |
| `initialize` succeeds but `tools/list` or `tools/call` returns an MCP error | Transport and initialization worked; the failure is in session handling, tool discovery, arguments, data loading, or the tool itself. | Preserve the JSON-RPC code/message and identify the exact MCP method/tool that failed. |

When the restricted attempt fails, the next action for a read-only connectivity probe is to ask the
command runner for `require_escalated`, with a concise justification that this is a read-only
request to the verified local Satellite host. Do not abandon the check after the first sandbox
failure. If the escalation is rejected, report that as a policy blocker and make no claim about
host reachability. Do not use a browser, a second shell, or another tool as a workaround for a
rejected approval.

For Bonjour, run the complete sequence: browse `_ecelyo._tcp.local.`, require exactly one advertised
service, resolve it with `dns-sd -L`, and resolve its hostname with `dns-sd -G v4`. Use the advertised
port; do not assume `8080` if the record reports another value. If the user explicitly provides a
current endpoint, verify it with `GET /` for this workflow only, and do not persist it.

The Keychain probe is a separate checkpoint. A sandboxed/background `security` failure is
inconclusive; retry the same output-discarding probe in the owner's macOS login session through the
normal approval flow. Never infer that the item is missing from a sandbox result. Do not inspect or
read the token until the intended host has been verified. Use the documented authenticated helper
for MCP POSTs; it must keep the token in memory and out of command arguments, logs, and output.

If the Bonjour instance belongs to the current Mac and IPv4 fails, check the advertised port with
`rtk /usr/sbin/lsof -nP -iTCP:<port> -sTCP:LISTEN`. If it shows a local Satellite listener on IPv6,
verify `GET /` at the matching bracketed loopback URL (for example `http://[::1]:8080/`) with
`--noproxy '*'`, then use that verified URL for the MCP endpoint. Keep it scoped to this workflow.

An inactive system means only that it is not selected or focused in Ecelyo's UI; it does not mean
the system is offline or ineligible. Resolve the intended `systemId` from the target project, tactic,
or task, and pass it explicitly to the corresponding MCP tool rather than relying on the UI's active
system. When a registered system's iCloud data is still downloading, honor the app's documented
asynchronous fetch behavior and six-second limit; report retryable pending data separately from an
unknown ID or a transport failure.

Every connection failure report must state: the phase (Bonjour, base `GET /`, Keychain lookup, MCP
`initialize`, `tools/list`, or tool call); whether it ran restricted or escalated; whether escalation
was granted, rejected, or unavailable; the resolved host/port source when known; exit code and exact
stderr or HTTP status; and any JSON-RPC code/message. Never include the token or Authorization
header. If a failed restricted probe has not been retried with approved host-network access, label
the result **not yet tested from the host context**.

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

1. Discover exactly one server via Bonjour and construct a current-shell `SATELLITE_BASE_URL`.
2. Check base HTTP reachability with unauthenticated `GET /`. If the restricted command fails,
   repeat that exact read-only probe with `require_escalated`; do not label Satellite offline before
   an approved host-context attempt.
3. Use the Keychain-backed `satellite_request` helper for authenticated MCP traffic to
   `POST $SATELLITE_BASE_URL/mcp`.
4. Complete `initialize`, `notifications/initialized`, and `tools/list`, preserving the returned
   `mcp-session-id` for that workflow.
5. For task selection, call MCP `list_systems` to identify the intended system, then use
   `list_projects`, `list_tactics`, and `list_tasks` with the exact `systemId`. Call
   `list_tasks` with the system filter and use Ecelyo's priority order when selecting work.
6. Read or change records through the corresponding MCP tools (`get_task`, `create_task`,
   `update_task`, and others). Use direct REST routes only under the explicit fallback rules below.

## Preferred Commands

Prefer a registered MCP client only when it supports Ecelyo's documented HTTP endpoint and
session contract. Otherwise use `satellite_request` from `references/endpoint-cheatsheet.md` to
send the documented JSON-RPC requests to `POST /mcp`. The `tools/mock-agent` utility is a direct
REST client, not an MCP client; use it only for an explicitly chosen REST fallback or REST-specific
diagnostics.

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

### Direct REST API examples (fallback only)

These examples call Satellite's REST API directly. They are not MCP calls. Use them only when the
needed MCP tool is unavailable, the MCP adapter cannot perform a documented operation, or the user
explicitly requests REST. Prefer the MCP tools for ordinary task-system work.

```bash
curl -s "$SATELLITE_BASE_URL/"
satellite_request "$SATELLITE_BASE_URL/systems"
satellite_request "$SATELLITE_BASE_URL/tasks/priority?systemId=<system-id>"
satellite_request "$SATELLITE_BASE_URL/tasks?state=pending"
satellite_request -X PATCH "$SATELLITE_BASE_URL/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"state":"wip","deeplinkUrl":"codex://threads/<thread-id>"}'
satellite_request -X PATCH "$SATELLITE_BASE_URL/tasks/<task-id>" \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"<project-id>","tacticId":"<tactic-id>"}'
satellite_request -X POST "$SATELLITE_BASE_URL/systems" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Public Health System","isActive":false}'
satellite_request -X POST "$SATELLITE_BASE_URL/tasks" \
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

- Use MCP `list_systems`, `list_projects`, and `list_tactics` to identify the intended system and
  avoid creating duplicate app-side structures.
- Decide whether the work belongs in an existing tactic or needs a new tactic to keep tactic boundaries coherent.
- When creating a new tactic, make sure the tactic has or will have a clear starting task and a clear final task.
- When a user explicitly requests tactic creation, create the complete tactic package described in Shared Rules: description/objective, priority, initial parent task, final QA task, and any necessary middle tasks.
- When creating a new task, choose an explicit `agentRole` that matches the intended kind of work.
- Create app-side entities with MCP `create_project`, `create_tactic`, and `create_task` only when
  the user explicitly wants Ecelyo state created too. Use the documented REST `POST` routes only
  under the REST fallback rules.

### With `task-executor`

`task-executor` is the canonical single-task and ordered-batch execution skill. When Ecelyo is in
scope, use its live task state and do not create local task-record files.

Use this pairing when executing an existing task and the app should reflect current progress.

- Use MCP `list_tasks` scoped to the intended `systemId` to select work. Do not request an
  unfiltered cross-system queue when a target system is known. If using the explicit REST fallback,
  read `GET /tasks/priority?systemId=<system-id>` first.
- Treat `pending` tasks from that queue as available to start and `wip` tasks as already taken by another agent unless the user says otherwise.
- Use MCP `get_task` or a narrower `list_tasks` call when extra details are needed. Under REST
  fallback, use `GET /tasks?...` only when the priority endpoint does not answer the question.
- When handing candidate tasks to another agent, prefer a compact TOON list over narrative summaries.
- When work starts, use MCP `update_task` with `state: "wip"`, `deeplinkUrl`, and `agentTechnology` in
  the same call. Do not move a task to `wip` without all required fields.
- When work completes, use MCP `update_task` with `state: "finished"`.
- When a pull request is merged, ensure the corresponding Ecelyo task is also updated to `finished` if it is not already there.
- If blocked, use MCP `update_task` with `state: "blocked"` when appropriate.

## Failure Handling

- Follow the phase-by-phase decision table in Connectivity Troubleshooting. A sandbox failure must
  be reported as a failed sandbox attempt until the same read-only probe has been tried with
  approved host-network access.
- A successful `GET /` proves only that the HTTP service responded. Confirm MCP by completing
  `POST /mcp` `initialize` and `tools/list`; for a full read-only smoke check, also call
  `list_systems`.
- An HTTP `404`/`405` from `/mcp` or a JSON-RPC error means the host answered; check the MCP endpoint
  contract, request method/body, session header, and protocol compatibility before diagnosing
  network reachability.
- If the host-context request still cannot reach the server, report the exact phase, endpoint
  source, execution context, escalation decision, exit code, and error. Ask the user for the
  smallest missing action, such as starting/enabling Satellite, providing the current endpoint, or
  making a runtime with LAN access available. Do not continue task work that depends on Ecelyo.

## References

Read [`local-server-mcp.md`](file:///Users/mhjaso/Developer/Projects/ecelyo_app/specifications/v1/local-server-mcp.md)
for the normative MCP endpoint, handshake, session header, and tools catalog. Read
`references/endpoint-cheatsheet.md` only for Keychain helper details and the direct REST API fallback.
