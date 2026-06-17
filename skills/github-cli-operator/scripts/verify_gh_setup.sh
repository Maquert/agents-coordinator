#!/usr/bin/env bash
set -u

repo_path="${1:-$(pwd)}"
status=0

check_ok() {
  printf '[OK] %s\n' "$1"
}

check_fail() {
  printf '[MISSING] %s\n' "$1"
  status=1
}

if command -v gh >/dev/null 2>&1; then
  check_ok "gh is installed: $(command -v gh)"
  gh --version | head -n 1
else
  check_fail "Install GitHub CLI: https://cli.github.com/"
fi

if command -v git >/dev/null 2>&1; then
  check_ok "git is installed: $(command -v git)"
else
  check_fail "Install git before using GitHub CLI workflows."
fi

if command -v gh >/dev/null 2>&1; then
  auth_output="$(gh auth status 2>&1)"
  auth_code=$?
  if [ "$auth_code" -eq 0 ]; then
    check_ok "gh auth status succeeds"
    printf '%s\n' "$auth_output" | sed -E 's/gho_[A-Za-z0-9_]+/gho_************************************/g'
    printf '%s\n' "$auth_output" | grep -q "'repo'" || check_fail "Refresh gh auth with repo scope: gh auth refresh -s repo"
  else
    check_fail "Authenticate gh: gh auth login"
    printf '%s\n' "$auth_output"
  fi
fi

git_name="$(git config --global user.name || true)"
if [ -n "$git_name" ]; then
  check_ok "git user.name is configured: $git_name"
else
  check_fail "Configure git user.name: git config --global user.name \"Your Name\""
fi

git_email="$(git config --global user.email || true)"
if [ -n "$git_email" ]; then
  check_ok "git user.email is configured: $git_email"
else
  check_fail "Configure git user.email: git config --global user.email you@example.com"
fi

if git -C "$repo_path" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  check_ok "repo path is a git worktree: $repo_path"
  branch="$(git -C "$repo_path" branch --show-current || true)"
  if [ -n "$branch" ]; then
    check_ok "current branch: $branch"
  else
    check_fail "Current branch could not be determined."
  fi

  remotes="$(git -C "$repo_path" remote -v || true)"
  if printf '%s\n' "$remotes" | grep -q 'github.com'; then
    check_ok "at least one remote points to GitHub"
    printf '%s\n' "$remotes"
  else
    check_fail "Add or update a GitHub remote for this repo."
    printf '%s\n' "$remotes"
  fi

  upstream="$(git -C "$repo_path" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
  if [ -n "$upstream" ]; then
    check_ok "upstream is configured: $upstream"
  else
    check_fail "No upstream configured for current branch; push with explicit remote/branch or set upstream."
  fi
else
  printf '[INFO] %s is not a git repository; skipped repo-specific checks.\n' "$repo_path"
fi

exit "$status"
