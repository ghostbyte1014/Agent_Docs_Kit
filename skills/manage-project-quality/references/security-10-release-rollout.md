# Release & Rollout

# Phase 10: Release Rollout (Beta ? Canary ? GA)

**When to run this:** During the actual release process, from closed beta through general availability.

**Goal of this pass:** Confirm blast radius stays small at each stage and there's always a fast way back out.

## Files in this folder

| File | Purpose |
|---|---|
| `CHECKLIST.md` | What to check — the reference list of items, severity, and example test steps for this phase. Doesn't get filled in; copy it or use `RESULTS_TEMPLATE.md` to record a real pass. |
| `RESULTS_TEMPLATE.md` | Fillable version of the same checklist, with Result/Notes columns and a sign-off block. Copy this file per test pass (e.g. `RESULTS_2026-08-29.md`) so history isn't overwritten. |

Full background, "why it matters," and references for every item live in
`../../SECURITY_CHECKLIST.md` (search for the source file path shown in the
checklist below).

## Sign-off criteria

- All Critical/High severity items must Pass or have an approved exception
  before this phase is considered complete.
- Total items in this phase: 7

---

# What to Check — Phase 10: Release Rollout (Beta ? Canary ? GA)

Reference checklist only — no result columns. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a test pass.

| # | Source file | Item | Severity | Example test |
|---|---|---|---|---|
| 1 | `09_Release_Pipeline_Stages/02_internal_qa_testing.md` | Stage 2: Internal QA Testing | Medium | Confirm the QA environment's test data is synthetic/anonymized, not a raw copy of production customer PII. |
| 2 | `09_Release_Pipeline_Stages/03_closed_beta_group_testing.md` | Stage 3: Closed Beta / Group Testing | Medium | Confirm the beta feature flag can be disabled instantly and test that toggling it off removes it from a live beta user's session. |
| 3 | `09_Release_Pipeline_Stages/04_staged_canary_rollout.md` | Stage 4: Staged / Canary Rollout | High | Confirm the automated rollback trigger (e.g. error-rate threshold) actually fires a rollback during the canary phase, not just logs a warning. |
| 4 | `09_Release_Pipeline_Stages/05_general_availability_release.md` | Stage 5: General Availability (GA) Release | Medium | Confirm a rollback plan and on-call briefing exist and are actionable even after reaching 100% rollout. |
| 5 | `09_Release_Pipeline_Stages/06_post_release_monitoring_support.md` | Stage 6: Post-Release Monitoring & Support | Medium | Confirm there is a defined SLA for triaging user-reported issues after a release and that it's actually being met on recent releases. |
| 6 | `09_Release_Pipeline_Stages/07_maintenance_patch_management.md` | Stage 7: Maintenance & Patch Management | High | Pick a recent critical CVE affecting a used dependency and confirm it was patched within the defined SLA window. |
| 7 | `09_Release_Pipeline_Stages/08_deprecation_end_of_life.md` | Stage 8: Deprecation & End-of-Life | Medium | Confirm a recently EOL'd endpoint/feature is fully decommissioned (404/410), not left dormant and reachable. |
