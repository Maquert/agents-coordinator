---
name: task-manager-assistant
description: Help agents communicate clearly with humans during task-manager workflows by providing useful identity, decisions, evidence, links, visuals, and blocker status.
---

# Task Manager Assistant

Use this skill whenever an agent needs to give a human an update, ask for clarification, challenge
an underspecified task, request review, explain a task-manager change, or report a blocker. It is
for human-facing communication around Ecelyo and similar task managers; use the task-manager API
skills for the actual state mutation.

## Make every update identifiable

Never refer to a task by ID alone. In the same sentence or table, include:

- task title and ID;
- project name and ID; and
- tactic name and ID.

For progress or closeout updates, also include the current task state, branch, worktree, validation
result, pull-request URL and state, and the next action. Prefer a compact table when several fields
are reported. Use the exact names and IDs returned by the task manager; do not invent or abbreviate
them. If a field is genuinely unavailable, say `N/A` and why.

## Turn uncertainty into useful collaboration

Do not send a vague “missing information” message and stop. First determine what can be learned or
done safely, then:

1. State the specific ambiguity, why it matters, and which decision or acceptance criterion it
   affects.
2. Ask one or more targeted questions that have actionable answers. Offer a reasonable default or
   concrete options when that helps the human decide.
3. Challenge assumptions respectfully when the requested outcome, scope, priority, dependency, or
   validation plan conflicts with the task or tactic goal.
4. Continue reversible investigation or preparation while waiting when it does not risk scope,
   data, permissions, or an irreversible change. Pause only at a decision gate that truly requires
   the human.
5. Record the answer, assumption, challenge, or decision in the Ecelyo task description,
   acceptance criteria, or other supported task-manager field so another agent can understand it.
   Include who/when only when the system supports it or it is useful context.

When you create acceptance criteria from an underspecified task, label them as agent-proposed,
explain the basis briefly, and tell the human exactly what was added and where. Do not silently turn
an assumption into a requirement.

## Make reviews actionable

When asking a human to review something, identify what to review and what decision is needed. Include
the task title/ID and project/tactic identity, a short summary of the relevant change, the validation
evidence, and a link to the artifact.

- For local files, use a clickable absolute file link.
- For GitHub changes, provide a direct link to the specific file (and line range when applicable),
  such as a `blob/<commit>/<path>` or `raw/<commit>/<path>` URL. A pull-request URL may be useful as
  context but is not a substitute for the direct file link.
- For Ecelyo records, provide the task's canonical deep link when available, alongside its title and
  ID. Never fabricate a URL; state when the system did not provide one.

Tell the human what question to answer, for example “Approve the empty state copy” or “Choose A/B
for the retry behavior,” rather than merely saying “please review.”

## Put visuals where the human can see them

Whenever a render, screenshot, diagram, or other visual is relevant, show or attach it directly in
the conversation using the host's image-display capability. Add a one-line caption describing the
state, viewport/device, and what to inspect. Do this even when the visual also exists on a pull
request.

If the visual is too large, unavailable to embed, or cannot be pulled, provide a direct link to the
exact image or file (for example, a raw/blob link containing its commit and path), not only a link
to the pull request. Explain why the inline visual is unavailable and what the human should inspect
at that link. For multiple visuals, show the smallest useful set and label each one.

## Blockers and status

Use `**BLOCKED**` in bold when a required gate prevents safe completion. Name the exact gate, its
owner, the evidence, and the smallest action or answer needed to unblock it. Do not call a task
blocked merely because a detail can be reasonably inferred or investigated.

For a normal update, distinguish clearly between `pending`, `wip`, `blocked`, and `finished` (or the
task manager's equivalent). “Implemented,” “PR opened,” and “ready” are progress notes, not final
statuses. A finished task must satisfy its delivery, validation, review, merge, cleanup, and task
state gates; report each gate when relevant.

## Final communication checklist

Before sending a task-manager update, verify that it answers:

1. Which task is this (title and ID), and where does it live (project/tactic names and IDs)?
2. What changed or was learned, and what evidence supports it?
3. What does the human need to decide, review, or do next?
4. Are direct artifact links and inline visuals included when relevant?
5. Is the current state unambiguous, with `**BLOCKED**` and the exact gate when blocked?
