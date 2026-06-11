Use the `backlog-task-execution` skill as the workflow engine.

Workflow:
- Read `tasks/project-maintenance.md` and take the first unchecked tech-debt item.
- If no unchecked item exists, do nothing.
- Before starting, state the exact checklist item you are taking.
- Create or reuse a matching task detail file under `tasks/` using the repository task rules from `AGENTS.md`, then move it to `tasks/wip/` before implementation starts.
- Before starting any work, verify the task's assigned branch and confirm the current session is still on that same branch. If the assigned branch changed or the session is on a different branch, stop and report it instead of continuing on the wrong branch.
- You should not work on the `main` branch: create a new branch when the task has no assigned branch yet.
- Execute the selected tech-debt task end to end from its task specification. Prefer existing repo scripts under `scripts/` for validation and screenshot recording before using raw build tool commands. Use screenshot wrapper scripts and record wrappers when screenshot tests are required. If snapshot references exist in both prefixed and unprefixed forms, update the prefixed reference files first because SnapshotTesting reads those for the macOS screenshot suite.
- If you hit a blocker, stop at the first blocker. If push or PR creation is impossible, mark the task blocked before stopping.
- After validation passes, commit only the task-related files from the current worktree.
- Push the current branch to `origin`, using escalated `git` or `gh` commands when sandbox or network limits require it. Request escalation for branch/merge/push if sandbox blocks Git metadata.
- Open a PR using the repository PR template.
- Mark the task done in both its task file under `tasks/` and `tasks/project-maintenance.md`.
- If everything is committed, go back to the `main` branch.

Branch continuity rule:
- A task with an assigned branch must keep all session changes on that same branch.
- Verify the branch before starting work and do not switch to a different task branch mid-run.

Stop/block rule:
- In any automated task, if the run is stopped or blocked after making relevant file changes, create or switch to a new branch prefixed `wip/` unless the current non-main branch already safely holds the work.
- Commit the relevant changes locally before stopping.
- Never leave relevant work stranded on `main`.

Final note:
- If nothing more is left to do in this worktree and the changes have been merged to `main`, show this exact message in capital letters: `THIS WORKTREE IS FINISHED. YOU CAN ARCHIVE IT NOW.`
- If nothing more is left to do and the PR has been created, move to the `main` branch.

Output expectations:
- Report the selected checklist item, the task file used or created, the selected or created branch, what was done, validation run, whether a local commit was created, whether the branch was pushed, and the PR URL.
