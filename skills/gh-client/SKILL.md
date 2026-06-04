---
name: gh-client
description: Connect to GitHub from a local git repository by using the GitHub CLI (`gh`) and git. Use when Codex needs to verify GitHub access, identify the repository and current branch, locate the active pull request, fetch structured PR metadata, retrieve review threads or line comments with file and line information, or perform follow-up PR operations such as pushing branch updates or resolving clearly addressed review threads.
---

# GitHub Client

Use this skill as the GitHub access layer for repository work. Keep GitHub transport, authentication, PR discovery, and structured comment retrieval here so higher-level skills can stay focused on repository logic.

## Setup Checks

Verify the environment before depending on GitHub data:

- `gh` is installed and callable.
- `gh auth status` succeeds for `github.com`.
- `git remote -v` shows the expected GitHub remote.
- `git branch --show-current` returns the active branch.

If authentication or remote configuration is missing, stop and report the exact missing prerequisite.

## Repository And Branch Discovery

Resolve these facts first:

- repository owner and name
- current branch
- upstream branch when available
- current `HEAD` SHA

Prefer structured commands and machine-readable output. Use `--json` and `--jq` where available, then normalize the result into compact JSON or TOON for downstream skills.

## PR Identification

When another skill needs the active PR:

1. Prefer an already-known PR number or URL from the current session if one is explicit.
2. Otherwise, match the current branch to an open PR.

Use a branch-based fallback such as:

```bash
gh pr view --json number,url,title,headRefName,baseRefName
```

If that does not resolve cleanly for the current branch, use a repository-scoped lookup:

```bash
gh pr list --state open --head "$(git branch --show-current)" --json number,url,title,headRefName,baseRefName
```

Return a single PR object or report zero/multiple matches explicitly.

## Structured Review Retrieval

For PR review workflows, fetch structured review data instead of relying on free-form timeline text.

Prefer data that includes:

- PR number and URL
- review thread id
- review comment id
- file path
- current line and original line
- side
- diff hunk
- body text
- author login
- created time
- resolution state
- comment URL

Use the simplest command that returns the required shape.

Prefer this handoff format for caller skills:

- raw GitHub response in JSON when the full payload is needed
- compact TOON when the caller mainly needs normalized review items

Use TOON for repeated review items with the same schema, for example:

```text
review_items
- pr_number: 123
  pr_url: https://github.com/owner/repo/pull/123
  thread_id: THREAD_ID
  comment_id: COMMENT_ID
  is_resolved: false
  path: src/file.ts
  line: 42
  original_line: 40
  side: RIGHT
  author: reviewer
  url: https://github.com/owner/repo/pull/123#discussion_r1
  body: Guard against empty input here.
  diff_hunk: "@@ ..."
```

### Line Comments

For line-level review comments, prefer the pull-request comments API:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments
```

Use `--jq` or shell-native shaping to keep only the fields the caller needs. Do not require Python just to reshape API responses.

### Review Threads

When resolution state or thread grouping matters, use GraphQL so unresolved review threads can be identified directly. Fetch `reviewThreads` and each thread's `comments` with path, line metadata, body, author, and `isResolved`.

Prefer a query shape equivalent to:

```graphql
repository(owner: $owner, name: $repo) {
  pullRequest(number: $number) {
    url
    number
    headRefName
    baseRefName
    reviewThreads(first: 100) {
      nodes {
        id
        isResolved
        path
        line
        originalLine
        diffSide
        comments(first: 100) {
          nodes {
            id
            url
            body
            createdAt
            author { login }
          }
        }
      }
    }
  }
}
```

Paginate when a PR exceeds one page of comments or threads.

## File Mapping

GitHub comments may reference stale line numbers after the branch moves. Help caller skills by returning both:

- the GitHub-provided path and line metadata
- the diff hunk or patch context needed to relocate the comment in the current file

Do not attempt to edit files in this skill; return enough context for the caller to decide.

## Pushes And PR Mutations

When a caller needs remote mutation:

- use normal `git push` for branch updates
- use `gh pr view` or `gh pr edit` for PR metadata changes
- use `gh api graphql` mutations only when a structured PR action such as thread resolution is required

Resolve review threads only when the caller explicitly decides the code change is complete.

## Safety

- Never introduce a Python dependency just to parse or validate GitHub responses.
- Never expose tokens or auth secrets.
- Never force-push unless explicitly requested.
- Never assume the branch has exactly one PR without checking.
- Distinguish clearly between missing PR, stale comments, and unresolved comments.
