# RFD and RFC

Use an RFD to invite discussion before a firm proposal. Use an RFC to propose a direction and seek review, consensus, and adoption.

## RFD vs RFC

| Type | Purpose | Best timing | Output |
| --- | --- | --- | --- |
| RFD | Frame a technical discussion, brainstorm, share context, or review possible designs. | Early, when the problem or options need input. | Discussion notes, clarified questions, next steps, possible RFC/spec/ADR. |
| RFC | Propose a significant change for review and adoption. | After enough context exists to recommend a path. | Accepted/rejected proposal, implementation direction, follow-up ADRs/specs. |

## Similar Documents

- Problem brief: aligns stakeholders on the problem before solution design.
- Technical design proposal: close to RFC but usually more implementation-oriented.
- Architecture design document: broader, longer-lived design vision and guardrails.
- Decision log or ADR: records accepted decisions after discussion.
- DACI decision document: clarifies decision roles and final approver.

## RFD Template

```markdown
# RFD-NNN: <discussion title>

Status: Draft | Scheduled | Discussed | Closed
Date: YYYY-MM-DD
Facilitator: <name>
Participants: <names or roles>
Audience: <teams/roles>
Related: <links>

## Summary

<One paragraph explaining the topic and why discussion is useful now.>

## Discussion goal

By the end of this discussion, we should <decision, alignment, questions answered, or next step>.

## Context

<Current state, trigger, constraints, prior decisions, and source links.>

## Questions for discussion

1. <question>
2. <question>
3. <question>

## Options or directions

| Option | When it makes sense | Concerns | Open questions |
| --- | --- | --- | --- |
| <option> | <fit> | <risks> | <questions> |

## Stakeholders and concerns

| Stakeholder | Concern | Needed input |
| --- | --- | --- |

## Risks and unknowns

- <risk or unknown>

## Expected follow-up

- <RFC, ADR, spec, spike, meeting, decision owner>

## Sources

- <source links>
```

## RFC Template

```markdown
# RFC-NNN: <proposal title>

Status: Draft | In review | Accepted | Rejected | Superseded
Date: YYYY-MM-DD
Author: <name>
Reviewers: <names or roles>
Decision owner: <name or role>
Related: <links>

## Executive summary

<Short stakeholder-readable summary of the proposal and impact.>

## Decision needed

<What approval, consensus, or directional decision is requested?>

## Problem statement

<What problem is being solved, for whom, and why now?>

## Goals and non-goals

Goals:

- <goal>

Non-goals:

- <non-goal>

## Proposal

<Recommended approach. Include diagrams when useful.>

## Alternatives considered

| Alternative | Why considered | Why not recommended |
| --- | --- | --- |

## Impact analysis

- Product/user impact:
- Engineering impact:
- Operational impact:
- Security/privacy/compliance impact:
- Cost impact:
- Migration/backward compatibility:

## Rollout and validation

- Rollout plan:
- Testing:
- Observability:
- Rollback:
- Success metrics:

## Risks and mitigations

| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |

## Open questions

- <question>

## Sources

- <source links>
```

## Writing Guidance

- RFDs may contain unresolved questions; RFCs should converge on a proposal.
- Put the decision requested near the top.
- Keep unresolved disagreements visible.
- Include discussion outcome or link to notes after review.
- After an RFC is accepted, create ADRs for architecturally significant decisions inside it.

## Sources

- Oxide RFD 1: https://rfd.shared.oxide.computer/rfd/0001
- LSST RFD guide: https://developer.lsst.io/communications/rfd.html
- RFC template guidance: https://www.cavaro.io/templates/request-for-comments-rfc
- GitLab architecture design workflow: https://handbook.gitlab.com/handbook/engineering/architecture/workflow/
- Atlassian DACI framework: https://www.atlassian.com/team-playbook/plays/daci
