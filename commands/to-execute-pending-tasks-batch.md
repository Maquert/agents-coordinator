Use the `task-executor` skill in `batch-task-execution` mode.

Batch size: **5 tasks** by default. If the user gives a different number, use that instead. The
skill owns Ecelyo connectivity, live priority selection, one-task-at-a-time locking, worktrees,
branches, validation, PRs, merge policy, cleanup, and final closeout. Do not duplicate or override
those lifecycle rules here.

For a one-task request, use the same mode with batch size **1**; it is an atomic task execution and
must not stop at implementation, validation, or PR creation.
