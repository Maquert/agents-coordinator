---
name: automation-creator
description: Create or update Codex automations under ~/.codex/automations (automation.toml). Use whenever the user asks to create, add, set up, modify, update, fix, or troubleshoot an automation entry, or when an automation is missing from the Automations list.
---

# Automation Creator

Use this skill to create, update, or troubleshoot Codex automations stored as TOML under `~/.codex/automations/<automation-id>/automation.toml`.

## Inputs to Collect (ask only if missing)

- Prefer the following four fields up front to avoid confusion:
  - `id`, `kind`, `status`, `rrule` (when `kind = "cron"`)

- `id` (folder name under `~/.codex/automations/`)
- `name`
- `kind` (`cron` or other supported kind already used in the user’s automations)
- `prompt` (keep short; prefer delegating procedural detail to another skill)
- `status` (`PAUSED` unless the user explicitly wants it active)
- `rrule` (when `kind = "cron"`)
- `model`, `reasoning_effort`, `execution_environment`, `cwds`

## Workflow

1. Locate a baseline automation to copy (often the closest existing automation).
2. Create or update `~/.codex/automations/<id>/automation.toml`.
3. Keep the automation prompt minimal and non-redundant:
   - Prefer referencing existing repo skills/instructions instead of duplicating long step lists.
4. Validate formatting and parseability:
   - Ensure the TOML is valid (no malformed strings/arrays).
   - Ensure required keys are present for the selected `kind`.
5. Troubleshoot “doesn’t show in Automations” by checking for TOML parse errors first.

## Known Formatting Pitfall (Learning)

If an automation doesn’t appear in the Automations UI, a common cause is invalid TOML.

In particular, **do not escape quotes inside TOML arrays of strings**.

- Bad (invalid TOML in practice):
  - `cwds = [\"/path/to/repo\"]`
- Good:
  - `cwds = ["/path/to/repo"]`

This applies to any string arrays, not just `cwds`.

## Validation Commands (local)

Prefer a fast TOML parse check after edits:

```sh
python3 - <<'PY'
import sys, pathlib
try:
    import tomllib  # Python 3.11+
except Exception as e:
    raise SystemExit(f"tomllib unavailable in this python3 ({e}); validate TOML by comparing to a known-good automation.")
path = pathlib.Path.home()/".codex/automations"/sys.argv[1]/"automation.toml"
tomllib.loads(path.read_bytes())
print("OK", path)
PY <automation-id>
```

If Python is not available, fall back to a strict visual check and compare structure to a known-good existing automation TOML.

## Output Expectations

When the user asks to create or update an automation:

- Report the file path written/updated.
- Mention whether the TOML parse validation passed.
- If you changed the prompt, summarize how redundancies were removed.

## User Prompt Template (recommended)

Encourage the user to include these fields so automation-creation requests are unambiguous and don’t accidentally target the wrong automation:

```text
Change automation:
id: <automation-id>
kind: <cron|...>
status: <PAUSED|ACTIVE>
rrule: <RRULE:...>   (required for cron)
base automation (optional): <id>
cwds: ["/absolute/repo/path", ...]
model (optional): <model>
reasoning_effort (optional): <low|medium|high>
execution_environment (optional): <local|...>
prompt: <short prompt body>
```

If any of `id`, `kind`, `status`, or `rrule` (for cron) are missing, ask for them before writing files.
