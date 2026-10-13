# Testing Types

# Engineering Topic 8: Types of Testing

**When to run this:** When designing a test strategy for a new project/feature, or auditing whether the current test suite has coverage gaps.

**Goal of this pass:** Confirm the right mix of test types is in place for what's actually being built — not every project needs every type, but the choice should be deliberate.

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

# Concepts — Topic 8: Types of Testing

Reference list only — no status column. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a pass.

| # | Concept | Why it matters | Self-check |
|---|---|---|---|
| 1 | Unit test | Tests one function/module in isolation — fast feedback, but doesn't catch integration problems. | Do core business-logic units have direct unit test coverage, isolated from external dependencies? |
| 2 | Integration test | Tests that multiple components work together correctly (e.g. app + real DB) — catches what unit tests can't. | Are integration tests run against real (or realistic) dependencies, not just mocks, for critical paths? |
| 3 | End-to-end test | Tests a full user flow through the real system — the closest simulation of actual usage, but slow and more brittle. | Do the most critical user journeys have E2E coverage, kept to a small, high-value set rather than everything? |
| 4 | Snapshot test | Catches unintended changes to output (UI render, API response shape) by diffing against a saved reference. | Where snapshot tests are used, are snapshots actually reviewed on change, not blindly re-approved? |
| 5 | Contract test | Verifies that a service's API still matches what its consumers expect, without needing a full integration environment. | For services with external consumers, are contract tests in place to catch breaking API changes before deploy? |
| 6 | Load test | Confirms the system holds up under expected (and above-expected) traffic before it meets that traffic in production. | Has the system been load-tested at a realistic multiple of expected peak traffic? |
| 7 | Chaos test | Confirms the system degrades gracefully under real failure conditions, not just happy-path load. | Has chaos testing been run against the critical paths (see also Debugging Production Issues)? |
| 8 | Mutation test | Checks whether the test suite would actually catch a real bug by deliberately introducing small code mutations and seeing if tests fail. | Has mutation testing been run at least once to sanity-check that the test suite isn't just achieving coverage without catching bugs? |
| 9 | Smoke test | A fast, shallow check that the basic system is up and functional — meant to catch catastrophic failures immediately after deploy. | Does every deploy run a fast smoke test before being considered successful? |
| 10 | Regression test | Confirms a previously fixed bug doesn't come back — without it, the same bug can resurface silently. | Does every fixed bug get a corresponding regression test added to the suite? |
