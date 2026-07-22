---
name: task-processor
description: Capture raw requests as normalized backlog tasks without implementing them. Always use when the first non-whitespace text in a user prompt is `New task:` (case-insensitive), treating the remainder as task-intake content. Also use when the user explicitly requests backlog intake or the legacy repository task-file workflow. Use Ecelyo as the default task store; only create repository `tasks/` files when the user separately opts into that legacy workflow.
---

# Backlog Task Intake

Use this skill for task intake only. Do not implement the captured task in the same turn unless the
user explicitly asks for both intake and implementation.

The repository task-file workflow in this skill is legacy. When Ecelyo is available, create and
manage the task in Ecelyo instead of under `tasks/` unless the user separately asks for repository
task markdown files.

Use this skill to convert raw backlog items into normalized task records. Keep each automation prompt short: specify the backlog source file, the task detail destination, the duplicate-check source, and the exact output shape required by the automation.

Task records must carry an assigned branch name from intake onward. Store the canonical branch slug without an agent prefix, for example `branch: increase_padding`. When an agent later starts the task, it will create or use the concrete git branch `<agent>/<branch>` using the **actual agent identity running the task**, such as `claude/increase_padding` for Claude or `codex/increase_padding` for Codex.

Do not encode the agent identity into the stored task slug itself, and do not let examples that mention one agent imply that another agent should reuse that identity in branches, PR labels, PR bodies, locks, or workflow text.

Default remote behavior for explicit repository task-file intake is to do intake work on a new branch, push that branch, and create or update a pull request when task creation changes tracked repository files. Automations should mention remote-action details only when they need to opt out, change the PR target or metadata, or add extra remote steps.

If the repository does not already expose the paths or files that the automation expects, stop before making workflow changes and explain how to configure the repository. Use [references/project-setup.md](references/project-setup.md) for the baseline layout and [references/path-mapping.md](references/path-mapping.md) for alternate structures and path overrides.

## `New task:` Prompt Contract

When the first non-whitespace text in a prompt is `New task:` (case-insensitive):

1. Load and use this skill.
2. Remove only the prefix and treat all remaining prompt content and attachments as the raw task.
3. Create or update a normalized task record; do not execute the requested work.
4. Use Ecelyo as the task store by default. Load `ecelyo-methodology` and
   `ecelyo-local-server`, verify connectivity, and preserve tactic coherence.
5. Treat the prefix as task-intake authorization, not as authorization to create repository
   `tasks/` files. Use the legacy file workflow only when the prompt also requests it explicitly.
6. Infer project and tactic only when the context makes the assignment reliable; otherwise ask for
   the missing assignment before creating the task.
7. Assign an explicit `agentRole` that reflects the work the captured task requires.

The prefix is a routing command even when the remainder resembles a direct implementation request.
For example, `New task: Fix the login crash` means capture a task named from that request; it does
not mean fix the crash now.

## Direct Prompt Intake

For a `New task:` prompt or another direct intake request:

1. Normalize the request into a concise title.
2. Check Ecelyo for an existing equivalent task before creating a duplicate.
3. Resolve a coherent existing project and tactic, or ask when either cannot be inferred safely.
4. Create a Markdown description containing the available goal, constraints, acceptance criteria,
   dependencies, and attachment context without inventing missing requirements.
5. Set an explicit priority, using the active system's fallback when the user does not provide one.
6. Set an explicit `agentRole` appropriate to the task.
7. Create the task in `pending` state and report its id, project, tactic, priority, and role.
8. Stop after intake; do not begin execution.

## Operating Rules

1. Read only the files needed for intake. Avoid broad repo scans.
2. Read the automation memory file first when one is provided and reuse it to avoid duplicate work.
3. Keep edits scoped to intake: do not implement tasks or fix unrelated repository issues.
4. Respect repository instructions from `AGENTS.md` and any task-lifecycle files.
5. When the intake work changes tracked repository files, use a new branch for that work and create or update a pull request instead of leaving the changes only locally.

Before executing, verify that the required project structure exists. If it does not:

1. Do not invent hidden assumptions.
2. Report the missing files or directories precisely.
3. Explain the minimum configuration the repository needs.
4. Suggest either creating the baseline structure or updating the automation prompt to map the workflow to the repository's existing paths.
5. Reference the setup guidance so the user can make the repository compatible.

## Project and Tactic Assignment

Every task **must** be assigned to a project and a tactic. These are required fields, not optional. Do not create a task without them.

### Projects

A project is a top-level grouping stored as a directory at `tasks/projects/{project_id}-{project-name}/`. A project must have a name and optional metadata.

- To use an existing project: read the project directories under `tasks/projects/` and pick the matching one.
- To create a new project: generate a timestamp-based id, prompt for a name (or derive it from the intake context), and create the directory `tasks/projects/{project_id}-{project-name}/` with a `tactics/` subdirectory and optional project metadata file.

### Tactics

A tactic is a mid-level grouping within a project, stored as a file at `tasks/projects/{project_id}-{project-name}/tactics/{tactic_id}-{tactic-name}.md`. A tactic must have a name and belongs to exactly one project.

- To use an existing tactic: read the `tactics/` directory inside the project and pick the matching one.
- To create a new tactic: generate a timestamp-based id, prompt for a name (or derive it from the intake context), and create the tactic file at `tasks/projects/{project_id}-{project-name}/tactics/{tactic_id}-{tactic-name}.md` with a brief description.

### Task Relationships and Parallelism

Prefer a connected, sequential task graph within each tactic. When several tasks contribute to one tactic, link each task to its real predecessor and successor so work has a legible path from the starting task to the final validation or completion task.

- A tactic's first task may have no parent and its final task may have no child; these are the only normal endpoint exceptions.
- Do not fabricate dependencies solely to satisfy graph shape. A link must reflect a genuine ordering, prerequisite, integration, or validation relationship.
- Prefer sequential delivery over wide fan-out. At any branch, create no more than three parallel tasks unless the user explicitly asks for more or the work cannot reasonably be sequenced.
- When intake creates a new tactic with more than one task, include a clear final validation or completion task and connect it to the preceding work.

### Task Frontmatter

Each task file must include both fields in its front matter:

```yaml
project: {project_id}
tactic: {tactic_id}
```

Tasks live under the lifecycle directories at the top level (e.g., `tasks/pending/{task_id}-{task_slug}.md`).

## Required Inputs

- Direct mode: prompt content after `New task:` or another raw task request
- Legacy batch mode: a backlog intake source file
- A project (existing or new — must have a name)
- A tactic within that project (existing or new — must have a name)
- A duplicate-check source: Ecelyo by default, or the repository records in legacy mode
- Legacy mode only: a task file shape that can store an assigned branch name, project, and tactic
- Optional: image files to attach as task assets (e.g., screenshots, reference images)

If the required inputs are missing, stop and explain the setup using the references files. Seed missing files from [references/intake-template.md](references/intake-template.md) and [references/tasks-index-template.md](references/tasks-index-template.md) when the user wants the baseline layout.

**Image Asset Handling**: When image files are provided (via the automation prompt or discovered in the conversation), place each image under `tasks/task_assets/` (not under the project root) with the naming pattern `{task_id}_{task_slug}_{sequence}.png`, where `sequence` is an incrementing number starting from 0 for multiple images per task. Create the directory if it does not exist.

## Legacy File Intake Execution Pattern

1. Open the source file and collect unordered list items.
2. Ignore headings, blank lines, and already-processed items.
3. Stop immediately if there are no eligible items.
4. **Resolve project**: Before processing any items, determine which project they belong to.
   - If the caller names a project, find the matching directory under `tasks/projects/` by id or name.
   - If the caller says "new project", create a new project directory `tasks/projects/{id}-{name}/` with a `tactics/` subdirectory.
   - If no project is provided and one cannot be inferred, stop and ask. Do not proceed without a project.
5. **Resolve tactic**: For each batch of items (or all items if they share a tactic), determine the tactic.
   - If the caller names a tactic, find the matching file under `tasks/projects/{project_id}-{name}/tactics/` by id or name.
   - If the caller says "new tactic", create a new tactic file `tasks/projects/{project_id}-{name}/tactics/{tactic_id}-{tactic-name}.md`.
   - If no tactic is provided and one cannot be inferred, stop and ask. Do not proceed without a tactic.
6. Rewrite each item into a concise task title suitable for a task detail file.
7. Check for duplicates against the existing task detail files and any duplicate-check source named by the caller.
8. For each non-duplicate item, derive a canonical branch slug from the normalized task title.
9. The slug must be lowercase, use underscores between words, and omit any agent prefix. Example: `increase_padding`.
10. Ensure the derived branch slug is unique among existing task records and any duplicate-check source. If needed, append a short deterministic suffix.
11. For each non-duplicate item, create a new task record file in the appropriate top-level lifecycle directory (e.g., `tasks/pending/{task_id}-{task_slug}.md`) that follows repository task conventions and stores the assigned branch name, `project`, and `tactic` fields.
12. Include a short summary, acceptance criteria derived from the source item, constraints, obvious dependencies, and an explicit `priority` field.
13. Use repository-defined task priorities when they exist. If the caller does not provide a priority and the repository has no stronger rule, default new tasks to `Trivial`.
14. Build the tactic's task relationships while creating the records: prefer a sequence, use a `depends on:` field (or the active task system's equivalent) for each real prerequisite, keep at most three parallel branches, and leave only the first and final tasks as normal graph endpoints.
15. **Image Assets**: When image files are provided in the automation prompt, create `tasks/task_assets/` if needed. For each image file, move or copy it to `tasks/task_assets/{task_id}_{task_slug}_{sequence}.png` where `sequence` is 0 for the first image, 1 for the second, etc. Update the task file's `Notes` section to reference the asset, e.g., "See tasks/task_assets/{task_id}_{task_slug}_{sequence}.png for reference screenshot."
16. Update the backlog index only when the repository still uses one for local convenience; do not require a backlog index when task files are the source of truth.
17. Remove each source item only after the task was created successfully or confirmed as a duplicate.
18. Leave ambiguous or unprocessable items in the source file and report why they were skipped.
19. Do not implement the tasks.
20. When intake changes tracked repository files, commit only the intake-related changes, push the new branch, and create or update a pull request unless the caller explicitly disables remote actions.

## Default Output

- Created task ids and titles
- Skipped duplicates
- Remaining source items and blockers

## Automation Prompt Contract

Keep automation prompts short and supply only:

- Repository path or current working directory
- Any memory file path
- The backlog source file path
- Project (name or id of an existing project, or "new: {name}" to create one)
- Tactic (name or id of an existing tactic, or "new: {name}" to create one)
- Task id and priority rules that differ from the default
- Any path overrides when the repository does not use the baseline `tasks/` layout
- **Optional**: image files to attach as assets (e.g., `images: ["/path/to/screenshot.png"]`)
- Required final output or finish message

Do not restate the full workflow in each automation unless the repository has a real exception to this skill.

**Example:**
```
source: tasks/intake.md
project: 1781617286-lylat-core
tactic: new: Authentication Flow
output: Created task IDs with project and tactic assigned.
```

**Example with images:**
```
source: tasks/intake.md
project: new: Onboarding
tactic: new: Initial Setup
images:
  - /path/to/screenshot1.png
  - /path/to/screenshot2.png
output: Created task IDs and placed images in tasks/task_assets/.
```
