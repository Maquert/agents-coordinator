---
name: gh-review
description: Review GitHub pull request feedback and address requested code changes. Use when Codex needs to find the active PR for the current branch, read PR review comments with file and line context, decide whether reviewer feedback requires a code change, apply fixes, validate them, and commit and push the result back to the PR branch. Trigger on requests such as "review the PR comments" and similar prompts about addressing pull request review feedback.
---

# GitHub Review

Use this skill to turn PR feedback into repository changes. Delegate GitHub connectivity, PR lookup, and structured comment retrieval to `$gh-client`; keep this skill focused on review analysis, code edits, validation, and branch updates.

## Workflow

1. Load `$gh-client` first.
2. Identify the target PR.
3. Collect review comments and threads with file and line metadata.
4. List the found comments in a working checklist and mark their current resolution state.
5. Inspect each comment against the current code and diff context.
6. Apply code changes only when the reviewer is correct or the requested change is otherwise worthwhile.
7. Validate the fix with the narrowest useful tests or checks.
8. Update the checklist to show which comments are now resolved.
9. Commit and push the change set to the PR branch.

## Identify The PR

Prefer the PR already established by the current session when that context is explicit.

Use current-branch matching only as a fallback:

- Ask `$gh-client` to resolve the current repository, current branch, and matching open PR.
- If exactly one open PR matches the branch, use it.
- If no PR matches the branch, stop and report that no open PR was found.
- If multiple PRs match, stop and surface the ambiguity.

## Review Intake

Ask `$gh-client` for structured PR review feedback, not just timeline prose. Prefer TOON for the normalized review-item list and raw JSON only when deeper GitHub fields are needed. The data must include, when available:

- PR number and URL
- head branch and base branch
- review thread or comment URL
- comment author
- comment body
- file path
- current line, original line, and side when present
- diff hunk or nearby patch context
- thread resolution state

Prioritize unresolved review threads and line-level comments before general PR discussion.

## Review Checklist

Create a compact working checklist as soon as the PR comments are collected.

- List each relevant review item once.
- Include enough detail to identify it later: file, line, reviewer, and short comment summary.
- Mark whether it is already resolved on GitHub when that state is available.
- Update the checklist after code changes and validation so it shows which comments are resolved, still open, stale, or intentionally not changed.

Prefer a checklist shape like:

```text
- [ ] src/file.ts:42 reviewer-name - guard against empty input
- [x] src/other.ts:18 reviewer-name - rename misleading variable
- [-] src/legacy.ts:77 reviewer-name - stale after refactor
```

Use:

- `[ ]` for unresolved items that still need action
- `[x]` for comments resolved by the current branch state
- `[-]` for stale or intentionally unaddressed items that should be explained in the report

## Comment Analysis

For each review comment:

1. Open the referenced file and inspect the commented line plus nearby context.
2. Compare the current file with the diff hunk from GitHub when the file may have moved since the comment was written.
3. Decide whether the comment asks for:
   - a real bug fix
   - a style or maintainability cleanup worth taking
   - no code change because the concern is outdated, already addressed, or incorrect
4. Avoid cargo-cult edits. The goal is to satisfy the review with correct behavior, not to mechanically mirror the comment text.

If a comment is stale because the code already changed, state that clearly in the final report instead of forcing another edit.

## Implement Fixes

Group related review feedback into coherent edit batches.

- Favor the smallest change that fully addresses the concern.
- Preserve existing project conventions.
- Add or update tests when the review points at behavior, not only formatting.
- If one comment reveals a broader nearby defect, fix the adjacent issue in the same batch only when the change remains easy to justify and validate.

When a reviewer suggestion should not be applied, do not make a compensating code change just to appear responsive.

## Validation

Run the narrowest checks that give real confidence:

- targeted tests for behavior changes
- lint or type-check commands for API or signature edits
- build steps when the fix can break compilation

If validation cannot run, say so explicitly and explain why.

## Commit And Push

After the fixes are complete:

1. Inspect the diff to confirm the change set matches the review feedback.
2. Create one or more local commits with concise verb-led messages.
3. Push to the PR head branch.
4. Report the commit SHA(s), branch, and PR URL.

Do not force-push unless the user explicitly asks for it.

## Resolution Discipline

Resolving a review thread is optional unless the user asks for it or repository workflow requires it.

- If you resolve threads, do it only after the fix is pushed.
- Resolve only threads clearly addressed by the pushed code.
- Leave ambiguous threads open and mention them in the report.

## Output

Summarize the outcome compactly:

- PR used
- checklist of found comments with final status
- comments addressed
- comments left unchanged and why
- validation run
- commit message(s)
- push result
