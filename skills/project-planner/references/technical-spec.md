# Technical Specification and Architecture Design Document

Use a technical specification for an implementation-ready plan. Use an architecture design document for a broader technical vision, principles, and architectural guardrails that evolve over time.

## Technical Spec vs Architecture Design Document

| Type | Purpose | Best timing | Depth |
| --- | --- | --- | --- |
| Technical specification | Define exactly how to build, integrate, test, deploy, and operate a bounded change. | Before implementation. | Implementation-level detail. |
| Architecture design document | Describe a technical vision, principles, key decisions, and guardrails for a broad area. | During exploration and throughout evolution. | Strategic and architectural detail, updated as learning improves. |

## Similar Documents

- PRD: product/user problem, requirements, and business outcomes.
- Engineering plan: tasks, sequencing, estimates, and ownership.
- Test plan: verification scope, fixtures, environments, and acceptance gates.
- Migration plan: sequencing, compatibility, backfill, cutover, rollback.
- Threat model: assets, actors, trust boundaries, threats, mitigations.
- Operational readiness review: deployability, observability, on-call, incident readiness.
- ADR: one accepted decision extracted from the spec/design.

## Technical Specification Template

```markdown
# Technical specification: <title>

Status: Draft | In review | Approved | Implemented
Date: YYYY-MM-DD
Author: <name>
Reviewers: <names or roles>
Owners: <team/service owners>
Related: <tickets, ADRs, RFDs/RFCs, PRDs>

## Executive summary

<One paragraph for stakeholders: what changes, why, and expected impact.>

## Problem statement

<Current state, user/business problem, trigger, and why now.>

## Goals and non-goals

Goals:

- <goal>

Non-goals:

- <non-goal>

## Requirements

Functional:

- <requirement>

Non-functional:

- Reliability:
- Performance:
- Security/privacy/compliance:
- Observability:
- Maintainability:
- Cost:

## Current state

<Systems, flows, data, owners, dependencies, constraints.>

## Proposed design

<Architecture, components, APIs, data model, flows, lifecycle, failure modes.>

### Interfaces and contracts

| Interface | Producer | Consumer | Contract | Compatibility |
| --- | --- | --- | --- | --- |

### Data model and migration

<Schema changes, backfill, retention, data classification, rollback.>

### Security and privacy

<Trust boundaries, authN/authZ, secrets, PII, audit, compliance.>

### Operational design

<Deployment, config, observability, SLOs, alerts, runbooks, on-call impact.>

## Alternatives considered

| Option | Pros | Cons | Reason discarded |
| --- | --- | --- | --- |

## Rollout plan

| Phase | Scope | Validation | Rollback |
| --- | --- | --- | --- |

## Test and validation plan

- Unit/integration/e2e:
- Load/performance:
- Security/privacy:
- Migration/data correctness:
- Operational readiness:

## Risks and mitigations

| Risk | Probability | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- |

## Open questions

- <question>

## Sources

- <source links>
```

## Architecture Design Document Template

```markdown
# Architecture design: <area or system>

Status: Proposed | Ongoing | Accepted | Implemented | Superseded
Date: YYYY-MM-DD
Author: <name>
Coach/reviewers: <names or roles>
Affected areas: <systems/teams>
Related: <links>

## Executive summary

<Stakeholder-readable vision, why it matters, and the decision/feedback needed.>

## Context

<Current architecture, forces, constraints, and why change is needed.>

## Vision and principles

- <principle that guides future implementation>

## Stakeholders and concerns

| Stakeholder | Concern | View or section addressing it |
| --- | --- | --- |

## Architecture views

### System context

<Actors, external systems, and boundaries.>

### Container/runtime view

<Deployable units, storage, communications, ownership.>

### Deployment/operations view

<Infrastructure, environments, regions, scaling, observability, runbooks.>

### Security/privacy view

<Trust boundaries, data, controls, audit, compliance.>

## Key decisions and trade-offs

| Decision | Rationale | ADR needed? |
| --- | --- | --- |

## Alternatives and discarded directions

| Alternative | Why considered | Why discarded |
| --- | --- | --- |

## Evolution plan

<Milestones, migration waves, compatibility, deprecation, adoption strategy.>

## Risks, unknowns, and validation

<Risk register and learning plan.>

## Sources

- <source links>
```

## Writing Guidance

- Start small and evolve architecture design docs as learning improves.
- Keep the spec precise enough that implementers can estimate and sequence work.
- Keep architecture design docs useful as guardrails; do not require complete up-front blueprints.
- Extract accepted, architecturally significant decisions into ADRs.
- Include preliminary threat modeling for security-sensitive systems.

## Sources

- GitLab architecture design documents: https://handbook.gitlab.com/handbook/engineering/architecture/design-documents/
- GitLab architecture design workflow: https://handbook.gitlab.com/handbook/engineering/architecture/workflow/
- Technical design document guidance: https://www.cavaro.io/templates/technical-design-document
- ISO/IEC/IEEE 42010 architecture descriptions: https://www.iso-architecture.org/ieee-1471/ads/
- C4 model diagrams: https://c4model.com/diagrams
