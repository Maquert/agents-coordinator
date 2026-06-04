---
name: software-project-workflow
description: Initialize and maintain lightweight project-governance files for software projects. Use when creating or updating AGENTS.md role instructions, setting default quality expectations, initializing a project git repository, creating versioned PRDs such as specifications/v1/prd.md, managing task lifecycle files under tasks/pending, tasks/wip, tasks/blocked, tasks/finished, and tasks/archived, and optionally maintaining a local ignored tasks/tasks.md checklist.
---

# Software Project Workflow

## Overview

Use this skill to give software projects a consistent product/specification workflow. It owns project governance files, task lifecycle files, and default role expectations; framework-specific skills remain the source of stack-specific scaffolding, build, platform, simulator, deployment, and validation preferences.

For Xcode projects, use this skill alongside `xcode-project-creator`; that skill remains authoritative for Xcode project scaffolding and Apple platform preferences. When `xcode-project-creator` applies, also use `xcode-terminal` plus `xcsift` for build and test diagnostics, use Point-Free `swift-snapshot-testing` for screenshot tests, keep each SwiftUI view in its own file with a counterpart test file, and name Swift extension files as `<BaseEntity>+<ExtensionName>.swift`, for example `UIDevice+Custom.swift`.

Do not add language-specific runtime dependencies, package managers, or build tooling through this skill. Add those only through the relevant stack-specific skill or an explicit user request. Project scripts are allowed under root `scripts/` when they document or automate common local workflows.

Always prefer simple reusable scripts over long one-off shell commands. Common build, test, validation, data-preparation, packaging, release, and snapshot workflows should be promoted into stable scripts with the fewest arguments possible, ideally no arguments. When a command needs environment variables, many flags, file-specific paths, redirection, pipes, or formatted output, put those details inside a script instead of asking an agent to execute the raw command. Prefer public no-argument wrapper scripts backed by private helper scripts when several workflows share project, scheme, destination, cache, result bundle, output directory, or formatter settings. Scripts that produce results should write to stable ignored output paths, such as `.build-results/<workflow>/...`, so agents can inspect results without unique filenames or extra approval-specific command text.

## Default Workflow

1. Inspect the project root before editing: look for `.git/`, `AGENTS.md`, `specifications/`, task lifecycle folders, any existing local task checklist such as `tasks/tasks.md`, `scripts/`, `.gitignore`, package files, and existing local conventions.
2. Preserve existing project instructions and task content. Merge missing workflow requirements instead of replacing files.
3. Create only missing workflow files and directories.
4. Keep `specifications/` for versioned project requirements and root `tasks/` for lifecycle tracking. Task detail files under `tasks/` are the tracked project record. Any `tasks.md` checklist is optional local state and must stay ignored by Git.
5. Validate the resulting structure with shell commands and a quick content check.

## Initialize A Project

After or alongside project creation, initialize the workflow with direct file operations and git commands.

This creates:

- A git repository at the project root if one does not already exist.
- `AGENTS.md` from the bundled template unless one already exists.
- `specifications/` for grouped product requirements, technical specifications, versioned PRDs, ADRs, and project requirements.
- `specifications/v1/prd.md` as the required initial Product Requirements Document placeholder when one does not already exist.
- A design system specification, initially under `specifications/v1/design-system/`, when the project has no existing design-system location.
- `scripts/` for frequently used project scripts, grouped by category.
- `scripts/used_scripts.md` as reusable documentation for commands and script patterns used during development.
- `tasks/pending/`, `tasks/wip/`, `tasks/blocked/`, `tasks/finished/`, and `tasks/archived/`.
- `tasks/aux_assets/` for temporary task-specific attached images, sounds, and audiovisual references.

Use the bundled template at `assets/AGENTS.md.template` as the source for a new `AGENTS.md`. If `AGENTS.md` already exists, merge the template manually instead of overwriting unless the user explicitly asks to replace it.

Create `specifications/v1/prd.md` with a short placeholder only when it is missing:

```markdown
# Product Requirements Document

## Overview

TBD.

## Goals

- TBD.

## Requirements

- TBD.
```

Create `specifications/v1/design-system/overview.md` with a short placeholder only when no design-system specification exists:

```markdown
# Design System

## Overview

TBD.

## Principles

- TBD.

## Components

- TBD.
```

Create `scripts/used_scripts.md` with a short local index only when it is missing:

```markdown
# Used Scripts

## Commands

- TBD.

## Patterns

- TBD.
```

Keep `scripts/used_scripts.md` out of git history by adding it to `.gitignore`.

Keep every `tasks.md` file out of git history. Add this exact entry to `.gitignore` when it is missing:

```gitignore
tasks.md
```

Create `tasks/aux_assets/` when it is missing and add this exact entry to `.gitignore` when it is not already ignored:

```gitignore
tasks/aux_assets/
```

## Git Repository

Every initialized project must be a git repository.

- Run `git init` at the project root when `.git/` is missing.
- Do not reinitialize or replace an existing `.git/` directory.
- After validation passes, commit focused work when it can be committed without including unrelated user changes. Do not commit when validation fails, when checks cannot run, or when a focused commit would include unrelated changes.
- Do not push or create remotes unless the user explicitly asks for remote setup.

## Task Rules

Use task detail files under `tasks/` as the project source of truth. Any local checklist such as `tasks/tasks.md` is optional convenience state only; do not require it for task selection, and do not create, restore, or commit any `tasks.md` file unless the user explicitly asks for that workflow.

- Every item must use Markdown checkbox syntax.
- Every item must include its task id in square brackets immediately before the title.
- Pending items must use `- [ ] [<task-id>] Task title`.
- Finished items must use `- [x] [<task-id>] Task title`.
- In-progress items must use `- [ ] [WIP] [<task-id>] Task title`.
- Before starting implementation from a checklist task, edit the matching unchecked line from `- [ ] [<task-id>] Task title` to `- [ ] [WIP] [<task-id>] Task title`.
- Place `[WIP]` immediately after the unchecked marker and before the task id. Do not append `[WIP]` at the end of the title.
- When selecting the next checklist task, prioritize plain unchecked items first. If none remain, continue the smallest matching item already marked `- [ ] [WIP]` instead of treating the checklist as complete.
- When no plain unchecked tasks and no active `[WIP]` tasks remain, write `Status: no task available. Last checked: <YYYY-MM-DD>.` near the top of the local checklist when one exists.
- Before scanning a large checklist, check for `Status: no task available` near the top of the local checklist when one exists; if present, skip the full scan unless the file changed after that status was written or the user explicitly requests a rescan.
- When adding or starting a new task, remove the `Status: no task available` line before marking the task `[WIP]`.
- Every product, code, documentation, asset, workflow, or test change must have a task detail file under `tasks/` before implementation starts.
- If the project already uses a local checklist and the user explicitly wants it maintained, create or update the matching checklist item there; otherwise rely on the task detail file alone.
- If continuing an item that is already marked `[WIP]`, leave the marker in place.
- On completion, remove `[WIP]` and mark the line as `- [x] [<task-id>] Task title`; if the project requires commits before closing tasks, close the item only after the commit succeeds.
- Pending, blocked, and archived open items must remain unchecked.
- New task detail files must start under `tasks/pending/`.
- Move detail files to `tasks/wip/`, `tasks/finished/`, `tasks/blocked/`, or `tasks/archived/` as state changes.
- Every task detail file must have an explicit `id` header value.
- Every task detail file must have an explicit `priority` header value when the repository defines task priorities.
- Every task detail file must have an explicit `branch` header value.
- Each task must have exactly one assigned branch for implementation work.
- Before starting or continuing a task, verify whether the assigned branch exists locally or on the default remote.
- If the assigned branch exists locally, check it out before making changes.
- If the assigned branch exists only on the remote, recreate the local branch from that remote branch and check it out before making changes.
- If the assigned branch does not exist, create it from the appropriate base branch, assign it in the task detail file, and check it out before making changes.
- Do not implement task work on `main` or another shared branch when a task-specific branch should be used.
- Prefer a random UUID for new task ids when that is the cheapest practical option.
- Reuse an existing task id when updating or moving an existing task detail file.
- Name task detail files `<task-id>-<slug>.md`.
- Every task must be categorized as exactly one of `bug` or `feature`.
- Record that category in the task detail header with a `category` field.
- When the repository defines task-priority vocabulary, record it in the task detail header with a `priority` field and use the repository fallback for missing values.
- Choose `bug` for defect fixes, regressions, broken behavior, and incorrect existing behavior.
- Choose `feature` for net-new capability, enhancements, refactors in service of new capability, and intentional product additions.
- Each detail file header must contain `id`, `title`, `status`, `category`, `branch`, `creation date`, `last update`, and `labels`, plus `priority` when the repository uses task priorities.
- Blocked tasks must add `blocked by: <task id>` to the task detail header.
- Archived tasks must add `archived on: <date>`.
- The task description must include `Summary` and `Acceptance Criteria` sections.
- When creating a task from a user prompt, keep the detail file compact by capturing `Goal`, `Constraints`, and `Acceptance Criteria` when available; omit unknown fields instead of inventing them.
- When available, add `Goal` and `Constraints` sections before `Acceptance Criteria` in the task detail file.
- Use `Goal` for the intended outcome, `Constraints` for must/must-not rules and dependencies, and `Acceptance Criteria` for observable completion checks.

## Task Creation Prompts

Treat a user prompt that starts with `new task:` as a task-creation-only request unless the user clearly says to implement work as well.

- Rewrite the prompt into a concise task title suitable for the task detail file and any existing local checklist.
- Create or update the matching task detail file.
- Do not implement the requested product, code, documentation, asset, workflow, or test change from that prompt.
- Ask a clarifying question only when the task cannot be created without inventing core behavior or acceptance criteria.

Use this detail-file shape:

```markdown
---
id: 550e8400-e29b-41d4-a716-446655440000
title: Add settings screen
status: pending
category: feature
priority: Medium
branch: task/550e8400-add-settings-screen
creation date: 2026-05-13
last update: 2026-05-13
labels: [product-ui]
---

# Add settings screen

## Summary

TBD.

## Goal

TBD.

## Constraints

- TBD.

## Acceptance Criteria

- TBD.
```

When moving a task, update both the lifecycle folder and the `status` header. Preserve the task id, title, creation date, labels, summary, and acceptance criteria unless the user asks to change them.

## Task Auxiliary Assets

Use `tasks/aux_assets/` for temporary task-specific image and sound assets, such as screenshots, mockups, visual bug reports, drafts, reference images, audio captures, sound effects, voice notes, or reference sounds that an agent needs to start, review, or fix a task.

- Create `tasks/aux_assets/` when an attached image or sound asset is needed and the folder does not exist.
- Keep `tasks/aux_assets/` ignored by Git with `tasks/aux_assets/` in `.gitignore`; add the entry when it is missing or the folder is otherwise not ignored.
- Store each attached task asset under `tasks/aux_assets/`.
- Name each asset with the related task id, an incrementing number, and optionally a short meaning chosen by the agent: `<task-id>-<number>[-<meaning>].<extension>`.
- Use lowercase, hyphenated or underscored meanings that describe the asset briefly, for example `12345-1-new_detail_screen_draft.png` or `12345-2-error_chime.wav`.
- Use the task id from the checklist detail file when one exists; otherwise create or identify the task before storing the asset so the filename has a stable task id.
- When work starts on a task, inspect `tasks/aux_assets/` for files that begin with that task id and use the relevant assets as task context.
- When the task completes, remove all `tasks/aux_assets/<task-id>-*` files for that task before marking the task finished.
- Do not store durable product assets, source media, generated app assets, or files that should ship with the product in `tasks/aux_assets/`; move those into the appropriate project asset directory and track them normally.

## Specifications Directory

Use `specifications/` as the canonical project requirements folder.

- Do not use `specs/` for projects initialized or governed by this skill.
- Use versioned PRDs, starting with `specifications/v1/prd.md`; later major versions should use paths such as `specifications/v2/prd.md` so major-version spec diffs remain easy to reason about.
- Preserve existing versioned PRDs; do not overwrite project-specific PRD content.
- Put new specification files under a dedicated umbrella folder inside `specifications/`.
- Group similar specifications under the same folder, for example `specifications/assets/main_screen_assets.md`.
- Fuse closely related specification files when one shorter file is easier for agents to read than several fragmented files.
- Keep each specification file under 300 lines so agents can read and assimilate it in context.
- Rewrite or simplify older specification text when that preserves intent while keeping files shorter.
- Keep PRDs, ADRs, technical specifications, product requirements, architecture notes, and grouped requirement documents under `specifications/`.
- Keep task lifecycle detail files under root `tasks/`.

## Design System

Every governed project must have a design system specification.

- Create a design-system specification under the active versioned specification folder when none exists, for example `specifications/v1/design-system/overview.md`.
- Consult the current design system before making design decisions or UI changes.
- Record accepted design decisions in the design system so future work follows the same product language.

## File Organization

Use one entity per file for source files, tests, and reusable project artifacts when the stack supports it.

- A file should not contain more than one entity.
- Match filenames to the entity they define.
- For Xcode projects governed through `xcode-project-creator`, each SwiftUI view must live in its own file and have a counterpart test file.
- For Xcode projects governed through `xcode-project-creator`, Swift extension files must be named after the base entity plus a name for the extension, using `<BaseEntity>+<ExtensionName>.swift`, for example `UIDevice+Custom.swift`.

For routine task changes, update the matching task detail file and move it between lifecycle folders. Edit a local checklist only when the project already uses one. Preserve the task id, title, creation date, labels, and description while updating `last update` and lifecycle-specific headers.

## Scripts Directory

Every initialized project must have a root `scripts/` directory.

- Create `scripts/` when it is missing.
- Group frequently used scripts by category, for example `scripts/build/`, `scripts/test/`, `scripts/data/`, `scripts/release/`, or project-specific categories.
- Prefer adding shared auxiliary files for data, configuration, fixtures, or common script settings when that avoids duplicating values across scripts.
- Prefer stable public scripts with the fewest arguments possible for common workflows; no-argument scripts are preferred for frequently repeated build, test, validation, and snapshot commands.
- Do not leave repeated long commands in chat, task notes, or `scripts/used_scripts.md` as the primary workflow when they contain environment variables, many flags, file-specific result paths, shell redirection, pipes, or formatter invocations. Promote them into scripts.
- Use public no-argument wrappers backed by private helpers when multiple commands share the same setup. The public wrapper should express the action; the helper should own shared project, scheme, destination, derived data, result bundle, output directory, and formatter details.
- Scripts that generate artifacts should use stable ignored output paths under locations such as `.build-results/<workflow>/`, `.derivedData/<workflow>/`, or project-specific ignored folders so future agents can rerun and inspect results without inventing new filenames.
- Start script documentation in `scripts/used_scripts.md`; record commands, script names, purpose, required environment, and notable patterns there so future agents can reuse known-good commands.
- Treat `scripts/used_scripts.md` as reusable local developer and AI-agent memory, not project history.
- Keep `scripts/used_scripts.md` untracked by adding it to `.gitignore`.
- Promote repeated manual commands from `scripts/used_scripts.md` into categorized scripts when they become stable and useful.

## AGENTS.md Expectations

Use `assets/AGENTS.md.template` as the starting point for new projects. Preserve these defaults even when the project has not asked for them explicitly:

- Maintain at least 80% app source coverage with unit tests.
- Add or update UI regression tests for UI changes; prefer screenshot tests when the stack supports them.
- For Xcode and screenshot-driven UI projects, require UI tasks to record and commit every affected macOS, iPad, and iPhone baseline before the task can be marked finished.
- Require a design system and keep accepted design decisions reflected in it.
- Use one entity per file wherever the stack supports it.
- Define roles for Product Designer, Developer, QA Engineer, and Scout.
- Load stack-specific skills when applicable, such as `xcode-project-creator` for Xcode projects.
- For Xcode projects governed through `xcode-project-creator`, also load `xcode-terminal` and `xcsift` for build/test diagnostics, use Point-Free `swift-snapshot-testing` for screenshot tests, keep one SwiftUI view per file with a counterpart test file, and use `<BaseEntity>+<ExtensionName>.swift` for Swift extension filenames.

When a project already has an `AGENTS.md`, merge these requirements into the existing file while preserving stricter local instructions.

## Role Behavior

- Product Designer: plan mode, product requirements, challenges product decisions, asks for missing detail.
- Developer: production code, technical challenges only, validates with unit tests.
- QA Engineer: validates and fixes against supplied requirements, never challenges product or technical decisions.
- Scout: researches the internet and retrieves approved data, references, and assets with source tracking.

## Validation

After editing this workflow or using it in a project:

1. Initialize a temporary directory manually and confirm `.git/`, `AGENTS.md`, `specifications/`, `specifications/v1/prd.md`, a design-system spec, and task lifecycle folders exist.
2. Exercise task lifecycle changes manually for `add`, `start`, `block`, `archive`, and `finish` paths.
3. Confirm any local checklist uses `- [x]` for finished items and `[WIP]` immediately after `- [ ]` for in-progress titles, and confirm no `tasks.md` file is tracked by Git.
4. Confirm task detail headers include `status` and the lifecycle folder matches it.
5. Confirm new non-PRD specification files live under a dedicated `specifications/<topic>/` folder and stay under 300 lines.
6. Confirm root `scripts/` exists and `scripts/used_scripts.md` is excluded from git tracking through `.gitignore`.
7. Confirm `tasks/aux_assets/` exists when task image or sound assets are needed, is excluded from git tracking through `.gitignore`, uses `<task-id>-<number>[-<meaning>].<extension>` filenames, and is cleaned for completed tasks.
8. Confirm common long build, test, validation, and snapshot commands are represented by reusable scripts with minimal arguments, and that result-producing scripts use stable ignored output paths.
9. Confirm Xcode-only requirements remain conditional on `xcode-project-creator`.

## Minimum Validation Set

When this skill is used to define or update project workflow expectations, ensure the project instructions mention the minimum validation set required before closing a task.

- For non-UI code changes, the minimum set should include the repo’s primary unit-test or equivalent validation wrapper.
- For UI changes in Xcode or screenshot-driven projects, the minimum set should explicitly include:
  - the repo’s primary unit-test wrapper
  - the repo’s screenshot verification workflow
  - every affected screenshot recording workflow for macOS, iPad, and iPhone, unless a platform is explicitly out of scope or has no affected baseline
- Project instructions should make clear that a UI task is unfinished if affected screenshot references were not recorded, intentionally confirmed unchanged, and revalidated.
