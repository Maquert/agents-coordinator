# Summary

## Global Resource Routing
- The source of truth is under `~/.agents`.
- Commands, skills, worktrees, and any other agent resources must be checked under `~/.agents` first unless stated otherwise.

## Default Task System
- The default task system for all agents is the Lylat system, not repository `tasks/` directories.
- By default, agents must load and use the `lylat-local-server` skill before performing task selection, task status reads, or task status updates unless a stronger local instruction explicitly overrides it.
- Treat the Lylat local HTTP server as the primary workflow state for task progress updates.
- Treat Lylat as a task-system philosophy, not only as an app or HTTP server.
- The `lylat-methodology` skill is the shared philosophy reference for how work should be structured in Lylat, and it should be read alongside `lylat-local-server` when the workflow depends on Lylat.
- Tactics must share one common goal and move toward one common end task.
- Scoped tactics are better than massive tactics. When in doubt, create a new tactic instead of adding clutter to an existing one.
- Stop using repository `tasks/`, including flows managed by `workflow-manager`, for the moment.
- No task may proceed without a working Lylat server connection.
- If an agent cannot connect to the Lylat local server when task synchronization is expected, it must stop and explicitly ask the user to start the server before continuing.
- Treat missing Lylat connectivity as a blocking error, not as a degraded mode.
- If the Lylat local server is unreachable, mention the likely cause when known, such as disabled server or wrong port.
- When the `lylat-methodology` skill is in use and the Lylat API is missing an operation needed to preserve the methodology, record that as follow-up work for the Lylat project under the `local server improvements` tactic.
- When an agent needs to perform a task-related API action that the Lylat server does not support, the agent must add that need as work for the Lylat project at `/Users/mhjaso/Developer/Projects/lylat_app`.
- File that follow-up under the project issues and the tactic `local server improvements`.
- If the needed project issue or tactic does not exist, create it.

## Response Metadata
- At the end of every response, include a compact Markdown table with columns `Item` and `Value`.
- The table must include whether a skill was used (which ones).
- If the session knows from the start that it will load a skill, the first message must clearly include a Markdown table with columns `skill` and `why`.
- Use this template for the first-message skill table:
  `| Skill | Why |`
- Keep the `why` column very brief and telegraphic, using labels or keywords rather than sentences.
- Preferred final-response format:
  `| Item | Value |`
  `| --- | --- |`
  `| Skill | No skill used. |`

## Skill Routing
- When the user asks about the Lylat way of work, tactic structure, completion-first planning, WIP discipline, or the general Lylat philosophy, load and use the `lylat-methodology` skill.
- When task state must be read, updated, synchronized, or created through the Lylat system, load and use the `lylat-local-server` skill.
- When the user asks to create, configure, export, package, or document a custom ChatGPT GPT/agent, load and use the `chatgpt-agent-creator` skill.
- When the user asks to use GitHub CLI, push changes to remote branches, create or inspect pull requests, or check GitHub remote status, load and use the `github-cli-operator` skill.
- When the user asks to plan a new technical project or write stakeholder-facing ADRs, RFDs/RFCs, technical specifications, architecture design documents, or related project planning docs, load and use the `project-planner` skill.
- When the user asks to build, test, archive, diagnose, or maintain Xcode projects from the terminal, load and use the `xcode-terminal-operator` skill and also use `xcode-output-parser` for build/test output.

## Execution
- Whenever planning to execute code or commands that are likely to require approval, anticipate the permission need and request it early so the user can step away while work continues.
- For automation prompts that require Git writes, include “request escalation for branch/merge/push if sandbox blocks Git metadata” so the automation can ask for approval early when needed.
- For task workflows, verify Lylat local server connectivity early when the run depends on task state or task updates.
- For task creation and reassignment in Lylat, evaluate tactic fit explicitly before adding work.
- Prefer an existing tactic only when the new work shares the same tactical arc; otherwise create a new tactic instead of piling unrelated tasks into an existing one.
- When creating a new tactic, include or plan for a clear starting task and a clear final task so tactic completion is legible.
- If Lylat connectivity fails during a task-dependent workflow, stop immediately and ask the user to start the server.
- Surface failed Lylat synchronization as a blocking error, not as a quiet note or optional warning.
- Make clear that no task work can proceed until the Lylat server responds.
- When the Lylat API is missing a needed operation, do not silently work around it and stop there; create or update the corresponding Lylat project issue under `/Users/mhjaso/Developer/Projects/lylat_app`, using the project issues area and the `local server improvements` tactic.
- When a task file or repository map already narrows the relevant files, use that narrower scope first instead of widening the read set by default.
- For UI work, start with the narrowest dedicated screenshot or snapshot contract that covers the changed surface; only widen to broader screenshot suites after the focused path is missing or proves insufficient.
- Mock implementations and debug-only code must never ship in release builds; guard them under the `DEBUG` compiler flag and keep release codepaths free of mock/debug-only dependencies.
- When the user says `Commit the changes` or `Comit the changes`, interpret it as: group related changes, choose one commit message per group, stage each group, and create local git commits. It never means to push changes.
- If there have been changes to code in a repository, propose a brief git commit message at the end. Otherwise ignore this instruction. Commit messages must start with a verb and stay under 100 characters. Use this pattern: `<verb><object complement><optional extra content>`. Example: `Add configuration for a deploy pipeline`.

## Review
- When reviewing, perform a git diff against the `main` branch to learn which files changed.
- Review those files.
- Write the review result in a `REVIEW.md` file.

## Markdown Formatting
- When markdown output is requested, return it in code format.

@/Users/mhjaso/.codex/RTK.md

## Imported Claude Cowork project instructions
