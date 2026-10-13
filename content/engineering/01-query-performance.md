# Query Performance & Slow Query Diagnosis

# Engineering Topic 1: Query Performance & Slow Query Diagnosis

**When to run this:** When a query, endpoint, or report is running slower than expected, or before shipping a new query against a table that will grow.

**Goal of this pass:** Work through the standard diagnostic order for a slow query instead of guessing at fixes — read the plan first, fix the cheapest thing, and don't reach for denormalization until indexing is exhausted.

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

# Concepts — Topic 1: Query Performance & Slow Query Diagnosis

Reference list only — no status column. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a pass.

| # | Concept | Why it matters | Self-check |
|---|---|---|---|
| 1 | Start with the explain plan | Reveals whether the DB is scanning, sorting, or joining in a way that doesn't match intent — guessing at fixes without this wastes time. | Have you run EXPLAIN (or EXPLAIN ANALYZE) on the slow query and read where the time actually goes? |
| 2 | Add the missing index | Full table scans get linearly worse as data grows; the right index turns O(n) into O(log n). | Does the WHERE/JOIN/ORDER BY column set have a supporting index? |
| 3 | Stop selecting * | Pulling unused columns wastes I/O and network, and can defeat a covering index. | Does the query request only the columns actually used downstream? |
| 4 | Fix N+1 queries | One query per row in a loop turns a single request into hundreds; batching/joining collapses it back to one or few. | Does any code path issue a query inside a loop over another query's results? |
| 5 | Use a covering index | An index that includes all selected columns lets the DB answer from the index alone, skipping the table lookup. | For hot read queries, does the index include every column the query selects? |
| 6 | Cache repeated queries | Identical, expensive, low-volatility queries don't need to hit the DB every time. | Are the same expensive read queries re-run frequently with unchanged results, and if so, are they cached? |
| 7 | Prune partitions | Partition pruning lets the DB skip irrelevant partitions entirely instead of scanning the whole table. | For large time-series/partitioned tables, does the query filter on the partition key so pruning can kick in? |
| 8 | Denormalize for reads | Trading write complexity/redundancy for fewer joins can be the right call once indexing alone isn't enough. | Has indexing been exhausted before reaching for denormalization, and is the redundancy kept in sync deliberately? |
| 9 | Batch your writes | Many small write round-trips cost more in overhead than one larger batched write. | Are writes that happen together (e.g. in a loop or transaction) batched instead of issued one at a time? |
| 10 | Update table statistics | A stale planner (out-of-date row-count/distribution stats) can pick a bad plan even with the right indexes present. | Are table statistics refreshed on a schedule (ANALYZE / equivalent), especially after large data changes? |
