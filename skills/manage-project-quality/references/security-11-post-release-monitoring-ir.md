# Post-release Monitoring & Incident Response

# Phase 11: Post-Release: Monitoring, Logging & Incident Response

**When to run this:** Immediately after release, and as ongoing production operations.

**Goal of this pass:** Confirm you'd actually notice if something went wrong, and that the team knows what to do when it does.

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
- Total items in this phase: 9

---

# What to Check — Phase 11: Post-Release: Monitoring, Logging & Incident Response

Reference checklist only — no result columns. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a test pass.

| # | Source file | Item | Severity | Example test |
|---|---|---|---|---|
| 1 | `11_Logging_Monitoring/01_audit_logging.md` | Audit Logging | High | Perform a sensitive action (e.g. role change) and confirm the audit log captures actor, action, timestamp, source IP, and result — then try to alter that entry. |
| 2 | `11_Logging_Monitoring/02_log_injection.md` | Log Injection (added) | Medium | Submit a username or field containing newline characters and fake log-line content, then confirm it doesn't forge a fake log entry when written. |
| 3 | `11_Logging_Monitoring/03_siem_alerting.md` | SIEM & Alerting (added) | Medium | Trigger 10 failed logins for one account in a short window and confirm a SIEM alert fires with a linked response runbook. |
| 4 | `14_Incident_Response_Security_Ops/01_bug_bounty_responsible_disclosure.md` | Bug Bounty & Responsible Disclosure | Medium | Fetch https://yourdomain.com/.well-known/security.txt and confirm it publishes a working contact and safe-harbor statement. |
| 5 | `14_Incident_Response_Security_Ops/02_manmade_adversarial_scenarios.md` | Man-Made / Adversarial Scenarios | Medium | Run a phishing simulation against staff and measure the click-through and report rate against your baseline target. |
| 6 | `14_Incident_Response_Security_Ops/03_red_team_purple_team_exercises.md` | Red Team / Purple Team Exercises | High | Run a scoped red-team exercise with written rules of engagement and measure how quickly the detection/response team noticed and reacted. |
| 7 | `14_Incident_Response_Security_Ops/04_incident_response.md` | Incident Response Drill (added) | High | Run a tabletop IR drill for a plausible scenario (e.g. leaked API key) and confirm every role knows their escalation step without looking it up. |
| 8 | `14_Incident_Response_Security_Ops/06_security_awareness_training.md` | Security Awareness Training | Low | Confirm every engineer completed secure-coding training within the last 12 months and that a recent incident's lessons were folded into the material. |
| 9 | `14_Incident_Response_Security_Ops/07_vulnerability_management_sla.md` | Vulnerability Management SLA | High | Pull open vulnerabilities from the tracker and confirm none of Critical/High severity are past their defined remediation SLA. |
