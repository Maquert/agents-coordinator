# New Technical Project Analysis

Use this checklist before drafting any ADR, RFD/RFC, technical spec, or architecture design document.

## Context

- Business objective and expected user/customer outcome.
- Trigger: why now, what changed, and what happens if nothing is done.
- Current state: systems, owners, code paths, data stores, workflows, operational posture.
- Target state: high-level description and boundaries.
- Stakeholders and concerns.
- Decision stage: exploration, discussion, proposal, accepted decision, implementation plan.

## Scope

- Goals.
- Non-goals.
- In-scope systems, teams, users, data, environments, and workflows.
- Out-of-scope systems and intentionally deferred work.
- Success metrics and acceptance criteria.

## Requirements

- Functional requirements.
- Non-functional requirements: reliability, performance, scalability, security, privacy, compliance, accessibility, usability, maintainability, operability, cost, and time-to-market.
- Architecturally significant requirements: requirements that affect structure, interfaces, dependencies, deployment, or quality attributes.
- Constraints: deadline, budget, staffing, platform, vendor, compatibility, migration, legal, data residency, and organizational constraints.

## Dependencies

- Upstream and downstream systems.
- External vendors and APIs.
- Data contracts and schemas.
- AuthN/AuthZ, secrets, networking, observability, CI/CD, feature flags, release tooling.
- Team dependencies and approval paths.
- Version, deprecation, and migration dependencies.

## Risks

Track each risk with probability, impact, owner, mitigation, detection signal, and fallback.

Common risk categories:

- Delivery: unclear scope, unknown ownership, blocked dependencies.
- Technical: complexity, coupling, migration risk, data correctness, performance.
- Operational: deployability, rollback, incident response, on-call load.
- Security/privacy/compliance: data exposure, authorization gaps, auditability.
- Product/business: adoption, customer disruption, support cost, opportunity cost.
- Vendor: lock-in, rate limits, cost changes, SLA, roadmap uncertainty.

## Options

Always include:

- Status quo.
- Least-complex viable option.
- Strategic/long-term option.
- Any option already proposed by stakeholders.

Evaluate options with the same criteria:

- Fit to goals.
- Complexity.
- Time and cost.
- Reliability and operability.
- Security/privacy/compliance.
- Team expertise and maintainability.
- Dependencies.
- Reversibility.
- Failure modes.

## Sources

Gather and cite:

- Prior ADRs/RFCs/specs.
- Code and configuration paths.
- Incident reports and dashboards.
- Product requirements, tickets, and customer research.
- Architecture diagrams and dependency maps.
- Vendor docs and limits.
- Security/privacy guidance.
- Meeting notes and stakeholder decisions.

## Output Readiness

Before writing, ensure:

- The problem is specific enough to state in one paragraph.
- Goals and non-goals are explicit.
- Stakeholders and reviewers are named or represented by role.
- Unknowns are visible and not disguised as facts.
- The chosen document type matches the decision stage.
