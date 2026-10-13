---
name: ecelyo---complete-tactics
description: Completes any pending open tactic over night
---

Read /Users/mhjaso/.agents/commands/to-execute-next-open-tactic.md and follow it exactly.
Filter all ready tactics that is not in already in wip (no task has started), sort them by target version, and pick the lowest version. If two tactics target the same version sort them by priority: higher priority wins. If still in draw, pick a random one.

Do not claim tactics under the maintenance project unless there is nothing else.
Claim the first task of that tactic and complete the whole tactic.
