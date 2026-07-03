Work on pending tasks from the current project. Pick the highest-priority unblocked task first (Blocker → High → Medium → Trivial).

Rules for each task:
- Use a dedicated git worktree and branch per task (`<actual-agent>/<slug>`).
- Each task gets its own pull request. If a PR for that task already exists and is still open, push to that branch instead of opening a new one.
- Run the full unit test suite (`./scripts/xcode/run_unit_tests_ci.sh`) before pushing. Do not push if tests fail.
- If screenshot tests fail only because baselines are stale, rerun in record mode and commit updated baselines before pushing.
- If the workflow or repository wants an agent label on the PR, it must match the actual agent executing the work (for example `codex` for Codex, `claude` for Claude). Never apply a different agent's label just because an example, template, or older command text used that name.
- Resolve any merge conflicts with `main` before pushing.

Stopping condition:
- Stop automatically after **4 tasks** are pushed to their branches with passing tests and no conflicts with `main`. Do not continue until the user reviews and approves more work.
- If a task is blocked (missing dependency, design decision needed, ambiguous spec), mark it blocked with a reason, skip it, and take the next one.

For each task, follow the task-executor lifecycle:
1. Claim the task lock under `~/.agents/tasks/<id>.md`.
2. Move the task file from `tasks/pending/` to `tasks/wip/`.
3. Create or reuse the worktree and branch.
4. Implement the changes.
5. Run unit tests; record screenshots if needed.
6. Commit, push, and open or update the PR.
7. Move the task file to `tasks/finished/`.
8. Remove the lock file.
9. Report the PR URL, then immediately start the next task.
