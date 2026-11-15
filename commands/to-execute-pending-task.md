Compatibility redirect: use [`to-execute-next-open-tactic.md`](to-execute-next-open-tactic.md).

The next-open-tactic command contains the canonical tactic-level instructions from the
`task-executor`, `ecelyo-methodology`, and `ecelyo-satellite` skills.
Its selection contract always prefers an eligible tactic already in `wip` over a new tactic,
so this compatibility command continues an existing tactic whenever possible.
When its scheduled run starts with no actionable work, apply the canonical command's no-work
behavior: use the `__ ` prefix and archive the current thread immediately.
