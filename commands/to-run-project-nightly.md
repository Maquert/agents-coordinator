Use the `task-executor` skill in `batch-task-execution` mode with a batch size of **1** as the
workflow engine for the nightly task.
Use the most appropriate model for this run.

Mode: `batch-task-execution` with batch size `1`.

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

CI usage rules (GitHub Actions costs the user real money — treat it as scarce):
- Run all verification locally first, using the repository's own `scripts/` wrappers. Local runs are the default and repeatable-for-free path; use them to iterate.
- Do not dispatch or re-dispatch GitHub Actions workflows (`gh workflow run`, `gh run watch`, etc.) to test, debug, or "double check" something you could instead determine locally. Repeated speculative CI dispatches are not an acceptable substitute for local iteration.
- Only push a branch and let CI validate it (or trigger a single `workflow_dispatch`) once local validation gives roughly 95%+ confidence the run will pass — i.e. local tests are clean, or any local failures are cross-checked against known/documented pre-existing or environmental issues and confidently attributed rather than guessed at.
- If local confidence is below that bar (ambiguous failures, unfamiliar failure signatures, unresolved environment skew), do not push or dispatch CI to investigate further. Stop, document exactly what was found and why confidence is low, and leave it for the user rather than spending CI budget to figure it out.
- The one narrow exception is baseline recording that must run on the actual CI hardware (e.g. macOS-CI screenshot baselines, which cannot be produced correctly on a local dev machine that may be on a different OS/Xcode version). Even here: dispatch at most once per nightly run, only after local analysis has already narrowed the failure to that specific class of issue with high confidence, and do not follow it with further verification dispatches — trust the recorded diff plus at most one confirming CI run instead of repeatedly re-running CI to "make sure."

Early exit:
- If no build or test issues are found, do not change any files.
- Report exactly `NIGHTLY SUCCESS`.
- Remove temporary work created for the run, including any worktree or branch that is no longer needed.
- Close the thread.

Final output:
- If fixes were required, report what failed, what was changed, and what validation passed.
- After every local build, unit-test, and screenshot phase passes, write the ignored marker `.build-results/nightly/REPOSITORY_STABLE` containing the current commit SHA and UTC timestamp.
  Do not write the marker when any phase fails or when validation is incomplete.
- If nothing required changes, output exactly `NIGHTLY SUCCESS\nREPOSITORY STABLE`.
