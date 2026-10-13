# Engineering Reference

A companion to `../security-gate/SECURITY_CHECKLIST.md`. That file is pass/fail **security
tests**; this file is **"what should I know"** — quick-recall concept lists
for performance, infra, and engineering practice. Nothing here has a
severity rating or a test step; use it for onboarding, self-study, or as
context for an agent before it reviews related code.

## Table of contents

- [A. Speeding Up a Slow Query](#a-speeding-up-a-slow-query)
- [B. Networking Concepts Every Dev Should Know](#b-networking-concepts-every-dev-should-know)
- [C. Rate Limiting Algorithms](#c-rate-limiting-algorithms)
- [D. Debugging Production Issues](#d-debugging-production-issues)
- [E. Code Review Practices](#e-code-review-practices)
- [F. Data Modeling Concepts](#f-data-modeling-concepts)
- [G. Cloud Cost-Saving Techniques](#g-cloud-cost-saving-techniques)
- [H. Types of Testing](#h-types-of-testing)
- [I. Message Queue Concepts](#i-message-queue-concepts)

> **Note:** the original "Web security vulnerabilities" list is not
> duplicated here — it's already covered item-for-item in
> `../security-gate/SECURITY_CHECKLIST.md` → `02_Web_Vulnerabilities`. Rate limiting
> algorithms (below) are a companion to, not a replacement for,
> `01_API_Security/01_rate_limiting.md`.

---

## A. Speeding Up a Slow Query

1. Start with the explain plan
2. Add the missing index
3. Stop selecting *
4. Fix N+1 queries
5. Use a covering index
6. Cache repeated queries
7. Prune partitions
8. Denormalize for reads
9. Batch your writes
10. Update table statistics

## B. Networking Concepts Every Dev Should Know

1. DNS resolution
2. TCP handshake
3. TLS handshake
4. NAT
5. Load balancer types
6. CDN edge caching
7. Packet loss & retransmit
8. MTU / fragmentation
9. Keep-alive
10. BGP routing

## C. Rate Limiting Algorithms

1. Fixed window
2. Sliding window log
3. Sliding window counter
4. Token bucket
5. Leaky bucket
6. Distributed rate limiting
7. Client-side throttling
8. Adaptive rate limiting
9. Concurrency limiting
10. Back pressure

## D. Debugging Production Issues

1. Correlation IDs
2. Distributed tracing
3. Feature flag rollback
4. Canary analysis
5. Replay traffic
6. Heap dumps
7. Chaos testing
8. Synthetic monitoring
9. Error budgets
10. Postmortems

## E. Code Review Practices

1. Small PRs
2. Clear description
3. Constructive feedback
4. Nitpick vs. blocker
5. Fast turnaround
6. Automated checks first
7. Context before code
8. Approve vs. request changes
9. Self-review first
10. Learning from reviews

## F. Data Modeling Concepts

1. Primary vs. foreign keys
2. One-to-many
3. Many-to-many
4. Composite keys
5. Soft deletes
6. Polymorphic associations
7. Enum vs. lookup table
8. Audit columns
9. Schema migrations
10. Precision & data types

## G. Cloud Cost-Saving Techniques

1. Spot instances
2. Autoscaling
3. Reserved capacity
4. Right-sizing
5. Storage tiering
6. CDN offloading
7. Serverless for spiky loads
8. Idle resource cleanup
9. Compression
10. Multi-region arbitrage

## H. Types of Testing

1. Unit test
2. Integration test
3. End-to-end test
4. Snapshot test
5. Contract test
6. Load test
7. Chaos test
8. Mutation test
9. Smoke test
10. Regression test

## I. Message Queue Concepts

1. Producer / consumer
2. Topic + partition
3. Consumer group
4. At-least-once delivery
5. Dead letter queue
6. Backpressure
7. Fan-out
8. Message ordering
9. Idempotent consumer
10. Offset commit
