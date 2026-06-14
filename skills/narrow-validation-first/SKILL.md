---
name: narrow-validation-first
description: Choose the smallest sufficient validation scope for a code change and avoid broad, redundant, or state-conflicting test runs. Use when Codex needs to decide which tests, screenshot contracts, linters, builds, or wrappers to run first, especially in recurring automations, UI work, Xcode workflows, or any repository with expensive broad validation scripts.
---

# Narrow Validation First

Use this skill to reduce validation cost without weakening confidence. Start from the changed surface, find the narrowest stable contract that covers it, and widen only when the focused path is missing or proves insufficient.

Read [references/validation-ladder.md](references/validation-ladder.md) when the change touches UI, Xcode, screenshots, or a repository with broad wrapper scripts.

## Workflow

1. Identify the changed surface.
   - single function or helper
   - one view or component
   - shared shell or navigation chrome
   - build graph or package configuration
2. Choose the smallest stable validation contract that covers that surface.
   - unit test method before test class
   - test class before full target
   - focused screenshot method before platform suite
   - platform suite before all-platform wrapper
3. Check for mutable shared state before parallelizing.
   - derived data
   - package resolution
   - simulators
   - snapshot output directories
   - git index or staged state
4. Run the focused path first.
5. Widen only when one of these is true:
   - no focused contract exists
   - the changed surface is shared chrome or shared infrastructure
   - the focused contract fails because it does not cover the real integration boundary
6. If a broad wrapper fails with many unrelated failures, stop widening.
   - record that the wrapper is noisy for this task
   - return to the focused contract
   - report unrelated failures separately instead of absorbing them into the task

## Rules

- Prefer task-local validation over repo-wide wrappers.
- Prefer explicit `only-testing` selectors over broader scheme runs when they are stable.
- Do not run two expensive validators in parallel if they mutate shared build or snapshot state.
- Do not keep polling a long-running job unless the next poll could change your decision.
- If a wrapper is the repository default but obviously much broader than the task, use the focused equivalent first and keep the wrapper as fallback.
- When screenshot recording dirties unrelated baselines, restore unrelated files immediately and rerun with a narrower selector.

## Output

When you explain a validation plan, keep it compact:

- chosen surface
- first validation command
- fallback widening step
- known shared-state risks
- stop condition for broadening

## Validation

If you revise this skill, run the quick validator:

```bash
python3 /Users/mhjaso/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/mhjaso/.agents/skills/narrow-validation-first
```
