# agents-coordinator

Personal agent workspace for Codex and Claude automation assets.

This repository collects reusable skills, command docs, task workflow helpers, and local configuration artifacts for agent workflows. The source of truth for agent resources is `~/.agents`, and commands, skills, worktrees, and related assets should be resolved there first unless a task says otherwise.

Codex and Claude are expected to operate from this repository's shared resources. In practice, that means both platforms are forced to use the skills, commands, worktrees, and task-writing conventions defined here, including task files that are created or updated as part of skill workflows.

This is implemented through symlinks inside each platform folder such as `.claude`, `.codex`, and eventually `.gemini`. Those symlinks expose the directory structure each platform expects while actually pointing back to the shared resources under `~/.agents`.

## What is in this repository

- `skills/`: reusable Codex skills for GitHub workflows, project planning, Xcode work, task automation, cost estimation, and related agent behaviors.
- `commands/`: markdown command prompts and task execution notes.
- `codex/`: Codex-local configuration artifacts.
- `tasks/`: ignored working directory for local task state.
- `worktrees/`: ignored working directory for local git worktrees.

## Shared behavior model

- `skills/` and `worktrees/` are common resources shared by Codex and Claude and are typically inferred automatically from the current workspace and task flow.
- `commands/` are consumed more explicitly: they are leveraged by Codex automations and Claude Code routines when those platform-specific workflows run.
- `tasks/` is writable shared state. Skills may instruct either platform to create, move, update, or complete task files there as part of their normal execution.
- `codex/` contains Codex-specific configuration, while Claude uses its own platform-specific configuration outside this folder.
- Even with platform-specific configuration differences, this repository remains the shared behavior layer. Updating it changes how both Codex and Claude behave without needing to propagate the same resource changes separately into each platform.
- Gemini support is still TBD.

Example:

```bash
~/.claude/skills -> ~/.agents/skills
```

With that symlink in place, Claude reads `~/.claude/skills` as usual, but the actual source of truth remains `~/.agents/skills`.

## Typical usage

Review the available task/worktree conventions:

```bash
open tasks/README.md
```

Review the local worktree layout:

```bash
open worktrees/README.md
```

## Operating instructions

### Resource routing

- Treat `~/.agents` as the canonical location for shared agent resources.
- Check `~/.agents` before looking elsewhere for commands, skills, worktrees, and related assets.

### Response metadata

- End each response with a compact Markdown table using `Item` and `Value` columns.
- Include whether a skill was used, and name the skill when applicable.
- Preferred format:

```md
| Item | Value |
| --- | --- |
| Skill | No skill used. |
```

### AI efficiency coaching

- Load and use the `ai-efficiency-coach` skill when responding to follow-up instructions or prompt adjustments.
- Treat references to `ai-efficiency-skill` as `ai-efficiency-coach`.
- Include one brief `AI efficiency feedback:` note when it improves prompt, skill, or workflow efficiency without distracting from the main task.

### Skill routing

- Use `create-chatgpt-agent` for requests to create, configure, export, package, or document a custom ChatGPT GPT or agent.
- Use `gh-cli` for GitHub CLI workflows, remote pushes, pull requests, or remote-status checks.
- Use `project-planning-docs` for stakeholder-facing planning documents such as ADRs, RFCs, and technical specifications.
- Use `xcode-terminal` and `xcsift` together for Xcode build, test, archive, diagnosis, and maintenance tasks.

### Execution and review

- If a command is likely to need approval in another environment, request it early so work can continue unattended.
- For automation prompts that require Git writes, include: `request escalation for branch/merge/push if sandbox blocks Git metadata`.
- Interpret `Commit the changes` and `Comit the changes` as a request to create local commits only, grouped logically with one concise message per group.
- When reviewing, diff against `main`, review the changed files, and write the result to `REVIEW.md`.

### Markdown formatting

- When Markdown output is explicitly requested, return it in code format.

## Repository notes

- `tasks/` and `worktrees/` are intentionally git-ignored except for placeholder keep files.
- This repo is intended as a personal agent toolkit and workspace seed rather than a packaged application.
