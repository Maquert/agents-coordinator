---
name: cartenario---maintenance-tactic
description: Takes the next tasks in the Cartenario Maintenance project
---

Read /Users/mhjaso/.agents/commands/to-execute-pending-task.md (a redirect to /Users/mhjaso/.agents/commands/to-execute-next-open-tactic.md) and follow it exactly, with the Cartenario overrides below (they win over the command wherever they conflict).

Complete open tactics from the Cartenario app. Focus on the Maintenance project of the Cartenario system (resolve it by name "Maintenance" within the Cartenario system via Satellite `GET /systems`; do not use the Ecelyo App Maintenance project ID 7052D534-0D70-45D1-BFB5-4A6C5B77E08D). Do not complete more than 3 tasks. Create one thread for each task if they are not related (do not reuse the same thread for unrelated tasks).

## Scope overrides (Cartenario instead of Ecelyo App)
- Scoped to the **Cartenario** project at /Users/mhjaso/Developer/Projects/Cartenario. The scope override for Cartenario is authorized by the owner for this routine.
- Only tactics/tasks of the Cartenario system's Maintenance project are eligible. If no unique Cartenario system or Maintenance project exists, skip the run without claiming work and report it. Do not touch Ecelyo App, Turnia/Turnera, Papiplan, or any other product.
- Ignore the command's exclusion of project ID ECAF491A-328C-4C52-ABE0-92CC5D5EAF87 and its `systemversion` filter if Cartenario has none (fall back to priority ordering); keep the other hard exclusions (archived/accomplished, `Release`/`Icebox` projects, unfinished parents, another agent's active task, empty objective). Use the active current-week Weekly Maintenance tactic; never mark it finished/accomplished.
- Use `agentTechnology: "Claude"` and the live Claude thread deeplink in the claim PATCH. Label every PR you create or update `Claude`.

## Project rules (read the repo's AGENTS.md and README.md first)
- Never switch the primary checkout (~/Developer/Projects/Cartenario); it stays on `main`. Work only in a dedicated worktree with a focused branch under ~/.agents/worktrees/cartenario/. Fetch origin first. Remove the worktree and branch after merge.
- Specs (specifications/v1/technical-specification.md, specifications/v1/design/interface-contract.md) are the source of truth. Do not implement TBD or unresolved decisions; block the task with the exact gate instead.
- Xcode 27.2; simulators only iPhone 17 and iPad Pro 13-inch (M5). Use xcode-terminal-operator and xcode-output-parser; keep build settings in tracked .xcconfig files; no credentials in source.
- Keep >=80% line coverage of app-owned code; Dark Mode, Dynamic Type, VoiceOver support. Never claim a build or test you did not run. Delete the exact Derived Data directory of the task's worktree before removing it.
- Commit signing is pre-approved. No other private-key operations (codesign, signed archives, notarization, certificate/Keychain changes): set the task `blocked` if needed.
- Do not push to `release-candidate` or trigger Xcode Cloud. Never force-push shared branches.
- Merge policy follows the task's `needsHumanReview`: true → non-draft PR, task stays `in review`; false → merge after all gates pass.
- Finish with the closeout table required by the global instructions (~/.agents/AGENTS.md).

## Permissions
Only: git/gh in the Cartenario repo and ~/.agents/worktrees/cartenario/, xcodebuild/xcrun simctl for the approved simulators, Bonjour (dns-sd) and HTTP to Ecelyo Satellite, and reading the Satellite token from its canonical Keychain item.