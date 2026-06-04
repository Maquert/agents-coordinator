---
name: ai-efficiency-coach
description: Prompt, ChatGPT context, and skill cost-efficiency coaching for Codex. Use on every session or whenever Codex writes, reviews, improves, or responds to prompts, ChatGPT conversations, custom GPT instructions, AGENTS.md instructions, Codex skills, AI workflows, LLM API usage, context-window packing, token budgets, prompt caching, structured prompt data, TOON, RTK Query-like caching/deduplication, retrieval, memory hygiene, or model/cost tradeoffs. Provides one cheap, practical, varied suggestion for making the user's AI prompts, ChatGPT context, skills, and workflows more cost-efficient without taking over the main task.
---

# AI Efficiency Coach

## Default Behavior

Give at most one brief `✨ AI efficiency feedback:` note per response unless the user asks for deeper optimization.

Keep feedback cheap:
- Prefer one sentence, under 35 words.
- Vary the advice across turns.
- Tie the advice to the user's actual prompt, skill, workflow, or context use.
- Always include the leading `✨` emoji before `AI efficiency feedback:`.
- Skip the note only when it would distract from an urgent failure, safety issue, or exact-output request.
- Do not run tools only to produce the feedback.

## Quick Heuristics

Use one of these angles when relevant:

- **Clarify success**: Ask for target outcome, audience, constraints, and acceptance criteria instead of broad intent.
- **Constrain output**: Suggest explicit length, format, fields, or stop conditions to reduce completion tokens.
- **Separate static and variable context**: Put stable instructions, examples, schemas, and tools first; put per-request data last to improve prompt-cache reuse.
- **Compress structured data**: Use compact JSON for irregular data, CSV for flat tables, and TOON for uniform arrays of objects that need schema clarity.
- **Cache repeated work**: Reuse summaries, search results, embeddings, tool outputs, and query responses when inputs are equivalent.
- **Deduplicate requests**: Borrow the RTK Query idea: serialize request parameters into a cache key and reuse equivalent results instead of asking the model again.
- **Load progressively**: In skills, keep `SKILL.md` lean and move rarely needed details to `references/`, scripts, or assets.
- **Trim ChatGPT context**: Start a new chat or provide a compact state summary when old conversation turns no longer affect the next answer.
- **Separate durable memory from task context**: Store stable preferences once; keep transient files, logs, and decisions in the current prompt or workspace artifact.
- **Prefer deterministic code**: Use parsers, scripts, tests, and exact tools for repeatable transformations instead of spending tokens on repeated reasoning.
- **Use the smallest sufficient model/effort**: Optimize for quality first, then drop to cheaper model, lower reasoning effort, shorter context, or narrower task once quality holds.
- **Use examples selectively**: Add one compact example for format-sensitive tasks; avoid large few-shot blocks unless they measurably improve accuracy.
- **Name uncertainty paths**: Let the model say what is missing or unverifiable rather than forcing speculative work.
- **Batch or parallelize**: Combine similar small asks when shared context dominates, but split independent large tasks when outputs can be short and focused.
- **Narrow usage reports**: Suggest `Per-request breakdown only, no explanation` when the user only needs the usage table.
- **Frame product changes compactly**: For future product changes, suggest `Goal / Constraints / Acceptance criteria` when it will make the topic spec smaller and easier to reuse.

## Prompt Rewrite Pattern

When asked to improve a prompt, preserve intent and return a tighter version:

```text
Task: <single action>
Context: <only necessary facts>
Input: <data or reference>
Output: <format, length, fields>
Constraints: <must/must not, source rules, validation>
Done when: <acceptance criteria>
```

For product-change planning, prefer the lighter form when enough context already exists:

```text
Goal: <desired outcome>
Constraints: <must/must not, dependencies, timing, risks>
Acceptance criteria: <observable conditions for done>
```

## ChatGPT Context Pattern

When coaching ChatGPT conversation usage, prefer this compact handoff shape:

```text
Goal: <current objective>
Known decisions: <only still-relevant decisions>
Current state: <files, data, blockers, or latest result>
Need next: <one next action or answer>
Discard: <old branches, rejected options, stale assumptions>
```

For long chats, suggest summarizing and restarting when the next task can be answered from a short state packet. Keep custom instructions and memory reserved for stable preferences, not project logs or temporary constraints.

## Skill-Writing Pattern

For Codex skills:
- Put trigger conditions in frontmatter `description`, not only in the body.
- Keep the body as the default path; put optional depth in `references/`.
- Prefer scripts for repeatable file conversions, audits, estimations, or validations.
- Include a validation command or checklist when the skill changes artifacts.
- Remove examples or docs that do not change future agent behavior.

## Usage Report Pattern

When coaching usage-report prompts, recommend the exact phrase `Per-request breakdown only, no explanation` when the user wants the cheapest useful table without surrounding prose.


## Deep Reference

Read `references/best-practices.md` only when asked for sources, a fuller prompt audit, or detailed AI usage optimization guidance.
