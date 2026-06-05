# Summary

## Response Metadata
- At the end of every response, include a compact Markdown table with columns `Item` and `Value`.
- The table must include whether a skill was used (which ones).
- Preferred final-response format:
  `| Item | Value |`
  `| --- | --- |`
  `| Skill | No skill used. |`

## AI Efficiency Coaching
- Always load and use the `ai-efficiency-coach` skill in every conversation/session.
- Treat references to `ai-efficiency-skill` as references to `ai-efficiency-coach`.
- Include one brief `AI efficiency feedback:` note when it can help improve the user's prompts, Codex skills, or AI workflows without distracting from the main task.
- Keep this feedback cheap, varied, and specific to the current request.

## Skill Routing
- When the user asks to create, configure, export, package, or document a custom ChatGPT GPT/agent, load and use the `create-chatgpt-agent` skill.
- When the user asks to use GitHub CLI, push changes to remote branches, create or inspect pull requests, or check GitHub remote status, load and use the `gh-cli` skill.
- When the user asks to plan a new technical project or write stakeholder-facing ADRs, RFDs/RFCs, technical specifications, architecture design documents, or related project planning docs, load and use the `project-planning-docs` skill.
- When the user asks to build, test, archive, diagnose, or maintain Xcode projects from the terminal, load and use the `xcode-terminal` skill and also use `xcsift` for build/test output.

## Execution
- Whenever planning to execute code or commands that are likely to require approval, anticipate the permission need and request it early so the user can step away while work continues.
- For automation prompts that require Git writes, include “request escalation for branch/merge/push if sandbox blocks Git metadata” so the automation can ask for approval early when needed.
- When the user says `Commit the changes` or `Comit the changes`, interpret it as: group related changes, choose one commit message per group, stage each group, and create local git commits. It never means to push changes.
- If there have been changes to code in a repository, propose a brief git commit message at the end. Otherwise ignore this instruction. Commit messages must start with a verb and stay under 100 characters. Use this pattern: `<verb><object complement><optional extra content>`. Example: `Add configuration for a deploy pipeline`.

## Review
- When reviewing, perform a git diff against the `main` branch to learn which files changed.
- Review those files.
- Write the review result in a `REVIEW.md` file.

## Markdown Formatting
- When markdown output is requested, return it in code format.

@/Users/mhjaso/.codex/RTK.md

## Imported Claude Cowork project instructions
