# Architecture Decision Record

Use an ADR to record one architecturally significant decision and its rationale. ADRs are decision records, not full design guides.

## When To Use

Use an ADR when a decision affects:

- System structure or boundaries.
- Non-functional requirements such as security, availability, fault tolerance, latency, or scalability.
- Dependencies and coupling.
- APIs, published contracts, or data models.
- Construction techniques such as frameworks, languages, libraries, deployment patterns, or processes.
- A choice that is expensive to reverse.

Split separate decisions into separate ADRs.

## Lifecycle

Recommended statuses:

- Proposed.
- Accepted.
- Rejected.
- Deprecated.
- Superseded by ADR-NNN.

Accepted ADRs should be append-only. If the decision changes, create a new ADR and mark the old one as superseded.

## Template

```markdown
# ADR-NNN: <decision title>

Status: Proposed | Accepted | Rejected | Deprecated | Superseded by ADR-NNN
Date: YYYY-MM-DD
Author: <name>
Deciders: <names or roles>
Reviewers: <names or roles>
Related: <links>

## Context and problem statement

<What issue, constraint, requirement, or change forces a decision now?>

## Decision drivers

- <driver 1>
- <driver 2>
- <driver 3>

## Considered options

| Option | Summary | Pros | Cons | Reversibility |
| --- | --- | --- | --- | --- |
| <option> | <summary> | <pros> | <cons> | High/Medium/Low |

## Decision outcome

We will <decision>.

Chosen because <rationale tied to decision drivers>.

Confidence: High | Medium | Low

## Consequences

Positive:

- <what becomes easier or better>

Negative:

- <what becomes harder, riskier, or more constrained>

Neutral / follow-up:

- <follow-up decisions, work, or monitoring>

## Validation

- <how the decision will be checked>

## Sources

- <source links>
```

## Writing Guidance

- Keep it pithy, assertive, factual, and self-contained.
- Prefer present/future tense for active decisions: "We will use X."
- Capture the reasoning, not just the outcome.
- Include rejected alternatives and why they lost.
- Include confidence when uncertainty matters.
- Do not hide negative consequences.
- Do not turn the ADR into a full implementation spec; link to supporting design docs when needed.

## Sources

- ADR GitHub organization definitions: https://adr.github.io/
- MADR overview and template family: https://adr.github.io/madr/
- MADR example decision: https://adr.github.io/madr/decisions/0000-use-markdown-architectural-decision-records.html
- AWS ADR process and scope: https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html
- AWS ADR best practices: https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/best-practices.html
- Microsoft ADR guidance: https://learn.microsoft.com/en-ie/azure/well-architected/architect-role/architecture-decision-record
