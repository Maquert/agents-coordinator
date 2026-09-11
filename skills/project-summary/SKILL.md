---
name: project-summary
description: Summarize a project's latest build contents and blocked tasks in concise tables, prioritizing product changes and owner-facing blockers over repository status.
---

# Project Summary

Use this skill for daily or ad hoc product-state summaries when the user wants to know what shipped and what is blocked.

## Output contract

Return only these tables, in this order:

1. **Build contents** — compare the most recent build with the immediately previous build for each requested product.
2. **Blocked tasks** — list only currently blocked tasks that materially affect delivery or require owner help.

Do not add a repository-status section, commit-cleanliness note, ahead/behind counts, uncommitted-file counts, local build sentinels, WIP lists, or generic next steps unless the user explicitly asks for them. Do not narrate the collection process.

### Build contents table

Use one row per product and these columns:

| Product | Latest build | Previous build | Included / added | Removed / changed | Build evidence |
| --- | --- | --- | --- | --- | --- |

- Identify builds by hosted build number and version when reliable; include the source commit when available.
- If no hosted artifact or build number is accessible, explicitly label the result **source snapshot only** and use the latest two reliable tagged/release source snapshots. Never present a source tag, local configuration value, or sentinel as a shipped build number.
- Summarize product behavior and user-visible capability changes: features, workflows, platform surfaces, persistence/sync behavior, integrations, and meaningful QA evidence.
- State removals only when verified. Put behavior changes and validation changes in **Removed / changed**; do not list every file or test unless it proves a product capability.
- If the two builds contain no verified removal, write `None verified`.
- Keep each product row compact but specific. Missing evidence belongs in **Build evidence**, not in a repository-status aside.

### Blocked tasks table

Use these columns:

| Product | Blocked task | Priority | Blocking reason | Owner action needed |
| --- | --- | --- | --- | --- |

- Read live task state from Ecelyo when available; Ecelyo is the source of truth for tracked task state.
- Include only tasks whose canonical state is `blocked`. Do not infer blocked status from stale descriptions, failed tests, WIP state, or missing implementation evidence.
- Prefer the smallest set of delivery-relevant blockers. Include the task ID in the task cell when available.
- Translate the task description into a short concrete blocker and a clear owner action. Preserve authorization boundaries: call out when only the owner can provide credentials, signed-device access, production deployment approval, or external review.
- If no blocked tasks are found, write one row with `None verified` and state the scope checked.

## Product focus

For Papiplan, explicitly cover family-space food planning, trips, luggage, and iOS Calendar integration when they changed or are blocked. Distinguish contracts, local tests, implementation, live validation, and signed-device evidence; do not claim a feature is shipped from contract or test evidence alone.

For multiple products, keep one build row per product and one blocker row per relevant task. Tables are the deliverable; avoid explanatory prose outside them.
