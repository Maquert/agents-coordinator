---
name: project-planning-docs
description: Assist with planning new technical projects and writing stakeholder-ready Architecture Decision Records (ADRs), Requests for Discussion/Comments (RFDs/RFCs), technical specifications, architecture design documents, decision logs, and related project-planning documents. Use when Codex needs to analyze a new technical project, gather context, dependencies, risks, alternatives, sources, and trade-offs, or draft/review one focused project document at a time.
---

# Project Planning Docs

## Workflow

1. Identify exactly one target document type for the current task.
2. If the user asks for several documents, choose one to write first and list the others as follow-up artifacts.
3. Read `references/shared-writing-rules.md` and `references/project-analysis.md`.
4. Read only the document-type reference needed now:
   - ADR: `references/adr.md`
   - RFD/RFC: `references/rfd-rfc.md`
   - Technical specification or architecture design document: `references/technical-spec.md`
5. Ask for missing high-impact inputs only when a reasonable draft would be misleading without them. Otherwise, mark unknowns as `TBD` or `Assumption`.
6. Draft the document in Markdown unless the user requests another format.
7. Include sources and assumptions. Separate facts, decisions, and open questions.
8. Review the draft against the quality bar before finalizing.

## Document Selector

- Use an ADR when the main output is a record of one architecturally significant decision and its rationale.
- Use an RFD when the main output is to frame a discussion, invite broad input, or explore an idea before commitment.
- Use an RFC when the main output is a proposal that seeks review, consensus, and adoption.
- Use a technical specification when the main output is an implementation-ready plan for a bounded system, feature, migration, or integration.
- Use an architecture design document when the main output is a longer-lived technical vision, principles, and guardrails for a broad or evolving area.
- Use a decision log when the user needs an index of many ADRs or a lightweight record of decisions.
- Use a DACI-style decision document when ownership, approver, contributors, and informed parties matter more than technical design depth.
- Use a problem brief before an RFC/spec when the problem is unclear or stakeholders have not aligned on scope.

## Output Contract

Every produced document should include:

- Title, status, owner/author, reviewers, and date when known.
- Audience and decision stage.
- Problem statement and context.
- Goals and non-goals.
- Stakeholders and their concerns.
- Constraints, dependencies, risks, and assumptions.
- Options considered, including discarded alternatives.
- Recommended or decided approach, depending on document type.
- Consequences, trade-offs, and reversibility.
- Open questions and next steps.
- Sources with links or repository paths.

## Quality Bar

- The executive summary must stand alone for stakeholders.
- The structure must match the chosen document type.
- Each section must answer why it exists; remove generic filler.
- Use evidence for claims. Mark speculation as assumption.
- Include negative consequences and rejected alternatives.
- Prefer tables for comparisons, risks, owners, dependencies, and rollout plans.
- Keep diagrams purposeful. Use C4-style context/container views when they clarify system boundaries.
- Do not merge ADR, RFD/RFC, and technical spec structures into one unfocused document.
