---
name: gh-cli
description: Set up, verify, and use the GitHub CLI (`gh`) for GitHub workflows. Use when Codex needs to verify GitHub CLI installation or authentication, configure GitHub CLI access, push commits or branches to remotes, create or inspect pull requests, check GitHub Actions or commit status, fetch repository metadata, or handle prompts such as "push my changes", "push this branch", "open a PR", "check PR status", "use gh", or "GitHub CLI". When maintaining PRs, also inspect repository PR templates and project label definitions stored under `.github/`, including non-canonical label files.
---

# GitHub CLI

## Overview

Use `gh` for GitHub operations when it is configured and the user has granted the needed permission. Keep setup verification explicit, then use `gh` and `git` transparently for remote branch, PR, release, and CI tasks.

## Configuration Checklist

Run `scripts/verify_gh_setup.sh [repo-path]` or perform these checks manually:

- `gh` is installed and on `PATH`.
- `gh --version` succeeds.
- `gh auth status` succeeds for `github.com`.
- The active account is the expected account for the current work.
- Token scopes include `repo`; include `workflow` when managing GitHub Actions, workflow files, or release automation.
- Git has `user.name` and `user.email` configured.
- In a repository, `origin` or the requested remote points to GitHub.
- The current branch exists and has the intended upstream before pulling, pushing, or opening PRs.

If any item is missing, stop and tell the user exactly what to configure. Prefer concrete commands such as `gh auth login`, `gh auth refresh -s repo -s workflow`, `git config --global user.name`, or `git remote add origin`.

## Permission Workflow

Anticipate approvals early. Before a workflow reaches network or remote-mutating commands, request permission for the expected command family.

- For pushing branches, request permission for `git push` early.
- If a sandboxed `git push` fails with DNS, host resolution, SSH, HTTPS, or other likely sandbox-related network errors, immediately rerun the same push command with `sandbox_permissions: "require_escalated"`, a concise `justification`, and `prefix_rule: ["git", "push"]`.
- For PR creation or edits, request permission for the specific `gh pr ...` family.
- If a sandboxed `gh pr ...`, `gh api ...`, or other GitHub CLI network command fails with likely sandbox-related network errors, immediately rerun the same command with `sandbox_permissions: "require_escalated"` and a narrow `prefix_rule` such as `["gh", "pr", "create"]`, `["gh", "pr", "view"]`, or `["gh", "api"]`.
- For status and metadata checks, request permission for the narrow read command when network access is likely.
- Do not ask repeatedly once the command prefix is approved in the current environment.
- Explain the remote, branch, and intended mutation before requesting approval for write operations.

## Transparent Use

When the user asks to commit changes, including the misspelling `Comit the changes`:

1. Inspect `git status --short` and relevant diffs.
2. Group related changes into coherent local commits.
3. Choose one commit message per group using the repository/user style.
4. Stage only the files or hunks for that group.
5. Run `git commit` for each group.
6. Do not push. A commit request never implies `git push`, branch publication, PR creation, or remote mutation.
7. Report the created commit SHAs and messages.

When the user asks to push changes or branches:

1. Inspect the repo state with `git status --short`, `git branch --show-current`, `git remote -v`, and `git rev-parse --abbrev-ref --symbolic-full-name @{u}` when available.
2. If there are uncommitted changes, do not push them unless the user asked to commit them first.
3. Interpret `push to main` as explicit authorization to push the local `main` branch to `origin/main`, the upstream remote branch for the protected `main` branch.
4. Confirm the target remote and branch from existing upstream tracking when possible.
5. Request `git push` permission before the final push if not already approved.
6. Run `git push` with explicit remote and branch when the upstream is missing or ambiguous.
7. If the sandbox blocks network access or reports `Could not resolve host`, `Could not resolve hostname`, SSH remote read failures caused by name resolution, or package/network-style DNS errors, rerun the same `git push` with `sandbox_permissions: "require_escalated"` and `prefix_rule: ["git", "push"]`.
8. Report the pushed branch and remote URL or PR URL when available.

When the user asks to open or update a PR:

1. Verify the branch is pushed.
2. Use `gh pr view` to detect an existing PR before creating a duplicate.
3. Inspect the repository's `.github` directory for a PR template and project label definitions before drafting or editing the PR.
4. Use the PR template when creating or updating the PR body.
5. Absorb repository label definitions and apply the matching existing GitHub labels with `gh pr edit --add-label` when creating or maintaining the PR.
6. Use `gh pr create` with an explicit base, head, title, and templated body when needed.
7. Return the PR number and URL.

When the user explicitly says creating the PR is required:

1. Treat PR creation as mandatory, not optional.
2. Do not stop after pushing a branch, reporting a compare URL, or mentioning that a PR could be created.
3. If the branch is not yet pushed, push it first.
4. If no PR exists, create it immediately using the repository template when available.
5. Only stop short of creating the PR when a real blocker remains after attempting the required GitHub operations, such as missing auth, missing network permission, or repository-side refusal.
6. Report the exact blocker and the furthest completed step only if PR creation actually fails.

### PR Template Rule

Always use the repository PR template when creating a PR in any git project.

Search for templates in this order:

1. `.github/PULL_REQUEST_TEMPLATE.md`
2. `.github/pull_request_template.md`
3. `.github/PULL_REQUEST_TEMPLATE/*.md`
4. `.github/pull_request_template/*.md`

If there is one template, use it as the PR body and fill every relevant section. Preserve headings, checklist items, and required fields. If a required field is unknown, write `TBD` or ask the user when the missing value would make the PR misleading.

If there are multiple templates, choose the clearly matching one from file name and context. If the choice is ambiguous, stop and ask which template to use.

If no repository template exists, create a concise PR body with summary, testing, risks, and related links; mention that no `.github` PR template was found.

### Project Label Rule

Before creating or maintaining a PR, inspect `.github` for repository-specific label definitions and conventions, even when they are not stored in a canonical GitHub file name.

Search in this order:

1. `.github/labels.yml`
2. `.github/labels.yaml`
3. `.github/labels.json`
4. `.github/*labels*.yml`
5. `.github/*labels*.yaml`
6. `.github/*labels*.json`
7. `.github/*label*.md`
8. Any other `.github/*label*` file that appears to document project labels or PR-routing conventions

When a candidate file is found:

- Read it and absorb the label names first, then any descriptions, colors, groups, examples, or routing rules.
- Treat the file as repository policy, not decoration. Use it to decide which existing labels belong on the PR and how the PR should be framed.
- Prefer exact repository label names from the file. Do not invent new label names unless the user explicitly asks to create them.
- If the file describes categories without exact GitHub labels, use the categories as guidance only and map them to clearly matching existing labels from `gh label list` or `gh api repos/{owner}/{repo}/labels`.
- If multiple label files disagree or define different schemes, prefer the most specific file for the current project area; if the conflict remains material, ask the user.
- If the file is Markdown or prose, extract the actionable label vocabulary and usage rules instead of treating it as a template.

When applying labels to a PR:

- Use the absorbed label definitions to choose labels that reflect scope, risk, platform, release train, ownership, and workflow state when those concepts are defined by the repository.
- When maintaining an existing PR, add missing matching labels with `gh pr edit --add-label`.
- Remove labels only when the repository convention or the user request makes the mismatch clear.
- Mention in the response which label-definition file was used, or that no project label file was found under `.github`.

When the user asks to check status:

1. Prefer `gh pr checks`, `gh run list`, `gh run view`, or `gh api repos/{owner}/{repo}/commits/{sha}/status` depending on the question.
2. If `gh auth status` reports an invalid or stale token, still attempt read-only status commands such as `gh run list`, `gh run view`, or `gh pr checks` before falling back; the active environment may still allow repository reads.
3. Summarize failing checks first, then pending and passing checks.
4. Include direct URLs when `gh` returns them.

## Safety

- Never push to `main`, `master`, `release-candidate`, or protected release branches unless the user explicitly asks for that target branch. Treat `push to main` as explicitly naming `origin/main` when `origin` is the configured remote for `main`.
- Never force-push unless the user explicitly asks and the branch/remote are restated in the approval request.
- Never expose tokens from `gh auth status` or config output; summarize account and scopes only.
- Prefer GitHub structured JSON output (`--json`, `--jq`) for parsing when available.
