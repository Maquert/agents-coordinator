---
name: ecelyo-release
description: Generate releases for Ecelyo from origin/main without version bumps. Always uses the current MARKETING_VERSION and generates release notes from the last two git-tagged releases. Pushes to release-candidate branch to trigger Xcode Cloud TestFlight builds. Use for Ecelyo scheduled release automation.
---

# Ecelyo Release Generation

This skill encodes the Ecelyo release workflow with three enforced rules.

## Three Enforced Rules

1. **Never bump version number** — Use the current `MARKETING_VERSION` from `Configuration/Base.xcconfig` unchanged. Do not modify it unless explicitly authorized.
2. **Use last two git tags** — Generate release notes by comparing the last two semantic-version tags in the repository. Do not interactively select versions or version ranges.
3. **Push to release-candidate only** — This workflow is for TestFlight via Xcode Cloud. Push the release-candidate branch to trigger the hosted build. Do not create tags, submit to App Store Connect, or perform integration.

## Workflow

### 1. Get Current Version

```bash
grep "MARKETING_VERSION" Configuration/Base.xcconfig | awk '{print $NF}'
```

Save this as `CURRENT_VERSION`.

### 2. Find Last Two Git Tags

```bash
git tag -l --sort=-version:refname | head -2
```

These tags define the release-note comparison range:
- Tag 1 (older baseline): compare FROM this commit
- Tag 2 (most recent): compare TO this commit

If fewer than two tags exist, report this and stop.

### 3. Generate Release Notes

Run:

```bash
git log TAG1..TAG2 --oneline --no-merges
```

Filter the result to user-visible changes only (features, fixes users can experience). Group related changes. Rewrite as customer-facing release notes for `RELEASE_NOTES.md`.

Do not include:
- Technical renames or refactoring
- Internal cleanup
- Dependency updates (unless user-visible)
- Test or CI infrastructure changes

### 4. Update RELEASE_NOTES.md

Create or update `RELEASE_NOTES.md` at the project root with the generated notes.

Format:
```
# What's New in Ecelyo [CURRENT_VERSION]

- Feature or fix users can experience
- Another user-visible change
- ...
```

### 5. Ensure Release Candidate is Up to Date

In the release worktree (`~/Developer/Projects/ecelyo_app-release`):

```bash
git fetch origin main
git checkout release-candidate
git reset --hard origin/main
```

This ensures release-candidate exactly matches origin/main before release changes are added.

### 6. Commit Release Notes

```bash
git add RELEASE_NOTES.md
git commit -m "Prepare [CURRENT_VERSION] release notes"
```

Do not update MARKETING_VERSION, build numbers, or any other versioning.

### 7. Push to Release Candidate

```bash
git push origin release-candidate
```

This push triggers Xcode Cloud to build for TestFlight.

### 8. Verify Push Success

Confirm the push succeeded and Xcode Cloud received the trigger.

Report:

| Item | Value |
| --- | --- |
| Current version | `CURRENT_VERSION` |
| Release notes comparison | `TAG1` → `TAG2` |
| Release notes file | `RELEASE_NOTES.md` (created/updated) |
| Release candidate commit | `<SHA>` |
| Push status | Success, Xcode Cloud triggered |

## Error Handling

- If fewer than two git tags exist, report this and stop.
- If release-candidate cannot be synced to origin/main, report the exact Git error and stop.
- If the push to release-candidate fails, report the exact push error and stop.

Do not attempt to tag the release, create a GitHub pull request, submit to App Store Connect, or perform any other action beyond pushing the release-candidate branch.
