---
name: create-chatgpt-agent
description: Create a reusable setup package for a custom ChatGPT GPT/agent from instructions, skills, knowledge files, and desired behavior. Use when the user asks to create, configure, export, package, or document a custom ChatGPT agent/GPT, or asks for files and instructions to build one manually in ChatGPT.
---

# Create ChatGPT Agent

Use this skill to produce a generic custom ChatGPT GPT setup package. The package should be usable in the ChatGPT GPT editor and should separate behavior instructions from reference knowledge.

## Workflow

1. Identify the agent's purpose, audience, and core workflows.
2. Decide what belongs in GPT Instructions versus Knowledge:
   - Instructions: behavior, tone, priorities, workflow routing, output format, boundaries.
   - Knowledge: reference material, source documents, detailed procedures, skill files, examples.
3. Create an export folder with this structure:

```text
<agent-export>/
├── README.md
├── gpt-config.md
├── instructions.md
└── knowledge/
    └── ...
```

4. Keep `instructions.md` concise and durable. Do not paste large reference material into it.
5. Put reusable reference files under `knowledge/`.
6. Include setup steps for the ChatGPT GPT editor.
7. Include validation prompts that test the intended behavior.
8. State limitations clearly, especially when the GPT cannot access local files, private systems, or external tools without a connector/action.

## Output Files

### README.md

Explain what the package contains and how to use it.

Include:

- File list.
- Setup steps.
- Important limitations.
- Validation prompt suggestions.

### gpt-config.md

Include:

- Name.
- Description.
- Instructions pointer.
- Knowledge files to upload.
- Recommended capabilities.
- Conversation starters.
- Validation prompts.

### instructions.md

Include GPT behavior only. A good default structure:

```markdown
# Instructions

You are a <role> for <audience/use case>.

## Core Behavior

- <behavior rule>
- <behavior rule>

## Knowledge Use

- Use uploaded knowledge files when they are relevant.
- Treat instructions as behavior and knowledge files as reference.
- If a relevant knowledge file is unavailable, say what is missing.

## Output Format

- <format preference>

## Boundaries

- Do not claim to perform actions unless a tool, connector, action, or user-provided result confirms them.
- If you cannot complete an action directly, provide exact instructions or files the user can use.
```

### knowledge/

Use for reference material. Keep files text-forward and clearly named.

Good examples:

- `knowledge/product-overview.md`
- `knowledge/workflows/release-process.md`
- `knowledge/skills/cost-estimation.md`
- `knowledge/examples/output-format.md`

## ChatGPT Setup Steps

Provide these generic instructions in the package:

1. Open `https://chatgpt.com/gpts`.
2. Select `Create`.
3. Use the `Configure` view.
4. Paste `instructions.md` into the Instructions field.
5. Upload files under `knowledge/` as Knowledge.
6. Enable only the capabilities the agent needs.
7. Test with the validation prompts in `gpt-config.md`.
8. Save or publish according to the user's workspace policy.

## Capability Guidance

- Enable Code Interpreter / Data Analysis for spreadsheet, table, file conversion, or analysis tasks.
- Enable web browsing/search only when the agent needs current information.
- Enable image generation only when image creation is part of the agent's purpose.
- Use actions/connectors only when the agent must call external APIs or modify external systems.

## Validation Checklist

Before finishing:

- `instructions.md` is generic and not overloaded with reference material.
- Knowledge files are separate and uploadable.
- Personal, project-specific, or secret details are omitted unless explicitly requested.
- Setup steps are complete.
- Validation prompts test routing, output format, and limits.
- The final answer links to the created files.

## Limitation Language

Use this wording when relevant:

```text
This GPT will not automatically edit local files or private systems unless you provide a connector, action, or runtime with that access. Without that, it should output the content or command to use instead of claiming the action was performed.
```
