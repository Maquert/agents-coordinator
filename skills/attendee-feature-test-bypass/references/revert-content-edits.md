# Revert content edits (after dropping -standard suffix)

Apply after `git mv` from `*-standard.yaml` back to the canonical filenames. Use each `-standard` file as the source of truth for original `name:`, job ids, triggers, and URLs — only remove the `-standard` suffix and bypass comments.

## PR checks workflow

| Field | Change |
|-------|--------|
| `name:` | Remove `-standard` from display name |
| `on:` | Restore `pull_request` to default branch; remove `workflow_dispatch`-only if it was added for preservation |
| `concurrency.group` | Restore original group (often `${{ github.ref }}`) |
| Job id | Remove `-standard` suffix from job key |
| Feature-test workflow URLs in check summaries | Point to non-`-standard` Android/iOS workflow filenames |

Remove `TEMPORARY` bypass header comments and any bypass-only steps (they live only in the deleted bypass file).

## Android feature test workflow

| Field | Change |
|-------|--------|
| `name:` | Restore original workflow title from `-standard` file |
| `concurrency.group` | Restore original group (e.g. `feature-tests-android-${{ github.ref }}`) |
| Job id | Restore original job key from `-standard` file |

File must contain full native pipeline trigger, poll, and conditional success/failure logic — not the bypass stub.

## iOS feature test workflow

Same as Android: restore `name:`, `concurrency.group`, job id, and full pipeline logic from the preserved `-standard` content.

## Optional cleanup

Delete `.github/workflows/README-feature-test-bypass.md` when reverting.
