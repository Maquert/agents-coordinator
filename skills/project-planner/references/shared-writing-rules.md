# Shared Writing Rules

## Audience First

Start with the reader and decision stage:

- Executives need outcome, risk, cost, timeline, and decision needed.
- Product and business stakeholders need scope, user impact, trade-offs, milestones, and dependencies.
- Engineering reviewers need requirements, constraints, interfaces, data flow, failure modes, test strategy, and rollout.
- Security, privacy, legal, and compliance stakeholders need data classification, threat model, controls, auditability, retention, and regulatory impact.
- Operations stakeholders need deployment, observability, support, runbooks, capacity, SLOs, and incident paths.

## Style

- Lead with the most important information.
- Use short headings, short paragraphs, and lists/tables for scanning.
- Use active voice and direct language.
- Use consistent terms. Define acronyms on first use.
- Use sentence case for headings unless local style says otherwise.
- Use exact dates when timing matters.
- Prefer precise claims over persuasive language.
- Avoid hidden qualifiers such as "obviously", "simple", "just", or "clearly".
- Make uncertainty visible with `Assumption`, `Unknown`, `TBD`, or `Open question`.

## Stakeholder-Ready Structure

Open with:

1. Executive summary: one short paragraph.
2. Decision or discussion needed: one sentence.
3. Recommendation or current proposal: one sentence when applicable.
4. Impact summary: scope, risk, cost, timeline, and operational impact.

Then provide detail in descending order of decision relevance.

## Evidence and Sources

Include a `Sources` section in every substantial document:

- Link to tickets, PRs, code paths, dashboards, incidents, logs, vendor docs, and prior decisions.
- Distinguish primary evidence from interpretation.
- Capture source date or version when the source can change.
- If a source was inaccessible or inferred, say so.

## Alternatives and Trade-Offs

For each meaningful option, capture:

- Summary.
- Benefits.
- Costs and risks.
- Dependencies.
- Operational impact.
- Reversibility.
- Why chosen or discarded.

Use the same criteria for every option so comparison is fair.

## Diagram Guidance

Use diagrams only when they reduce ambiguity:

- C4 system context: external actors and systems.
- C4 container: deployable/runtime units and communication paths.
- Sequence or flow: critical runtime behavior.
- Deployment: infrastructure, regions, networking, and trust boundaries.
- State: lifecycle and transitions.

Every diagram needs a title, scope, legend when notation is non-obvious, and surrounding explanation.

## Related Standards and Practices

- Google developer documentation style guide: clarity, consistency, accessibility, active voice, descriptive links, and global-audience writing.
- Microsoft Style Guide: scannable content, short paragraphs, first things first, and clear structure.
- Diataxis: keep learning, task, reference, and explanation content distinct. Project-planning docs usually mix explanation and reference, but should not become tutorials.
- ISO/IEC/IEEE 42010: architecture descriptions identify stakeholders, concerns, viewpoints/views, rationale, and known issues.
- C4 model: use context and container diagrams for most software design discussions; add component/deployment/dynamic views only when they add value.

## Sources

- Google developer documentation style guide: https://developers.google.com/style/
- Google style highlights: https://developers.google.com/style/highlights
- Microsoft scannable content: https://learn.microsoft.com/en-us/style-guide/scannable-content/
- Diataxis: https://diataxis.fr/
- ISO/IEC/IEEE 42010 architecture descriptions: https://www.iso-architecture.org/ieee-1471/ads/
- C4 model diagrams: https://c4model.com/diagrams
