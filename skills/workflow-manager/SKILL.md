---
name: workflow-manager
description: Initialize and maintain lightweight project-governance files for software projects, including AGENTS.md, versioned requirements, design-system documentation, scripts, and git conventions.
---

# Workflow Manager

Use this skill to establish or maintain project governance. Framework-specific skills remain
authoritative for scaffolding, builds, platforms, deployment, and validation.

Ecelyo is the sole task system for projects that use it. Do not create local task records,
checklists, locks, or mirrored task state. Task intake, ownership, acceptance criteria, progress,
and completion belong in Ecelyo through its live server.

## Default workflow

1. Inspect the project root for `.git/`, `AGENTS.md`, `specifications/`, `scripts/`, `.gitignore`,
   package files, and existing conventions.
2. Preserve existing instructions and merge missing requirements instead of overwriting them.
3. Create only the governance files and directories the user requested or that are required.
4. Keep product requirements, technical specifications, ADRs, and design decisions under
   versioned `specifications/` paths.
5. Validate the resulting structure and perform a focused content check.

## Initialize a project

When the user requests project initialization, create only missing pieces:

- A git repository if `.git/` is absent.
- `AGENTS.md` from the bundled template if absent.
- `specifications/` and `specifications/v1/prd.md` when requirements documentation is needed.
- A design-system specification under `specifications/v1/design-system/` when the project has none.
- `scripts/` and reusable command documentation when scripts are part of the project workflow.

Keep reusable command indexes and generated outputs out of version control when they are local-only,
using narrowly scoped `.gitignore` entries. Do not add task-management directories or files.

## Git

Every initialized project must be a git repository. Do not reinitialize an existing `.git/`.
After focused validation passes, commit only the requested governance changes when unrelated user
changes can be excluded. Do not push or create remotes unless the user asks.

## Task creation prompts

Treat a prompt beginning with `New task:` as task-capture-only unless the user also requests
implementation. Load `task-processor`, create the record in Ecelyo, assign an active project and
tactic, add explicit acceptance criteria, and stop before changing product code.

## Specifications and design system

- Use `specifications/v1/prd.md` for the initial product requirements document.
- Put focused specifications under a dedicated `specifications/<topic>/` directory.
- Preserve existing versioned requirements and keep new documents concise.
- Maintain a design-system specification and consult it before UI decisions.

## Quality expectations

- Require unit coverage for non-UI behavior and focused UI regression coverage for UI changes.
- For Xcode projects, load the relevant Xcode, SwiftUI, screenshot, and output-parser skills.
- Keep debug-only code behind `DEBUG` and out of release code paths.
- Use one entity per file when the stack supports it.
- Define clear Product Designer, Developer, QA, and research roles when a project needs them.

## Validation

After changing governance, verify the requested files exist, Markdown is readable, existing stricter
instructions remain intact, and the relevant project validation command is documented. For Xcode or
screenshot-driven projects, retain the repository's platform-specific build, test, and screenshot
requirements; do not invent a separate task workflow.
