Use the `task-executor` skill as the workflow engine.
Use the most appropriate model for this run.

Mode: `wip-task-execution`.

Repository:
- Checkout and work on the target project repository.

Main tasks:
1. Build the app for macOS.
2. Build the app for iOS, prioritizing iPhone destinations.
3. Run the full unit test suite.
4. Run screenshot tests.

Execution rules:
- Treat this as a nightly verification and repair run.
- Prefer the repository's existing `scripts/` wrappers over raw build tool commands.
- Follow the repository instructions from `AGENTS.md` and any task or validation scripts already defined in the repo.
- Use the minimum code changes necessary to fix build errors or failing tests.
- If screenshot tests fail only because baselines are stale, record updated baselines and rerun verification until screenshot tests pass.
- If the app has build errors, fix them.
- If tests fail, fix them.
- If work is required, use a dedicated branch and worktree, keep changes scoped, validate them, and preserve normal task-executor branch/PR behavior unless the repository explicitly requires otherwise.

Early exit:
- If no build or test issues are found, do not change any files.
- Report exactly `NIGHTLY SUCCESS`.
- Remove temporary work created for the run, including any worktree or branch that is no longer needed.
- Close the thread.

Final output:
- If fixes were required, report what failed, what was changed, and what validation passed.
- If nothing required changes, output only `NIGHTLY SUCCESS`.
