Use the `github-cli-operator` skill.
Use the `ecelyo-methodology` skill.
Use the `ecelyo-local-server` skill.

Merge eligible open pull requests that I created by starting from Ecelyo task priority, then moving from each selected task to its pull request.

## Rules

- Inspect every open pull request in the GitHub repository before starting.
- Inspect the relevant Ecelyo tasks first and use Ecelyo as the source of truth for merge order.
- Determine which pull requests were created by the currently authenticated GitHub user.
- Never merge a pull request created by another author.
- Do not process pull requests by lowest PR number.
- Instead, process work in Ecelyo priority order using the methodology rules:
  1. critical-priority tasks
  2. blocked-task resolution tasks
  3. in-progress tasks not currently claimed by anyone
  4. pending tasks by priority
  5. trivial tasks or maintenance work
- Go from the task to its pull request. If a task has no pull request, report that clearly and do not substitute a lower-priority pull request just because it already exists.
- Treat `origin/main` as the source of truth; local `main` may be behind.
- Request escalation for branch/merge/push if sandbox blocks Git metadata.
- Screenshot tests are assumed to be correct. If screenshot or snapshot references change or conflict, record and keep the new references, then include them in the branch update.
- Do not merge stale, invalid, blocked, draft, dependency-blocked, or otherwise unsafe pull requests. Record the specific reason in the final report.
- No task may proceed without a working Ecelyo server connection. If the server does not respond, stop and ask the user to start it.

## Workflow

1. Verify the GitHub CLI setup and authenticated account.
2. Verify Ecelyo server connectivity.
3. Read the relevant Ecelyo task queue and identify the highest-priority tasks using the Ecelyo methodology ordering.
4. Fetch and prune `origin`, then list all open pull requests with at least their number, author, head branch, draft status, mergeability, review state, checks, and URL.
5. Map the prioritized Ecelyo tasks to their corresponding pull requests.
6. Classify every mapped pull request as mine or not mine, and keep the processing order driven by the mapped Ecelyo task order rather than PR number.
7. For each eligible mapped pull request of mine, in that order:
   1. Check out its head branch and ensure the worktree is clean before modifying it.
   2. Merge `origin/main` into the current branch.
   3. Resolve all conflicts. For screenshot or snapshot conflicts, record the new expected references rather than treating changed output as a regression.
   4. Run the narrowest relevant test suite, including screenshot or snapshot tests when present.
   5. If tests fail, fix the failures, record updated screenshot or snapshot references when applicable, and rerun tests until they pass or a concrete blocker is established.
   6. Commit the conflict resolutions, test fixes, and updated references when the merge did not create a complete merge commit automatically.
   7. Push the updated branch.
   8. Recheck required reviews, checks, mergeability, and dependencies on GitHub.
   9. Merge the pull request only when it is valid, unblocked, and passing. Confirm that GitHub reports it as merged before continuing.
   10. If the pull request is merged, ensure the corresponding Ecelyo task is updated to `finished`.
   11. Fetch `origin/main` again before processing the next pull request.
8. Query GitHub again for all open pull requests so the final report reflects the repository's current state.

## Output

Report every pull request considered in a Markdown table with these columns:

| Task | PR | Title | Author | Status | Reason | URL |
| --- | --- | --- | --- | --- | --- | --- |

Use `Merged by me` for pull requests merged during this run and `Still open` for pull requests that remain open. For each open pull request, give a concise reason such as `not mine`, `stale`, `invalid`, `draft`, `dependency`, `checks failing`, `review required`, `conflict unresolved`, or the concrete blocker encountered.
