# Message Queues

# Engineering Topic 9: Message Queue Concepts

**When to run this:** When designing or reviewing a system that uses a message queue/event stream (Kafka, RabbitMQ, SQS, etc.) for async communication between services.

**Goal of this pass:** Confirm the delivery, ordering, and failure-handling guarantees the system actually needs match what the queue setup actually provides.

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

# Concepts — Topic 9: Message Queue Concepts

Reference list only — no status column. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a pass.

| # | Concept | Why it matters | Self-check |
|---|---|---|---|
| 1 | Producer / consumer | The basic decoupling pattern — getting the boundary wrong (e.g. producer waiting on consumer) defeats the purpose of using a queue at all. | Are producers and consumers actually decoupled, with the producer not blocked waiting on consumer processing? |
| 2 | Topic + partition | Partitioning enables parallel consumption, but choosing the wrong partition key can cause hot partitions or lost ordering guarantees. | Is the partition key chosen deliberately (e.g. by entity ID) rather than defaulted, and does it avoid hot-partitioning? |
| 3 | Consumer group | Lets multiple consumer instances share the work of one topic without processing the same message redundantly (within the group). | If there are multiple consumer instances, are they correctly grouped so work is distributed, not duplicated? |
| 4 | At-least-once delivery | The common default guarantee — means consumers WILL sometimes see the same message twice and must handle that. | Does every consumer assume at-least-once delivery and handle duplicate messages correctly? |
| 5 | Dead letter queue | Without one, a message that repeatedly fails processing either blocks the queue or is silently dropped. | Do failed messages, after retry limits, go to a dead letter queue instead of blocking or vanishing? |
| 6 | Backpressure | If consumers can't keep up, the system needs a defined behavior (slow producers, buffer, drop) rather than unbounded queue growth. | Is there a defined response when consumer lag grows unbounded, rather than assuming it will always catch up? |
| 7 | Fan-out | Delivering one message to multiple independent consumers (e.g. via separate subscriptions) needs the right topology — a single queue with one consumer group won't do it. | If multiple independent services need the same message, is the topology (e.g. separate subscriptions/topics) actually set up for fan-out? |
| 8 | Message ordering | Most queues only guarantee order within a partition/shard, not globally — code that assumes global order will break. | Does any consumer logic assume strict global ordering, and if so, does the actual queue setup guarantee that? |
| 9 | Idempotent consumer | Given at-least-once delivery, consumers must be able to safely process the same message twice without double-effecting (e.g. double-charging). | Is consumer processing logic idempotent (e.g. keyed on a unique message/operation ID) so redelivery is safe? |
| 10 | Offset commit | Committing the offset too early risks losing a message if processing then fails; committing too late risks reprocessing more than necessary. | Is the offset committed only after successful processing (not before), matching the delivery guarantee the system actually needs? |
