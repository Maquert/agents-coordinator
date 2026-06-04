# AI usage optimization best practices

Use this reference only for deeper prompt, skill, or AI workflow audits.

## Source-backed principles

- OpenAI prompt guidance: put instructions first, separate context with delimiters, be specific about desired context/outcome/length/format/style, use examples for output format, reduce fluffy language, and say what to do rather than only what not to do.
  Source: https://help.openai.com/en/articles/6654000-how-to-prompt-the-models

- OpenAI prompt caching: cache hits require exact prompt-prefix matches. Put static content such as instructions and examples at the beginning, and variable user/request data at the end. Prompt caching can reduce latency and input-token cost for repeated prefixes.
  Source: https://platform.openai.com/docs/guides/prompt-caching

- OpenAI model selection: set an accuracy target first, then optimize for cost and latency with the cheapest/fastest model that still meets the target.
  Source: https://platform.openai.com/docs/guides/model-selection/principles

- OpenAI latency guidance: latency is driven heavily by model choice and generated token count. Reduce output tokens, input tokens, and unnecessary requests; parallelize where appropriate; do not default to an LLM for deterministic work.
  Sources: https://help.openai.com/en/articles/6901266-optimizing-latency-with-openai-api-models and https://platform.openai.com/docs/guides/latency-optimization

- Anthropic prompt guidance: define success criteria and a way to test them before tuning prompts. Work from clear/direct instructions, examples, structured tags, roles, prompt chaining, and long-context techniques depending on the failure mode.
  Source: https://docs.anthropic.com/en/docs/prompt-engineering

- Anthropic XML/structured prompt guidance: use consistent tags to separate instructions, examples, context, and output format; nested tags help with hierarchical content.
  Source: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags

- TOON: use TOON as a lossless JSON-data encoding optimized for LLM prompts, especially uniform arrays of objects. Prefer JSON compact for deeply nested or non-uniform data, CSV for pure flat tables, and benchmark when latency matters.
  Sources: https://github.com/toon-format/toon and https://toonformat.dev/guide/getting-started

- RTK Query cache behavior as an AI-workflow analogy: cache by endpoint plus serialized parameters; equivalent cache keys dedupe requests and share results. Apply this pattern to AI calls by hashing model, prompt version, static context version, input data id, and tool parameters.
  Sources: https://redux-toolkit.js.org/rtk-query/usage/cache-behavior and https://redux-toolkit.js.org/rtk-query/overview

## Cost-efficient prompt checklist

- Define the job in one action verb.
- Include only context needed for the next decision or output.
- State output shape and length.
- Use compact structured data formats.
- Put reusable instructions before variable input.
- Ask for uncertainty or missing-info reporting.
- Avoid repeated examples unless needed.
- Avoid asking for hidden broad research when a narrower tool lookup or file read is enough.
- Request implementation when you want code changes; request options when you want analysis only.
- Prefer validation criteria over vague quality words.
- For usage reports, ask for `Per-request breakdown only, no explanation` when you only need the table.

## ChatGPT context usage checklist

- Treat the chat history as paid context, not free storage.
- Restart or branch the chat when the active goal changes.
- Carry forward a short state summary instead of a full transcript.
- Keep custom instructions and memory for durable preferences, terminology, and recurring constraints.
- Keep temporary constraints, logs, stack traces, and large pasted files out of memory; attach or summarize them per task.
- Put the latest user intent and current source of truth near the end of the prompt.
- Mark stale assumptions explicitly so the assistant does not continue optimizing around rejected context.
- Ask for "answer from the summary only" when old context should not influence the response.
- Use a structured handoff: goal, current state, decisions, constraints, next action, discarded context.
- Use separate chats for unrelated projects to avoid cross-topic context drag.

## Cost-efficient skill checklist

- Frontmatter description contains every trigger.
- `SKILL.md` is the hot path, not the full manual.
- Optional details live in one-level `references/`.
- Deterministic repeated operations live in `scripts/`.
- Examples are short and behavior-changing.
- Validation is explicit.
- The skill says when to skip itself or keep feedback brief.
- Usage-report coaching includes the phrase `Per-request breakdown only, no explanation`.
