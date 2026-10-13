# Production Debugging

# Engineering Topic 4: Debugging Production Issues

**When to run this:** Before an incident happens — this is about having the right tooling and habits in place, not what to do during a live fire.

**Goal of this pass:** Confirm the team has the observability primitives needed to actually diagnose a production issue quickly, not just react to alerts.

## Files in this folder

| File | Purpose |
|---|---|
| `CHECKLIST.md` | The reference list of concepts for this topic — what each one is, why it matters, and the self-check question to ask. Doesn't get filled in; copy `RESULTS_TEMPLATE.md` to record a real pass. |
| `RESULTS_TEMPLATE.md` | Fillable version of the same list, with a Status column and notes. Copy this file per pass (e.g. `RESULTS_2026-08-29.md`) so history isn't overwritten. |

Full source list lives in `../ENGINEERING_REFERENCE.md`. Unlike
`../../security-gate/phases/`, this is knowledge/practice review, not pass/fail security
testing — there's no severity rating, and "Fail" isn't the right framing.
Use the Status options in `RESULTS_TEMPLATE.md` instead: Applied, Partial,
Should adopt, or Not applicable.

## Wrap-up

- This isn't a gate — nothing here blocks a release the way
  Critical/High security items in `../../security-gate/phases/` do.
- Total concepts in this topic: 10
- Useful as an onboarding read-through, a periodic self-audit, or context
  to hand an agent before it reviews related code.

---

# Concepts — Topic 4: Debugging Production Issues

Reference list only — no status column. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a pass.

| # | Concept | Why it matters | Self-check |
|---|---|---|---|
| 1 | Correlation IDs | Without a shared ID, tracing one user's request across multiple services means grepping logs by timestamp and guessing. | Does every request get a correlation/request ID that's propagated across all services it touches and included in every log line? |
| 2 | Distributed tracing | Shows exactly where time is spent across a multi-service call chain — impossible to reconstruct from logs alone at scale. | Is distributed tracing (e.g. OpenTelemetry) instrumented across service boundaries? |
| 3 | Feature flag rollback | Turning off a bad feature via flag is faster and safer than a code rollback/redeploy under incident pressure. | Can the riskiest recent features be disabled via flag without a deploy? |
| 4 | Canary analysis | Rolling out to a small subset first catches regressions before they hit 100% of traffic. | Are risky changes rolled out to a canary/subset with automated comparison against the baseline before full rollout? |
| 5 | Replay traffic | Re-running real production requests against a fix confirms it actually resolves the issue, not just a synthetic test case. | Is there a way to replay real production traffic (or a sample) against a candidate fix before it ships? |
| 6 | Heap dumps | A heap dump is often the only way to root-cause a memory leak instead of guessing from symptoms. | Is heap-dump capture available (manually or via crash trigger) for services with memory-related symptoms? |
| 7 | Chaos testing | Deliberately injecting failure in a controlled way surfaces weaknesses before real, uncontrolled failure does. | Has chaos testing (killing instances, injecting latency/errors) been run against critical paths? |
| 8 | Synthetic monitoring | Catches outages and regressions from the outside, the way a real user would experience them, independent of internal metrics. | Are synthetic checks running against critical user journeys from outside the infrastructure? |
| 9 | Error budgets | Gives a quantified, agreed-upon threshold for how much unreliability is acceptable, so incident response isn't a judgment call every time. | Is there an agreed error budget per service, and does exceeding it trigger a defined response (e.g. freeze on new features)? |
| 10 | Postmortems | Without a blameless, written record, the same class of incident tends to recur because the lesson isn't institutionalized. | Does every significant incident get a blameless postmortem with concrete follow-up actions that are actually tracked to completion? |
