---
name: manage-project-quality
description: Set up and audit project documentation, perform evidence-based security reviews, or assess engineering practices. Use when asked to create or repair a docs structure, check documentation drift, conduct a security gate or phase audit, review engineering quality, generate audit evidence, or explain Agent Docs & Quality Kit results in standard or learning mode.
---

# Manage Project Quality

Choose exactly one primary workflow for the request: documentation governance, security assurance, or engineering review. Combine workflows only when the user explicitly requests a broader quality pass.

## Establish the operating context

1. Inspect the repository, its local instructions, and the files relevant to the request.
2. State the target, scope, exclusions, and interaction style before changing files.
3. Use `standard` style by default. Use `learning` style when the user asks to learn; explain why each important control matters without inflating routine output.
4. Preview file creation or replacement. Preserve unrelated user changes and do not overwrite an existing report unless explicitly authorized.
5. Cite repository evidence with paths and line numbers. Use command output or external-system evidence when a file cannot establish the result.

## Route the request

### Documentation governance

Read [references/documentation-governance.md](references/documentation-governance.md) and only the selected documentation area below. Use them to establish a navigable structure, identify stale or missing material, separate current scope from future ideas, and preserve decision/change history.

Documentation controls are governance aids, not an infallible technical lock. Report whether evidence supports the stated process; never claim that Markdown alone enforces agent behavior.

## Documentation area references

- [01 System Documentation](references/documentation-01-system-documentation.md)
- [02 Project Governance](references/documentation-02-project-governance.md)
- [03 Development Records](references/documentation-03-development-records.md)
- [04 Testing & Evidence](references/documentation-04-testing-evidence.md)
- [05 Operations & Runbooks](references/documentation-05-operations-runbooks.md)
- [06 Future Proposals](references/documentation-06-future-proposals.md)
- [07 Archive Governance](references/documentation-07-archive-governance.md)
- [Full documentation reference](references/documentation-full-reference.md): use only for cross-area governance work.

### Security assurance

Read [references/security-protocol.md](references/security-protocol.md), [references/evidence-and-reporting.md](references/evidence-and-reporting.md), and only the selected phase references below.

Passive source and configuration review may proceed within the user-provided repository. Before scanning a live target, sending crafted traffic, exercising credentials, changing cloud resources, or running any potentially disruptive test, obtain explicit authorization for the exact target and prefer a non-production environment.

Use only `Pass`, `Fail`, `Unverified`, or `N/A`. A missing observable is `Unverified`, not `Pass` or `N/A`. Treat unresolved Critical or High failures as release blockers unless an accountable owner records a time-bounded exception.

### Engineering review

Read [references/engineering-protocol.md](references/engineering-protocol.md), [references/evidence-and-reporting.md](references/evidence-and-reporting.md), and only the selected topic references below.

Use `Applied`, `Partial`, `Recommended`, `Unverified`, or `N/A`. Engineering recommendations are normally advisory. Clearly separate them from security gates, correctness defects, and release blockers.

## Security phase references

- [01 Design & Architecture](references/security-01-design-architecture.md)
- [02 Local Development](references/security-02-local-development.md)
- [03 Database & Backend](references/security-03-database-backend.md)
- [04 API Layer](references/security-04-api-layer.md)
- [05 Frontend & UI](references/security-05-frontend-ui.md)
- [06 Application Security Testing](references/security-06-application-security-testing.md)
- [07 CI/CD & Release Engineering](references/security-07-cicd-release-engineering.md)
- [08 Cloud Infrastructure](references/security-08-cloud-infrastructure.md)
- [09 Edge, CDN & DNS](references/security-09-edge-cdn-dns.md)
- [10 Release & Rollout](references/security-10-release-rollout.md)
- [11 Post-release Monitoring & Incident Response](references/security-11-post-release-monitoring-ir.md)
- [12 Ongoing Operations](references/security-12-ongoing-operations.md)
- [Full security reference](references/security-full-reference.md): search by heading or control name; do not load the entire file unless the user requests a full audit.

## Engineering topic references

- [01 Query Performance](references/engineering-01-query-performance.md)
- [02 Networking Fundamentals](references/engineering-02-networking-fundamentals.md)
- [03 Rate Limiting Algorithms](references/engineering-03-rate-limiting-algorithms.md)
- [04 Production Debugging](references/engineering-04-production-debugging.md)
- [05 Code Review Practices](references/engineering-05-code-review-practices.md)
- [06 Data Modeling](references/engineering-06-data-modeling.md)
- [07 Cloud Cost Saving](references/engineering-07-cloud-cost-saving.md)
- [08 Testing Types](references/engineering-08-testing-types.md)
- [09 Message Queues](references/engineering-09-message-queues.md)
- [10 API Design & Compatibility](references/engineering-10-api-design-compatibility.md)
- [11 Reliability, SLOs & Error Budgets](references/engineering-11-reliability-slos.md)
- [12 Observability & Telemetry](references/engineering-12-observability-telemetry.md)
- [13 Deployment & Change Safety](references/engineering-13-deployment-change-safety.md)
- [14 Capacity, Concurrency & Resource Management](references/engineering-14-capacity-concurrency.md)
- [Full engineering reference](references/engineering-full-reference.md): use only for cross-topic review.

## Produce the result

1. Record scope, date, reviewer, interaction style, and evidence limitations.
2. Assign a status only after collecting evidence.
3. Rank findings by impact and confidence. Separate observed facts from inference.
4. Give a concrete remediation, owner, and verification step for each actionable finding.
5. Summarize blockers first, then non-blocking improvements, then unverified items.
6. Never expose secrets in output. Redact tokens, credentials, personal data, and sensitive endpoints.

Use [assets/security-report.md](assets/security-report.md), [assets/engineering-report.md](assets/engineering-report.md), or [assets/documentation-report.md](assets/documentation-report.md) when writing a report. Resolve this skill's installation directory, then run its `scripts/check-report.mjs <report>` script to catch invalid statuses and findings without evidence; do not assume the caller's project root contains that script.
