---
name: task-model-selector
description: Select priority-ordered AI model recommendations for a software or backlog task by matching its work to installed skills and their `models:` metadata. Use when a user asks which model best fits a task, when filling Ecelyo Suggested AI Models, or when reviewing model preferences for task intake, planning, implementation, validation, or documentation work.
---

# Task Model Selector

Use this skill to make an advisory, explainable model recommendation. It does not assign a live agent, change `agentTechnology`, or launch a model.

## Workflow

1. Read the task title, goal, affected technology, risk, and validation needs.
2. Identify the installed skills whose trigger descriptions genuinely match the work. Prefer the most specific skills over broad workflow helpers.
3. Read the `models:` frontmatter from those matching skills. In each list, left-to-right order is priority order.
4. Order the matching skills by task relevance, then merge their model lists from left to right. Remove duplicates while keeping the first occurrence.
5. Return the result as a comma-separated list. The first model is the recommendation; later models are fallbacks.

## Selection Rules

- Treat `models:` metadata as advisory and local. Do not claim that it is a current vendor catalog or a benchmark result.
- Do not invent model identifiers, infer model capability from a name, or use a model that is absent from the applicable skills' metadata.
- Leave the recommendation empty when no matching skill declares models. State why instead of guessing.
- Consider the task's primary work before secondary work. For example, select a SwiftUI specialist before a general validation skill for a SwiftUI feature; use the validation model as a fallback only when its guidance is also relevant.
- Keep recommendations separate from the task's actual agent role, technology, assignee, and deeplink.
- Preserve stored order exactly. In Ecelyo, the Suggested AI Models value is an ordered preference list, not a set.
- When the task has a model catalog, validate every recommendation against it. If a skill's model is absent from the catalog, report the mismatch; do not silently substitute another model.

## Ecelyo Task Intake

When creating or refining an Ecelyo task that supports `suggestedAIModels`:

1. Apply the workflow above after the task's technical scope is clear.
2. Store the merged list in `suggestedAIModels` in the same order, or leave it empty when there is no applicable guidance.
3. In a task editor, present and accept the value as a comma-separated list of canonical model identifiers.
4. If the field is not yet available in the server or UI, return the recommendation to the requester but do not invent unsupported API fields or encode it into unrelated metadata.

## Response Shape

Use this compact shape unless the user asks for more detail:

```text
Suggested AI Models: <model 1>, <model 2>
Basis: <matching skill names; primary skill first>
Confidence: <high | medium | low>
```

For an empty result:

```text
Suggested AI Models: —
Basis: No applicable installed skill declares a model preference.
Confidence: low
```

## Maintaining the Mapping

- Keep each skill's `models:` list in priority order and use canonical identifiers consistently.
- Add or remove a model only with a concrete reason tied to that skill's work. Do not bulk-update lists merely because a vendor releases a new model.
- Audit model metadata and the Ecelyo catalog together when either changes, then preserve compatibility for existing task values.

## User-Configured Routing Preferences

These preferences are explicit user policy and are separate from installed skills' advisory
`models:` metadata:

- Prefer `GLM-5.2` for complex implementation or execution tasks.
- Prefer `Kimi K3` for tasks whose primary risk is complex analysis, investigation, planning, or review.
- Prefer `DeepSeek V4 Flash` for Medium and Trivial tasks when the task's agent and applicable skill
  can leverage it.
- If a task is Medium or Trivial but requires complex analysis, prefer `Kimi K3`; if it requires
  complex implementation, prefer `GLM-5.2`.
- Keep the applicable skill-derived models as ordered fallbacks after the user-configured preference.
- Treat these identifiers as user-provided preferences unless the active model catalog confirms them;
  do not claim catalog availability when no catalog is exposed.
