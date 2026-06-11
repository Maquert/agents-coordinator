# Path Mapping And Fallbacks

Use this reference when a repository does not use the default `tasks/` layout.

## Principle

Do not assume every project uses:

- `tasks/intake.md`
- `tasks/tasks.md`
- `tasks/pending/`, `tasks/wip/`, `tasks/blocked/`, `tasks/finished/`

Instead, map the workflow to the repository's existing structure explicitly in the automation prompt.

## Common Mappings

### Backlog tracked in docs

If the repository keeps backlog items in `docs/backlog.md` or `planning/backlog.md`:

- Use that file as the backlog intake source
- Point the automation to the task detail destination directory
- Point duplicate checks at whichever index or detail directory is authoritative

### Task details stored outside `tasks/`

If task files live under `workitems/`, `planning/tasks/`, or `docs/tasks/`:

- Set the pending, WIP, blocked, and finished directories explicitly in the automation prompt
- State whether tasks move between folders or stay in one folder with a status field

### No backlog index file

If the repository has no equivalent to `tasks/tasks.md`:

- Use task detail filenames and task titles as the duplicate-check source
- Recommend adding a simple backlog index file if humans need a quick overview
- If `tasks/tasks.md` is missing, recommend seeding it from `references/tasks-index-template.md`

### No lifecycle folders

If the repository stores all tasks in one directory:

- Require a clear status field in each task file
- Tell the automation which status values correspond to pending, WIP, blocked, and finished

### No task files yet

If the repository only has issue text, TODO comments, or project board references:

- Explain that `backlog-task-intake` and `backlog-task-execution` need either task detail files or an agreed target format
- Recommend creating the baseline `tasks/` structure first
- If `tasks/intake.md` is missing, recommend seeding it from `references/intake-template.md`

## Automation Prompt Additions

When the repository differs from the baseline layout, add explicit path configuration such as:

- backlog source path
- backlog index path
- pending task directory
- WIP task directory
- blocked task directory
- finished task directory

## Fallback Response Pattern

When required paths are missing, the automation should respond with:

1. The selected skill or workflow mode
2. The missing path or missing concept
3. The minimum repository setup needed
4. The exact prompt fields or files the user should add

Prefer concrete setup advice over vague failure messages.
