# Security and engineering review guide

This guide explains what each security phase and engineering topic is intended to check, how to choose a scope, and what a completed finding looks like. The examples are fictional and sanitized. They illustrate the record format; they are not audit results for this repository or any other system.

The CLI creates a worksheet with every control or practice preloaded as `Unverified` and includes the selected reference checklist. It does not inspect the project, run a scanner, authorize active testing, or assign a passing status. A reviewer must collect evidence and complete the record.

## Choose one focused review

List the available selectors before choosing a worksheet:

```bash
npx @ghostbyte/agent-docs-kit@latest list security
npx @ghostbyte/agent-docs-kit@latest list engineering
```

Create only the worksheet that matches the current risk or engineering question:

```bash
npx @ghostbyte/agent-docs-kit@latest security worksheet api-layer
npx @ghostbyte/agent-docs-kit@latest engineering worksheet testing-types
```

Security and engineering worksheets require an initialized documentation workspace. Every new finding begins `Unverified`; creating the file is not the review.

If the phase, topic, or scope is not known yet, use the guided prompt on the website without editing it. The agent should list the available phases or topics, ask for the exact scope and exclusions, repeat the selection, and wait for confirmation before creating a worksheet. The bracketed prompt templates are for developers who already know their selector and scope.

## How to activate a selector

Activating a selector means choosing its checklist and creating a dated worksheet. It does not start an agent, inspect the project, or complete the review.

| Step | Security selector | Engineering selector | Result |
|---|---|---|---|
| 1. Initialize once | `npx @ghostbyte/agent-docs-kit@latest setup --ai` | Same command | Creates the documentation workspace, agent instructions, and project skill. No review runs. |
| 2. Find a selector | `npx @ghostbyte/agent-docs-kit@latest list security` | `npx @ghostbyte/agent-docs-kit@latest list engineering` | Prints the accepted selector names. |
| 3. Preview the worksheet | `npx @ghostbyte/agent-docs-kit@latest security worksheet <selector> --dry-run` | `npx @ghostbyte/agent-docs-kit@latest engineering worksheet <selector> --dry-run` | Shows the planned dated path without writing it. |
| 4. Activate the selector | `npx @ghostbyte/agent-docs-kit@latest security worksheet <selector>` | `npx @ghostbyte/agent-docs-kit@latest engineering worksheet <selector>` | Creates the selected worksheet with every finding set to `Unverified`. |
| 5. Ask your agent | `Review security phase <selector> for <scope> using the generated worksheet.` | `Review engineering topic <selector> for <scope> using the generated worksheet.` | The agent inspects available evidence and completes only supported findings. Active security testing still requires explicit authorization. |
| 6. Validate the record | `npx @ghostbyte/agent-docs-kit@latest report validate <worksheet>` | Same command | Compares stored expected-ID metadata with both worksheet sections to detect accidental or partial removal, then checks evidence fields, statuses, and the overall result. It does not consult the canonical catalog, so a deliberate, consistent edit to the metadata and both sections is not detected. Legacy worksheets use their editable checklist and display a completeness warning. |
| 7. Continue | `npx @ghostbyte/agent-docs-kit@latest next` | Same command | Reports the next repository-backed action and any open worksheet. |

For example, replace `<selector>` with `api-layer` for security or `testing-types` for engineering. Replace `<scope>` with the exact system, feature, change, or release being reviewed.

### Run the command from a terminal

Open a terminal in the project root—the directory containing the project's source and usually `package.json` or `.git`. Use the command form for your terminal:

| Terminal | Go to the project root | Preview a security selector |
|---|---|---|
| Windows PowerShell | `Set-Location "C:\path\to\project"` | `npx.cmd @ghostbyte/agent-docs-kit@latest security worksheet api-layer --dry-run` |
| Windows Command Prompt | `cd /d "C:\path\to\project"` | `npx @ghostbyte/agent-docs-kit@latest security worksheet api-layer --dry-run` |
| macOS or Linux | `cd "/path/to/project"` | `npx @ghostbyte/agent-docs-kit@latest security worksheet api-layer --dry-run` |

Then execute the selector in this order:

1. Replace the example path with the real project path. Do not type `C:\path\to\project` literally.
2. Replace `api-layer` with the selected security phase. For engineering, replace `security worksheet api-layer` with, for example, `engineering worksheet testing-types`.
3. Paste the preview command into the terminal and press **Enter**. The response should say `planned` and `Preview only`; no worksheet is written.
4. Check the planned path and selector. If they are correct, remove `--dry-run`, run the command again, and press **Enter**.
5. The response should say `created` and print the dated worksheet path. Open that file, then give the matching prompt to your agent so it can collect evidence and complete the review.

If PowerShell blocks the `npx` script because of its execution policy, use `npx.cmd` as shown above. The `npx` form runs the published package without requiring a global installation.

## Security phases

A security phase asks whether defined controls are supported by evidence for a bounded target. Before any active test, record the exact authorized target, exclusions, safety limits, and stop conditions. Source and configuration review inside the provided repository is passive; crafted traffic, credentials, live services, cloud resources, and potentially disruptive tests require explicit authorization.

| Phase | Selector | What it checks | Typical evidence |
|---|---|---|---|
| 01 Design & Architecture | `design-architecture` | Data minimization, threat modeling, trust boundaries, defense in depth, zero-trust assumptions, and secure lifecycle planning. | Design records, data-flow diagrams, threat models, and tracked mitigations. |
| 02 Local Development | `local-development` | Secret handling, dependency controls, developer access, local configuration, and risky coding patterns before code reaches a shared branch. | Repository configuration, secret-scanning output, dependency policy, and reviewed source. |
| 03 Database & Backend | `database-backend` | Server-side authorization and business rules, safe data access, injection defenses, transactions, encryption, and least-privilege database use. | Data-access code, schemas, database roles, tests, and query or migration output. |
| 04 API Layer | `api-layer` | Authentication, authorization, input validation, rate limiting, session controls, CORS, token validation, and replay or abuse defenses. | Route and middleware code, API contracts, focused tests, and authorized request results. |
| 05 Frontend & UI | `frontend-ui` | XSS defenses, browser security controls, safe rendering, client storage, dependency exposure, and the rule that the UI is not the security boundary. | Component source, build configuration, response headers, dependency output, and browser tests. |
| 06 Application Security Testing | `application-security-testing` | Deeper vulnerability classes and coverage against current security baselines in an authorized, isolated test environment. | Approved test plan, scanner or manual-test output, synthetic test accounts, and retest results. |
| 07 CI/CD & Release Engineering | `cicd-release-engineering` | Pipeline permissions, protected changes, dependency and artifact integrity, secret use, provenance, and safe release automation. | Workflow files, branch controls, build logs, attestations, and release configuration. |
| 08 Cloud Infrastructure | `cloud-infrastructure` | IAM, network boundaries, storage exposure, encryption, container configuration, logging, and configuration drift. | Infrastructure-as-code, policy output, cloud configuration, diagrams, and authorized platform observations. |
| 09 Edge, CDN & DNS | `edge-cdn-dns` | Origin protection, TLS, CDN and WAF behavior, DNS integrity, domain ownership, and email authentication records. | DNS records, edge configuration, certificate details, and authorized header or routing checks. |
| 10 Release & Rollout | `release-rollout` | Staged exposure, approval criteria, rollback readiness, migration safety, and limits on release blast radius. | Rollout plan, feature-flag configuration, health thresholds, rollback rehearsal, and release logs. |
| 11 Post-release Monitoring & Incident Response | `post-release-monitoring-ir` | Security logging, alert coverage, ownership, escalation, evidence preservation, and incident readiness after release. | Alert rules, dashboards, on-call records, runbooks, exercises, and incident evidence. |
| 12 Ongoing Operations | `ongoing-operations` | Controls that decay over time, including access reviews, backups, vendor risk, client support, patching, and compliance obligations. | Dated access reviews, restore tests, inventories, vendor records, patch reports, and exception registers. |
| 13 Agentic AI & Tooling | `agentic-ai-tooling` | Prompt injection, excessive agency, sensitive context, tool and MCP supply chains, output validation, instruction ownership, isolation, and human control. | Agent instructions, permission settings, tool manifests, scenario tests, sanitized activity evidence, and provider policy records. |

Use `Pass`, `Fail`, `Unverified`, or `N/A` for each applicable control. `N/A` needs a specific rationale. A missing observable is `Unverified`, not `Pass` or `N/A`. The phase checklist defines its sign-off criteria; Critical and High items generally must pass or have an approved, time-bounded exception. Actual release blocking still depends on the project's explicit release policy and enforcement.

### Fictional security findings

Scope: the fictional Sample Shop order API in a test repository. No live target or active network testing is implied.

| Control ID | Priority | Evidence mode | Status | Evidence | Remediation | Owner | Verification |
|---|---|---|---|---|---|---|---|
| SEC-04-05 | High | Passive | Pass | `src/validation/order-schema.ts:42` rejects wrong-type, oversized, and negative values; `tests/api/orders.test.ts:88` covers each boundary. | None for this control. | API team | Re-run the focused order-validation test in CI and retain the passing job link. |
| SEC-04-01 | High | Authorized active | Fail | The test-environment login route accepted the fictional test plan's full request burst without returning a limiting response. | Add an account- and source-aware limiter, then document safe thresholds. | Identity team | Repeat the authorized test below the recorded safety ceiling and retain the response summary. |
| SEC-04-07 | Medium | Passive | N/A | Not applicable: the reviewed Sample Shop scope has no endpoint designed to use client-certificate authentication. | None while that boundary remains unchanged. | API team | Reassess if an mTLS endpoint is introduced. |
| SEC-04-10 | Medium | External | Unverified | Response-header evidence was unavailable in the retained test record. | Collect authorized header output before assigning a result. | Unassigned | Not verified. |

Why the rows are reviewable: each identifies the exact control and avoids turning missing evidence into a pass. `Fail` carries remediation, ownership, and a safe verification action; `N/A` records why the control does not apply; and `Unverified` remains open until evidence exists.

## Engineering topics

An engineering review asks how well a practice fits the system's actual constraints and evidence. It is normally advisory: a recommendation is not a security failure or release blocker unless separate evidence establishes a correctness defect or an explicit project policy makes it a gate.

| Topic | Selector | What it checks | Typical evidence |
|---|---|---|---|
| 01 Query Performance & Slow Query Diagnosis | `query-performance` | Slow-query diagnosis, execution plans, indexes, query shape, data volume, and when denormalization is justified. | Query plans, timings, schema and index definitions, representative datasets, and regression tests. |
| 02 Networking Fundamentals | `networking-fundamentals` | DNS, transport, TLS, proxies, load balancers, timeouts, retries, and where latency or connectivity failures occur. | Network diagrams, resolver or TLS output, proxy configuration, traces, and latency measurements. |
| 03 Rate Limiting Algorithm Choices | `rate-limiting-algorithms` | Whether the chosen limiter and storage model match burst, fairness, distribution, and failure requirements. | Traffic assumptions, algorithm configuration, load-test results, and distributed-state behavior. |
| 04 Production Debugging | `production-debugging` | Whether logs, metrics, traces, correlation, profiling, and operational habits support fast diagnosis. | Dashboards, structured events, traces, profiler output, runbooks, and incident records. |
| 05 Code Review Practices | `code-review-practices` | Review size, context, turnaround, automation, feedback clarity, self-review, and conversion of repeated feedback into shared rules. | Pull requests, review policy, CI checks, turnaround data, and documented conventions. |
| 06 Data Modeling | `data-modeling` | Relationships, keys, types, precision, normalization, constraints, indexing, and migration consequences. | Schemas, migrations, data-access code, integrity tests, and representative query behavior. |
| 07 Cloud Cost Saving | `cloud-cost-saving` | Usage visibility, rightsizing, idle resources, storage lifecycle, commitment choices, and cost-aware architecture tradeoffs. | Billing breakdowns, utilization metrics, resource inventory, forecasts, and change measurements. |
| 08 Testing Types | `testing-types` | Whether unit, integration, end-to-end, contract, load, smoke, regression, and other tests cover the risks that matter. | Test inventory, CI jobs, coverage by critical journey, defect history, and test results. |
| 09 Message Queues | `message-queues` | Delivery and ordering guarantees, idempotency, retries, dead letters, backpressure, observability, and recovery. | Queue configuration, producer and consumer code, failure tests, lag metrics, and replay procedures. |
| 10 API Design & Compatibility | `api-design-compatibility` | Contracts, backward compatibility, errors, idempotency, pagination, deprecation, safe defaults, and contract tests. | API specifications, compatibility policy, consumer telemetry, tests, and migration notices. |
| 11 Reliability, SLOs & Error Budgets | `reliability-slos` | User-centered indicators, achievable objectives, budget policy, alerting, dependency assumptions, degradation, and recovery targets. | SLI queries, SLO history, burn-rate alerts, RTO/RPO tests, and reliability decisions. |
| 12 Observability & Telemetry | `observability-telemetry` | Structured logs, useful metrics, traces, label cardinality, sensitive-data controls, actionable alerts, retention, and instrumentation tests. | Telemetry schemas, dashboards, alert rules, sampling and retention settings, and validation tests. |
| 13 Deployment & Change Safety | `deployment-change-safety` | Reversible changes, progressive delivery, automated verification, compatible migrations, rollback thresholds, artifact promotion, and post-deploy observation. | Pipeline configuration, rollout plan, artifact metadata, migration tests, health gates, and deployment records. |
| 14 Capacity, Concurrency & Resource Management | `capacity-concurrency` | Capacity assumptions, bounded concurrency, backpressure, timeouts, contention, autoscaling, cleanup, and graceful degradation. | Load and contention tests, limits, pool configuration, scaling metrics, resource profiles, and overload plans. |
| 15 Architecture & Maintainability | `architecture-maintainability` | Module responsibilities, dependency direction, intentional contracts, change coupling, complexity, failure boundaries, and architecture checks. | Representative source, dependency maps, change history, focused tests, and architecture records. |
| 16 Developer Experience & Reproducible Builds | `developer-experience-builds` | Prerequisites, clean setup, deterministic installs, local/CI parity, generated files, actionable failures, and supported environments. | Setup guidance, manifests, lockfiles, CI workflows, clean-build results, and support matrices. |
| 17 Frontend Quality & Accessibility | `frontend-accessibility` | Semantic structure, keyboard use, status announcements, contrast, responsive behavior, reduced motion, and browser testing. | Browser tests, accessibility scans, manual keyboard results, screenshots, and supported-browser evidence. |
| 18 Agent Workflow Quality | `agent-workflow-quality` | Instruction discovery, one authoritative policy, bounded prompts, evidence limits, approvals, cross-agent consistency, and evaluation records. | Agent scenarios, instruction files, tool configuration, observed results, and retained limitations. |

Use `Applied`, `Partial`, `Recommended`, `Unverified`, or `N/A`. `Applied` means evidence supports the practice in the reviewed scope. `Partial` records a material gap in something already present. `Recommended` proposes a contextual improvement that is not yet implemented. `N/A` requires a rationale, and unavailable evidence remains `Unverified`.

### Fictional engineering findings

Scope: the fictional Sample Shop checkout and account-recovery test strategy.

| Practice ID | Status | Evidence | Impact | Recommendation | Owner | Verification |
|---|---|---|---|---|---|---|
| ENG-08-01 | Applied | `tests/unit/pricing.test.ts` directly covers the fictional pricing rules without external services. | Fast feedback protects the central calculation path. | Keep these cases aligned with pricing-rule changes. | Checkout team | Re-run the focused unit suite in CI. |
| ENG-08-03 | Partial | `tests/e2e/checkout.spec.ts` covers checkout; the test inventory contains no password-reset journey. | A regression could block account recovery without being detected before release. | Add one high-value password-reset browser test using a synthetic account. | Quality team | Run the new test in CI and link its first passing job in this worksheet. |
| ENG-08-09 | Recommended | The fictional deployment checklist has manual health confirmation but no automated smoke-test job. | A basic post-deployment failure could depend on a person noticing it. | Add one fast automated smoke test for the critical health and sign-in path. | Release team | Link the first passing post-deployment job after implementation. |
| ENG-08-07 | N/A | Not applicable: this fictional local-only tool has no distributed service dependencies or supported fault-injection environment. | No current chaos-test benefit within the reviewed scope. | Reassess if the system gains remote dependencies. | Tooling team | Revisit at the next architecture change. |
| ENG-08-06 | Unverified | Representative load-test results were not available to the reviewer. | Capacity behavior cannot be concluded from the available record. | Define expected load before deciding whether this test type applies. | Unassigned | Not verified. |

Why the rows are reviewable: `Applied` is tied to existing evidence, `Partial` records a gap in an existing practice, and `Recommended` does not pretend the proposed work is implemented. `N/A` explains the scope decision, while `Unverified` preserves the evidence limitation.

## Reviewer handoff

Before another developer signs off, they should be able to answer:

- Is the target or system scope explicit, with exclusions and limitations?
- Does every non-`Unverified` status cite direct, rediscoverable evidence?
- Are observations separated from impact and inference?
- Does each gap have a concrete action, owner, and verification step?
- Are security authorization and safety boundaries recorded before active testing?
- Does the overall status agree with the individual findings and any documented exception?

Preserve dated worksheets as review history. Update a finding only when new evidence supports the change; do not rewrite an older worksheet to make current results appear historical.
