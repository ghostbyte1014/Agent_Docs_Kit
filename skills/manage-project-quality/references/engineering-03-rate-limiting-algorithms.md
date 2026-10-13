# Rate Limiting Algorithm Choices

# Engineering Topic 3: Rate Limiting Algorithm Choices

**When to run this:** When designing or reviewing a rate limiter — this is a companion to the security check in security-gate/SECURITY_CHECKLIST.md → 01_API_Security/01_rate_limiting.md, focused on picking the right algorithm rather than confirming a limiter exists.

**Goal of this pass:** Make sure the chosen algorithm actually matches the traffic pattern being protected against, instead of defaulting to whatever's easiest to implement.

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

# Concepts — Topic 3: Rate Limiting Algorithm Choices

Reference list only — no status column. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a pass.

| # | Concept | Why it matters | Self-check |
|---|---|---|---|
| 1 | Fixed window | Simple to implement but allows a burst of 2x the limit right at the window boundary. | If fixed window is used, is the boundary-burst behavior acceptable for this endpoint? |
| 2 | Sliding window log | Precise (tracks every request timestamp) but memory-heavy at scale. | If precision matters and volume is low/medium, is sliding window log a better fit than fixed window? |
| 3 | Sliding window counter | Approximates the sliding log with much less memory by weighting two adjacent fixed windows. | For high-volume endpoints needing better accuracy than fixed window, is sliding window counter being used instead of the log variant? |
| 4 | Token bucket | Allows controlled bursts up to the bucket size while enforcing a steady refill rate — good for bursty-but-bounded traffic. | Does the traffic pattern need to allow short bursts, and if so, is token bucket the chosen algorithm? |
| 5 | Leaky bucket | Smooths bursty input into a constant output rate — good for protecting a downstream system that can't handle spikes at all. | Is there a downstream system that needs a strictly constant request rate, and if so, is leaky bucket used to enforce it? |
| 6 | Distributed rate limiting | A per-instance limiter is meaningless behind a load balancer with multiple app servers — limits get multiplied by instance count. | If the app runs on more than one instance, is the rate limit state shared (e.g. via Redis) rather than per-instance? |
| 7 | Client-side throttling | Reduces wasted requests and improves UX, but is never sufficient alone since a client can be bypassed or malicious. | Does the client throttle its own request rate, and is server-side enforcement still present as the actual control? |
| 8 | Adaptive rate limiting | Static limits can be too strict in quiet periods or too loose under load; adaptive limits adjust to current system health. | Does the limiter adjust based on current load/error rate, or is it a single static number regardless of system state? |
| 9 | Concurrency limiting | Limits in-flight requests, not just requests-per-second — protects against slow requests piling up and exhausting resources. | Is there a cap on concurrent in-flight requests per client, separate from the requests-per-second limit? |
| 10 | Back pressure | Signals upstream to slow down instead of silently dropping or queuing indefinitely when a system is overloaded. | When downstream capacity is exceeded, does the system push back (429/503, queue limits) rather than accepting unbounded work? |
