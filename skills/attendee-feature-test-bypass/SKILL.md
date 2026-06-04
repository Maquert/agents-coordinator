---
name: attendee-feature-test-bypass
description: Temporarily bypass AndroidFeatureTests and iOSFeatureTests GitHub checks in attendee-style repos by swapping active CI workflows for success stubs while preserving standard native/CircleCI workflows under -standard filenames. Use when native feature tests cannot pass due to an external dependency, when the user asks to green AndroidFeatureTests or iOSFeatureTests, enable a temporary feature test bypass, or revert the bypass back to standard workflows in any similar repository.
---

# Attendee feature test bypass

## When to use

- **Enable bypass**: Native Android/iOS feature tests are blocked by an external dependency but PRs must merge.
- **Revert bypass**: The dependency is fixed and real native pipeline tests should gate PRs again.

Applies to repositories that use this CI pattern:

- GitHub check runs `AndroidFeatureTests` and `iOSFeatureTests`
- Shell helpers under `.github/workflows/` (e.g. `update-github-check-run-status.sh`, `close-github-check-run.sh`, `create-run-id-env-variable.sh`)
- Workflows that trigger CircleCI (or similar) on native Android/iOS repos
- Optional merge-queue workflow that already forces feature checks to success

**Before changing anything**, read `.github/workflows/` in the target repo and confirm filenames. Common layout:

| Active CI (bypass) | Preserved (standard) |
|--------------------|----------------------|
| `run_pr_checks.yaml` | `run_pr_checks-standard.yaml` |
| `run_feature_tests_on_android.yaml` | `run_feature_tests_on_android-standard.yaml` |
| `run_feature_tests_on_ios.yaml` | `run_feature_tests_on_ios-standard.yaml` |

If names differ, apply the same **bypass / -standard** split using the repo’s actual workflow filenames.

Do **not** change lint, unit tests, coverage, build, or bundle size checks. Do **not** modify merge-queue bypass workflows if they already exist — leave them as-is.

## Enable bypass

**Do not delete original workflow logic** — copy it into `-standard` files first.

### 1. Preserve standard workflows

For each workflow that will be bypassed:

1. Copy the current file to a sibling with `-standard` before `.yaml` (e.g. `run_pr_checks-standard.yaml`).
2. In each `-standard` file:
   - Append `-standard` to workflow `name:` and job id
   - Use a distinct `concurrency.group` (suffix `-standard` in the group name)
   - For the PR checks `-standard` file: comment out `pull_request` (use `workflow_dispatch` only) so it does not run alongside the bypass PR workflow
   - Point any workflow URLs in check summaries to the `-standard` filenames

### 2. Replace active workflows with bypass stubs

**PR checks workflow** — keep all existing steps. After the last non-bypass step (typically **Build**), add:

```yaml
# TEMPORARY: bypass feature tests — external dependency blocked.
- name: TEMPORARY - Mark feature tests as success (external dependency blocked)
  run: |
    .github/workflows/close-github-check-run.sh AndroidFeatureTests $RUN_ID_AndroidFeatureTests success ${{ github.event.pull_request.head.sha }} ${{ steps.generate_token.outputs.token }}
    .github/workflows/close-github-check-run.sh iOSFeatureTests $RUN_ID_iOSFeatureTests success ${{ github.event.pull_request.head.sha }} ${{ steps.generate_token.outputs.token }}
    echo "Feature tests bypassed temporarily — external dependency blocked" >> $GITHUB_STEP_SUMMARY
```

Adjust `RUN_ID_*` variable names if the repo’s **Start CI GitHub checks** step uses different env names (read that step first).

**Android / iOS feature test workflows** — replace native pipeline trigger, poll, and failure logic with a short stub (mirror the repo’s merge-queue success pattern if present):

1. Checkout
2. Generate GitHub App token (use the same `actions/create-github-app-token` inputs and secrets as the original workflow)
3. `create-run-id-env-variable.sh <CheckName> success ${{github.sha}} <token>`
4. `close-github-check-run.sh <CheckName> $RUN_ID_<CheckName> success ${{ github.sha }} <token>`
5. Write bypass note to `$GITHUB_STEP_SUMMARY`

Add header comments on bypass files referencing the matching `-standard` file and revert instructions.

### 3. Document and validate

- Add `.github/workflows/README-feature-test-bypass.md` with the revert steps (remove temp → drop `-standard` suffix → push)
- Parse YAML for all touched workflow files
- Confirm the bypass PR workflow still triggers on the repo’s default PR branch (usually `main`)

## Revert to standard workflows

When the external dependency is fixed:

### 1. Remove the temporary workflows

Delete the three **bypass** files (not the `-standard` files). Use the repo’s actual names, e.g.:

```bash
rm .github/workflows/run_pr_checks.yaml
rm .github/workflows/run_feature_tests_on_android.yaml
rm .github/workflows/run_feature_tests_on_ios.yaml
```

### 2. Drop the `-standard` suffix

```bash
git mv .github/workflows/run_pr_checks-standard.yaml .github/workflows/run_pr_checks.yaml
git mv .github/workflows/run_feature_tests_on_android-standard.yaml .github/workflows/run_feature_tests_on_android.yaml
git mv .github/workflows/run_feature_tests_on_ios-standard.yaml .github/workflows/run_feature_tests_on_ios.yaml
```

Then strip `-standard` from workflow `name:`, job ids, `concurrency.group`, and check-summary URLs inside each file. See [references/revert-content-edits.md](references/revert-content-edits.md). Prefer copying exact original strings from the `-standard` file content before rename when unsure.

Remove bypass header comments. Delete `README-feature-test-bypass.md` if present.

### 3. Push

```bash
git add .github/workflows/
git commit -m "Revert temporary feature test bypass"
git push
```

After merge, PRs should queue `AndroidFeatureTests` and `iOSFeatureTests` again until native workflows are triggered manually; native pipelines report real pass/fail.

## Verify

**After enabling bypass**

- PR checks workflow completes → both feature test checks **Success** without manual trigger
- Manually dispatching Android/iOS bypass workflows still reports **Success**

**After revert**

1. Test PR → feature test checks show **Queued**
2. Manually trigger Android and iOS feature test workflows from the PR branch
3. Checks update to **Success** or **Failure** from the native pipeline

## One-liner revert (file ops only)

Adjust paths to match the repo:

```bash
rm .github/workflows/run_pr_checks.yaml \
   .github/workflows/run_feature_tests_on_android.yaml \
   .github/workflows/run_feature_tests_on_ios.yaml && \
git mv .github/workflows/run_pr_checks-standard.yaml .github/workflows/run_pr_checks.yaml && \
git mv .github/workflows/run_feature_tests_on_android-standard.yaml .github/workflows/run_feature_tests_on_android.yaml && \
git mv .github/workflows/run_feature_tests_on_ios-standard.yaml .github/workflows/run_feature_tests_on_ios.yaml
```

Apply content edits from [references/revert-content-edits.md](references/revert-content-edits.md) before committing.

## Rules

- Never delete standard native-pipeline logic during bypass — only move it to `-standard` files
- Mark all bypass changes with `TEMPORARY` comments for grep/revert
- Same-repo PRs use workflow files from the PR branch once pushed
- Discover repo-specific workflow names, secrets, and check env vars before editing
- Request `git_write` / network permissions before commit and push
