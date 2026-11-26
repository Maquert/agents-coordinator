---
name: cartenario---complete-tactics
description: Completes any pending open Cartenario tactic over night
---

Read /Users/mhjaso/.agents/commands/to-execute-next-open-tactic.md and follow it exactly, with the Cartenario overrides below (they win over the command wherever they conflict).

## Scope overrides (Cartenario instead of Ecelyo App)
- This run is scoped to the **Cartenario** project at /Users/mhjaso/Developer/Projects/Cartenario (GitHub repo of that checkout). The explicit scope override for Cartenario is authorized by the owner for this routine.
- Resolve the Ecelyo Satellite system/project that corresponds to Cartenario via `GET /systems` (match by name "Cartenario"). Only tactics and tasks of that system/project are eligible. If no unique Cartenario system exists, skip the run without claiming work and report it. Do not touch Ecelyo App, Turnia/Turnera, Papiplan, or any other product.
- Ignore selection rule 6's exclusion of project ID ECAF491A-328C-4C52-ABE0-92CC5D5EAF87 and the `systemversion` filter if Cartenario has no systemversion (fall back to priority ordering); keep every other hard exclusion (archived/accomplished, projects whose name contains `Release` or `Icebox`, unfinished parents, another agent's active task, empty objective, Maintenance limit of 3 tasks).
- Use `agentTechnology: "Claude"` and the live Claude thread deeplink in the claim PATCH. Label every PR you create or update `Claude`.

## Project rules to follow (from the repo's AGENTS.md — read it and README.md first)
- Never switch the primary checkout (~/Developer/Projects/Cartenario); it stays on `main`. Work only in a dedicated worktree with a focused branch under ~/.agents/worktrees/cartenario/. Fetch origin first. Remove the worktree and its branch after merge.
- Treat specifications/v1/technical-specification.md and specifications/v1/design/interface-contract.md as the source of truth. Do not implement TBD or unresolved decisions; if a task depends on one, set it `blocked` with the exact gate.
- Xcode 27.2; simulators only iPhone 17 and iPad Pro 13-inch (M5). Use the xcode-terminal-operator and xcode-output-parser skills; keep build settings in tracked .xcconfig files; no credentials in source.
- Keep >=80% line coverage of app-owned code, Dark Mode/Dynamic Type/VoiceOver support. Do not claim a build or test without actually running it. Delete the exact Derived Data directory of the task's worktree before removing it.
- Commit signing is pre-approved for commits. Do NOT perform other private-key operations (codesign, signed archives, notarization, certificate/Keychain changes) — if a task needs them, set it `blocked`.
- Do not push to or modify the `release-candidate` branch or trigger Xcode Cloud; release work is out of scope for this routine. Never force-push shared branches.
- Merge policy follows the task's `needsHumanReview` field: true → open a non-draft PR and keep the task `in review`; false → merge after all gates pass.
- Finish with the closeout table and tactic completion summary required by the global instructions (~/.agents/AGENTS.md).

## Permissions
Run with permissions needed for: git (worktree, commit, push, PR via gh) in the Cartenario repo and ~/.agents/worktrees/cartenario/, xcodebuild/xcrun simctl for the approved simulators, Bonjour discovery (dns-sd) and HTTP to Ecelyo Satellite, and read of the Satellite token from its canonical Keychain item only. Nothing else.