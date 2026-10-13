# Data Modeling

# Engineering Topic 6: Data Modeling Concepts

**When to run this:** When designing a new schema, adding a table/relationship to an existing one, or reviewing a migration before it ships.

**Goal of this pass:** Confirm the schema decisions are deliberate — the right relationship type, the right key strategy, the right precision — rather than whatever the ORM defaulted to.

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

# Concepts — Topic 6: Data Modeling Concepts

Reference list only — no status column. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a pass.

| # | Concept | Why it matters | Self-check |
|---|---|---|---|
| 1 | Primary vs foreign keys | Gets the basic referential integrity of the schema right; missing FK constraints let orphaned/inconsistent data accumulate silently. | Does every relationship that should be enforced have an actual FK constraint, not just an implied convention? |
| 2 | One-to-many | The most common relationship shape; modeling it as many-to-many or vice versa causes either data duplication or missing constraints. | For each relationship, has one-to-many vs many-to-many actually been verified against real-world cardinality, not assumed? |
| 3 | Many-to-many | Requires a join table; skipping it (e.g. storing a comma-separated list) breaks referential integrity and queryability. | Are many-to-many relationships modeled with a proper join table rather than a denormalized list column? |
| 4 | Composite keys | Sometimes the natural key is a combination of columns, not a synthetic ID — forcing a synthetic key can hide a real uniqueness constraint. | Where a natural composite key exists (e.g. user_id + role_id), is it enforced as a unique constraint even if a synthetic PK is also used? |
| 5 | Soft deletes | A `deleted_at` column preserves history/auditability but means every query must remember to filter it, or leaked 'deleted' data appears. | If soft deletes are used, do all reads consistently filter them out (e.g. via a default scope), and is that not forgotten in raw queries? |
| 6 | Polymorphic associations | Lets one table reference multiple other table types, but sacrifices FK constraint enforcement at the DB level — a known tradeoff, not a free pattern. | Where a polymorphic association is used, was that tradeoff (no DB-level FK) made deliberately, with integrity checks handled elsewhere? |
| 7 | Enum vs lookup table | A hardcoded enum is faster to query but requires a migration/deploy to add a value; a lookup table is more flexible but adds a join. | Was the enum-vs-lookup-table choice made based on how often the value set changes, not just habit? |
| 8 | Audit columns | Without created_at/updated_at/created_by-style columns, debugging 'when did this change and who did it' becomes guesswork. | Do tables that matter for debugging/compliance have consistent audit columns? |
| 9 | Schema migrations | Migrations that aren't reversible or aren't tested against production-scale data can cause downtime or data loss when they run for real. | Are migrations reviewed for reversibility and tested against realistic data volume before running on production? |
| 10 | Precision & data types | Using float for money, or too-small an int type for a growing counter, causes rounding errors or overflow that surface much later. | Are numeric types chosen deliberately (e.g. decimal for currency, right-sized int for counters expected to grow)? |
