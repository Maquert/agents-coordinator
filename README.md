# mhjaso-agents

Personal agent workspace for Codex and Claude automation assets.

This repository collects reusable skills, command docs, task workflow helpers, and small install scripts for copying local agent bundles into the expected user directories.

## What is in this repository

- `skills/`: reusable Codex skills for GitHub workflows, project planning, Xcode work, task automation, cost estimation, and related agent behaviors.
- `_routines/`: installable automation/task bundles and helper scripts for Codex and Claude.
- `commands/`: markdown command prompts and task execution notes.
- `codex/`: Codex-local configuration artifacts.
- `tasks/`: ignored working directory for local task state.
- `worktrees/`: ignored working directory for local git worktrees.

## Included helper scripts

- `_routines/codex_install.sh`: copies an automation directory into `~/.codex/automations`.
- `_routines/claude_install.sh`: copies a Claude scheduled-task directory into `~/.claude/scheduled-tasks`.
- `_routines/codex_to_claude.sh`: helper for moving a task bundle toward Claude's layout.
- `_routines/claude_to_codex.sh`: helper for moving a task bundle toward Codex's layout.

## Typical usage

Install a Codex automation:

```bash
./_routines/codex_install.sh /path/to/automation-dir
```

Install a Claude scheduled task:

```bash
./_routines/claude_install.sh /path/to/task-dir
```

## Repository notes

- `tasks/` and `worktrees/` are intentionally git-ignored except for placeholder keep files.
- This repo is intended as a personal agent toolkit and workspace seed rather than a packaged application.
