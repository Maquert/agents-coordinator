# Codex MCP Connection Troubleshooting

Use this when an agent reports that Satellite responds over HTTP but Ecelyo is absent from its
invocable MCP tools. Keep discovery, Codex registration, and authentication as separate checks.

This skill is the documented HTTP API bridge; it is not an installed Ecelyo plugin or a promise that
Codex has an official, preconfigured Ecelyo connection. Ecelyo exposes an MCP endpoint, but Codex
does not discover and register that endpoint merely because Satellite advertises it with Bonjour.
MCP is an optional client setup. If the current session has no Ecelyo MCP tool, do not wait for one
to appear automatically: continue through this skill's documented HTTP workflow. For authenticated
requests, use the helper in [endpoint-cheatsheet.md](endpoint-cheatsheet.md#authentication), which
reads the canonical Keychain item and keeps the token out of command arguments and output. Do not
construct a raw credential-bearing request. If the active review rejects credential use and forbids
another client or script, stop as described below.

## Diagnose the layer

- Bonjour plus `GET /` confirms that the Satellite HTTP service is reachable from that machine.
- `GET /mcp` returns public server metadata. It does not register the server in Codex or prove the
  MCP tool catalog loaded.
- Satellite's MCP `POST` requests require `Authorization: Bearer …`. A reachable endpoint can still
  fail MCP initialization or tool listing when authentication is missing or invalid.
- Codex tools are supplied to a particular host/session. A server advertised on the LAN does not
  appear automatically in the tool list.

## Check the affected Codex host and session

1. Confirm where the agent is running: local Codex Desktop/CLI/IDE, a remote executor, or a hosted
   Work session. A private LAN address is reachable only from a runtime with access to that LAN.
2. On the affected local Mac, inspect Codex Settings → MCP servers or run `codex mcp list` as the
   same macOS user. Compare the result with a working agent on that same host. Do not copy or expose
   credentials during the comparison.
3. Local Codex Desktop, CLI, and IDE share MCP configuration on the same host, normally in
   `~/.codex/config.toml`; trusted projects may also have `.codex/config.toml`. Check whether the
   server is disabled, overridden, or scoped to a different project or execution environment.
4. If the server is configured but missing from a session's tool list, restart/reload the Codex
   client and open a fresh local session, then inspect its MCP tools again. A working agent on the
   same host and a failing agent with no tool entry points to the failing session/runtime or its
   configuration scope, not Bonjour.

Use the current Bonjour resolution for the server URL, with `/mcp` appended. Do not put a discovered
IP in persistent configuration when the host can change; re-resolve it for the workflow.

## Authentication and review blocks

If an owner separately chooses to configure a Codex MCP connection, Codex Streamable HTTP supports
Bearer authentication through `bearer_token_env_var`, which names an environment variable available
to the local Codex process. The setting does not itself store or retrieve the secret. Never put the
token literal in `config.toml`, project files, chat, command arguments, or logs. Do not assume the
OAuth credential store accepts Ecelyo's static token. This optional setup is not needed for the
skill's HTTP workflow.

Only configure or use a credential source that the owner and the active review policy permit. If an
automatic review rejects sending the credential and explicitly forbids another client or script,
stop; do not switch transports, create an HTTP header helper, or use another process to retry the
same credentialed request. Report the rejected operation and ask the owner to configure an approved
credential path or a session where Ecelyo is already exposed as an authenticated MCP server. The
owner's intent to use Ecelyo does not override that review decision.

Once the server is configured, verify that Codex lists the Ecelyo tools in the affected session.
Do not infer MCP readiness from Bonjour, an HTTP 200 response, or the server's `/mcp` metadata.

For current Codex configuration options, see the [Model Context Protocol guide](https://learn.chatgpt.com/docs/extend/mcp).
