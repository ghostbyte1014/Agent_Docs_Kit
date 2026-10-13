# Cloud Cost Saving

# Engineering Topic 7: Cloud Cost-Saving Techniques

**When to run this:** During a cost review, before scaling up infrastructure, or when a cloud bill increase needs investigating.

**Goal of this pass:** Work through the standard cost levers systematically instead of just cutting the first expensive-looking line item.

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

# Concepts — Topic 7: Cloud Cost-Saving Techniques

Reference list only — no status column. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a pass.

| # | Concept | Why it matters | Self-check |
|---|---|---|---|
| 1 | Spot instances | Substantially cheaper than on-demand, but can be reclaimed with short notice — only right for interruption-tolerant workloads. | Are interruption-tolerant workloads (batch jobs, stateless workers) running on spot instead of on-demand? |
| 2 | Autoscaling | Paying for peak capacity 24/7 wastes money during predictable low-traffic periods. | Does capacity actually scale down during known low-traffic periods, not just scale up under load? |
| 3 | Reserved capacity | Committing to steady-state baseline load ahead of time is cheaper than paying on-demand rates for it continuously. | Has the stable, predictable-load portion of infrastructure been covered by reserved/committed-use pricing? |
| 4 | Right-sizing | Over-provisioned instances (low CPU/memory utilization) are a direct, ongoing waste that compounds over time. | Have instance sizes been checked against actual utilization recently, not just set once at launch and left alone? |
| 5 | Storage tiering | Infrequently accessed data doesn't need to sit on the most expensive, fastest storage tier. | Is cold/infrequently-accessed data moved to a cheaper storage tier rather than left on the default hot tier? |
| 6 | CDN offloading | Serving static/cacheable content from origin instead of a CDN costs more in bandwidth and origin load. | Is static and cacheable content served from a CDN rather than hitting origin servers for every request? |
| 7 | Serverless for spiky loads | Paying for always-on servers to handle infrequent, spiky workloads is wasteful compared to pay-per-invocation. | Are low-frequency, spiky workloads running serverless rather than on dedicated always-on infrastructure? |
| 8 | Idle resource cleanup | Unattached volumes, unused load balancers, and orphaned snapshots accumulate cost silently over time. | Is there a recurring process to find and remove idle/orphaned cloud resources? |
| 9 | Compression | Uncompressed data transfer and storage costs more in both bandwidth and storage fees than it needs to. | Is compression enabled where it's cheap to apply (asset delivery, log storage, backups)? |
| 10 | Multi-region arbitrage | Compute/storage/egress pricing varies meaningfully by region — running in the highest-cost region without a reason is avoidable spend. | Has region choice been checked against pricing, not just picked for proximity or default? |
