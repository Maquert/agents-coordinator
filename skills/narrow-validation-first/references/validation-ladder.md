# Validation Ladder

Use this ladder to pick the first validation attempt.

## Preferred Order

1. Single targeted test method
2. Single test class
3. Small related test group
4. Single platform screenshot contract
5. Full target or suite
6. Repository wrapper
7. Full multi-platform or all-in-one wrapper

Move down only when the current level is missing or insufficient.

## UI Changes

- Component styling: prefer the component screenshot test
- One screen: prefer that screen's screenshot test
- Shared shell chrome: prefer the smallest shell screenshot on the affected platform
- All-platform baseline refresh: use the canonical all-platform recorder only when the change really affects all definitive platform contracts

## Xcode-Specific Heuristics

- Prefer `-only-testing:` selectors when they are already used in the repository
- Reuse one focused derived data path per sequential validation sequence
- Do not run parallel macOS/iOS screenshot commands unless the repository explicitly supports it
- If package resolution fails during a custom command, try the repository's established wrapper next
- If the repository wrapper is noisy and the focused command is stable, keep using the focused command

## Stop Signals

Stop broadening when:

- failures are clearly unrelated to the changed surface
- the broad command dirties many unrelated snapshots
- concurrency or shared-state conflicts dominate the failures
- repeated polling yields no new actionable output
