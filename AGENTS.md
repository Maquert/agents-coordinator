# Summary

## Global Resource Routing
- The source of truth is under `~/.agents`.
- Commands, skills, worktrees, and any other agent resources must be checked under `~/.agents` first unless stated otherwise.

## Default Task System
- The default task system for all agents is the Ecelyo system, not repository `tasks/` directories.
- A prompt whose first non-whitespace text is `New task:` (case-insensitive) must load and use the `task-processor` skill for task intake.
- For a `New task:` prompt, capture the remainder as a task and do not implement it in the same turn unless the user explicitly asks for both intake and implementation.
- The `New task:` prefix authorizes task intake but does not by itself opt into legacy repository task markdown files. Keep Ecelyo as the task store unless the prompt separately requests the legacy file workflow.
- The default methodology for all agents working for you is `ecelyo-methodology`.
- By default, agents must load and use the `ecelyo-local-server` skill before performing task selection, task status reads, or task status updates unless a stronger local instruction explicitly overrides it.
- Treat the Ecelyo local HTTP server as the primary workflow state for task progress updates.
- Treat Ecelyo as a task-system philosophy, not only as an app or HTTP server.
- The `ecelyo-methodology` skill is mandatory and is the shared philosophy reference for how work should be structured in Ecelyo. Read it alongside `ecelyo-local-server` when the workflow depends on Ecelyo.
- Tactics must share one common goal and move toward one common end task.
- Scoped tactics are better than massive tactics. When in doubt, create a new tactic instead of adding clutter to an existing one.
- Stop using repository `tasks/`, including flows managed by `workflow-manager`, for the moment.
- Treat repository `tasks/` directories as legacy examples only. They exist to show what a well-defined task can look like and are no longer part of the active workflow.
- Do not create, update, move, or rely on task markdown files under `tasks/` unless the user explicitly says to use that legacy example workflow.
- No task may proceed without a working Ecelyo server connection.
- If an agent cannot connect to the Ecelyo local server when task synchronization is expected, it must stop and explicitly ask the user to start the server before continuing.
- Treat missing Ecelyo connectivity as a blocking error, not as a degraded mode.
- If the Ecelyo local server is unreachable, mention the likely cause when known, such as disabled server or wrong port.
- Write Ecelyo task, tactic, and related descriptions in Markdown by default so they stay readable for both agents and humans.
- Ecelyo tasks must always have an `agentRole`.
- Preferred default Ecelyo agent roles:
  - `Product Manager`: creates or refines tasks.
  - `Developer`: executes code changes.
  - `QA`: validates work; does not execute unless fixing is needed.
  - `Localization Team`: updates wording, semantics, and internationalization-related behavior; can make code changes when needed.
  - `Product Designer`: focuses on visual descriptions, images, assets, icons, and aesthetic refinement; may make minimal code changes when needed.
- Create custom agent roles when the provided roles do not fit the task well, but do not leave `agentRole` empty.
- When the `ecelyo-methodology` skill is in use and the Ecelyo API is missing an operation needed to preserve the methodology, record that as follow-up work for the Ecelyo project under the `local server improvements` tactic.
- When an agent needs to perform a task-related API action that the Ecelyo server does not support, the agent must add that need as work for the Ecelyo project at `/Users/mhjaso/Developer/Projects/ecelyo_app`.
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

## Mandatory Task Execution Closeout

When an agent selects, executes, advances, or batch-processes a task, it must close the task
explicitly before ending the response. “Implemented” or “PR opened” is not a finished task. The
agent must continue through validation, pull-request creation, merge, worktree and branch cleanup,
and Ecelyo state synchronization as required by the active task skill.

If the task cannot be completed safely, the agent must update Ecelyo to `blocked` (or preserve the
accurate active state when the blocker is outside the API's control), explain the exact blocking
gate, and stop without claiming success. A blocked task must never be described as finished.

Every task-execution final response must include this clearly labeled closeout, even when a field is
not applicable. Use `N/A — <reason>` instead of omitting a field:

| Task closeout field | Required value |
| --- | --- |
| Project | Ecelyo project name and id |
| Tactic | Ecelyo tactic name and id |
| Task | Task title and id |
| Pull request | URL plus `merged`, `open`, or `not created` |
| Branch | Concrete task branch, or `N/A` with reason |
| Worktree | Removed/clean, or the exact cleanup blocker |
| Task status | `**FINISHED**` only after all completion gates; `**BLOCKED**` when blocked |

For a batch, include one closeout row per task and a final batch status. The final status must be
unambiguous: use `Task Status: **FINISHED**` only when the task is fully resolved, or
`Task Status: **BLOCKED**` when any required gate remains unresolved. Do not end a task execution
with a vague status such as “done,” “implemented,” “ready,” or “PR pending.”

## Skill Routing
- Unless stronger local instructions override it, load and use `ecelyo-methodology` as the default methodology skill for work done for this user.
- When the first non-whitespace text in a user prompt is `New task:` (case-insensitive), always load and use `task-processor`, capture the remainder as task-intake content, and do not execute the captured work unless explicitly asked to do both.
- When the user asks about the Ecelyo way of work, tactic structure, completion-first planning, WIP discipline, or the general Ecelyo philosophy, load and use the `ecelyo-methodology` skill.
- When task state must be read, updated, synchronized, or created through the Ecelyo system, load and use the `ecelyo-local-server` skill.
- When the user asks to create, configure, export, package, or document a custom ChatGPT GPT/agent, load and use the `chatgpt-agent-creator` skill.
- When the user asks to use GitHub CLI, push changes to remote branches, create or inspect pull requests, or check GitHub remote status, load and use the `github-cli-operator` skill.
- When the user asks to plan a new technical project or write stakeholder-facing ADRs, RFDs/RFCs, technical specifications, architecture design documents, or related project planning docs, load and use the `project-planner` skill.
- When the user asks to build, test, archive, diagnose, or maintain Xcode projects from the terminal, load and use the `xcode-terminal-operator` skill and also use `xcode-output-parser` for build/test output.
- When any screenshot, snapshot, visual-regression, or image-baseline test fails, renders malformed output, flakes, or may have stale references, immediately load and use `screenshot-test-troubleshooter` before changing code or recording baselines.

## Execution
- Before running any command that can access a private key or trigger a macOS Keychain or SecurityAgent prompt, obtain the user's explicit approval immediately before execution. A general request to build, archive, publish, commit, or continue is not sufficient approval for private-key access.
- Treat signed builds, `codesign`, signed Xcode archives/exports/uploads, notarization, certificate or private-key import/export, Keychain access-control changes, and interactive commit signing as private-key operations requiring this immediate approval.
- Before requesting approval, state which operation will use the key, its purpose, and which system prompt may appear. Do not launch the operation speculatively, in the background, or while waiting for approval.
- Never ask the user to provide a Keychain or private-key password in chat; the user must enter it only in the trusted system dialog.
- If a private-key authorization prompt appears unexpectedly, stop the initiating process immediately, disclose what triggered it, and wait for explicit approval before retrying.
- Read-only certificate or provisioning-profile inspection and unsigned or ad-hoc validation that cannot access a private key may proceed without this approval.
- Whenever planning to execute code or commands that are likely to require approval, anticipate the permission need and request it early so the user can step away while work continues.
- For automation prompts that require Git writes, include “request escalation for branch/merge/push if sandbox blocks Git metadata” so the automation can ask for approval early when needed.
- For task workflows, verify Ecelyo local server connectivity early when the run depends on task state or task updates.
- Do not create repository task markdown files as a fallback, convenience step, or side effect when Ecelyo-backed work is requested.
- For task creation and reassignment in Ecelyo, evaluate tactic fit explicitly before adding work.
- Whenever creating an Ecelyo task, assign an explicit `agentRole` at creation time.
- When creating or updating descriptions in Ecelyo, prefer clean Markdown structure over plain prose blobs.
- Prefer an existing tactic only when the new work shares the same tactical arc; otherwise create a new tactic instead of piling unrelated tasks into an existing one.
- When creating a new tactic, include or plan for a clear starting task and a clear final task so tactic completion is legible.
- If Ecelyo connectivity fails during a task-dependent workflow, stop immediately and ask the user to start the server.
- Surface failed Ecelyo synchronization as a blocking error, not as a quiet note or optional warning.
- Make clear that no task work can proceed until the Ecelyo server responds.
- When the Ecelyo API is missing a needed operation, do not silently work around it and stop there; create or update the corresponding Ecelyo project issue under `/Users/mhjaso/Developer/Projects/ecelyo_app`, using the project issues area and the `local server improvements` tactic.
- When a task file or repository map already narrows the relevant files, use that narrower scope first instead of widening the read set by default.
- For UI work, start with the narrowest dedicated screenshot or snapshot contract that covers the changed surface; only widen to broader screenshot suites after the focused path is missing or proves insufficient.
- Mock implementations and debug-only code must never ship in release builds; guard them under the `DEBUG` compiler flag and keep release codepaths free of mock/debug-only dependencies.
- By default, petitions for this `~/.agents` project must be committed on `main` and pushed to `origin` unless the user explicitly says otherwise.
- When the user says `Commit the changes` or `Comit the changes`, interpret it as: group related changes, choose one commit message per group, stage each group, create local git commits, and push them to `origin/main` for this project unless the user explicitly says otherwise.
- If a pull request is updated after its related task was already marked finished, the agent must move that task back to `in progress`.
- Pull request merge policy by task priority:
  - `Trivial`: agents should open and merge the PR by default.
  - `Medium`: agents should open and merge the PR by default unless the PR is large or complex enough that human review is warranted; the agent decides.
  - `High`: agents should prefer human review, but may merge the PR themselves when the implementation is clearly trivial and low-risk.
  - `Blocker` or critical work: agents must not merge the PR themselves; human review is required before merge.
- If there have been changes to code in a repository, propose a brief git commit message at the end. Otherwise ignore this instruction. Commit messages must start with a verb and stay under 100 characters. Use this pattern: `<verb><object complement><optional extra content>`. Example: `Add configuration for a deploy pipeline`.

## Review
- When reviewing, perform a git diff against the `main` branch to learn which files changed.
- Review those files.
- Write the review result in a `REVIEW.md` file.

## Markdown Formatting
- When markdown output is requested, return it in code format.

@/Users/mhjaso/.codex/RTK.md

## Imported Claude Cowork project instructions
