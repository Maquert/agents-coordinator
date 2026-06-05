# Agent Worktrees

This directory holds the temporary git worktrees created by agents running in parallel.

All generated worktrees should live here, regardless of which agent created them, including Codex, Claude, or Gemini. The exact number of worktrees present at any time depends on the local agent and worktree configuration.

## Purpose

- Keep agent-created worktrees in one predictable location.
- Isolate parallel task work from the main checkout.
- Allow multiple agents to work on different branches without colliding in the same working tree.

## Tracking policy

These worktrees are intentionally not committed to the repository:

- they are temporary working directories
- they are created from and attached to an existing git repository
- committing them would interfere with normal git repository behavior and create unnecessary repository noise

In practice, this directory is a local runtime area for agent execution, not a source-controlled project artifact.
