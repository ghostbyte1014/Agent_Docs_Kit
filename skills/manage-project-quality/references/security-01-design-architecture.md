# Design & Architecture

# Phase 1: Design & Architecture (Pre-Code)

**When to run this:** Before writing code — during system/feature design, RFCs, or architecture review.

**Goal of this pass:** Catch design-level flaws (missing trust boundaries, over-broad data collection, no threat model) that are cheap to fix now and expensive to fix after code exists.

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
- Total items in this phase: 5

---

# What to Check — Phase 1: Design & Architecture (Pre-Code)

Reference checklist only — no result columns. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a test pass.

| # | Source file | Item | Severity | Example test |
|---|---|---|---|---|
| 1 | `15_Architecture_Compliance/01_privacy_by_design.md` | Privacy by Design | Medium | Review the most recent feature's design doc and confirm data collection was scoped to only what the feature actually needs. |
| 2 | `15_Architecture_Compliance/02_threat_modeling.md` | Threat Modeling | High | Pull the data-flow diagram for the highest-risk service and confirm a STRIDE (or equivalent) pass was actually performed and mitigations tracked to closure. |
| 3 | `15_Architecture_Compliance/04_defense_in_depth.md` | Defense in Depth | Medium | Pick one critical asset and map every independent control protecting it; confirm there isn't a single point whose failure alone exposes it. |
| 4 | `15_Architecture_Compliance/06_zero_trust_network.md` | Zero Trust Network Architecture | High | From inside the internal network, attempt to reach a service without presenting valid per-request authentication and confirm it's still denied. |
| 5 | `15_Architecture_Compliance/08_secure_sdlc.md` | Secure SDLC (added) | Medium | Confirm the most recent feature had security requirements defined at design time, not bolted on after code review. |
