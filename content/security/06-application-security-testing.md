# Application Security Testing

# Phase 6: Application Security Testing (QA / Staging)

**When to run this:** A dedicated security test pass in QA/staging before release — after features are functionally complete.

**Goal of this pass:** Run the deeper, often-automatable vulnerability classes end to end against a real running build, and confirm coverage against recognized baselines (OWASP Top 10 / API Top 10).

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
- Total items in this phase: 14

---

# What to Check — Phase 6: Application Security Testing (QA / Staging)

Reference checklist only — no result columns. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a test pass.

| # | Source file | Item | Severity | Example test |
|---|---|---|---|---|
| 1 | `02_Web_Vulnerabilities/01_sql_injection.md` | SQL Injection | Critical | Submit a single quote and boolean/time-based payloads (e.g. ' OR '1'='1, SLEEP(5)) in every input field and inspect responses/timing for injection signals. |
| 2 | `02_Web_Vulnerabilities/04_ssrf.md` | Server-Side Request Forgery (SSRF) | Critical | Submit a URL-fetching parameter pointing at http://169.254.169.254/latest/meta-data/ and confirm the server does not fetch it. |
| 3 | `02_Web_Vulnerabilities/05_idor.md` | Insecure Direct Object Reference (IDOR) | Critical | Log in as User A, capture an object ID from a request, then repeat the identical request as User B and confirm access is denied. |
| 4 | `02_Web_Vulnerabilities/08_path_traversal.md` | Path Traversal | Critical | Submit ../../../../etc/passwd and URL-encoded/unicode variants in any file-path parameter and confirm access stays within the intended directory. |
| 5 | `02_Web_Vulnerabilities/09_insecure_deserialization.md` | Insecure Deserialization | Critical | Tamper with a serialized object/cookie (flip a field, change a type) and submit it; confirm the server rejects it rather than deserializing blindly. |
| 6 | `02_Web_Vulnerabilities/10_broken_authentication.md` | Broken Authentication | Critical | Run a scripted credential-stuffing pass against the login endpoint using a small known-breached credential list and confirm lockout/rate-limit triggers. |
| 7 | `02_Web_Vulnerabilities/11_ssti.md` | Server-Side Template Injection (SSTI) (added) | Critical | Submit template syntax such as {{7*7}} or ${7*7} into user-controlled text fields and check whether the output evaluates to 49. |
| 8 | `02_Web_Vulnerabilities/12_xxe.md` | XML External Entity (XXE) Injection (added) | Critical | Submit an XML payload with a DOCTYPE defining an external entity pointing to a local file and confirm the parser refuses to resolve it. |
| 9 | `02_Web_Vulnerabilities/13_mass_assignment.md` | Mass Assignment (added) | High | Add an unexpected field such as "isAdmin": true to a normal profile-update request body and confirm it is ignored, not applied. |
| 10 | `02_Web_Vulnerabilities/14_race_conditions.md` | Race Conditions (added) | High | Fire 20 identical concurrent requests at a discount/redeem endpoint and confirm only one succeeds, not all twenty. |
| 11 | `02_Web_Vulnerabilities/15_request_smuggling.md` | HTTP Request Smuggling (added) | Critical | Send a request with conflicting Content-Length and Transfer-Encoding headers through the full proxy chain and observe whether front-end/back-end parsing disagrees. |
| 12 | `19_Security_Checklists/01_owasp_top10_checklist.md` | OWASP Top 10 Checklist | Reference | Use this as a coverage tracker after running folders 01-18 — check off each OWASP Top 10 category once its dedicated checklist items have been executed. |
| 13 | `19_Security_Checklists/02_api_security_checklist.md` | OWASP API Security Top 10 Checklist | Reference | Use this as a coverage tracker after running folder 01 (API_Security) and relevant items from 02/03 — confirm each OWASP API Top 10 category is addressed. |
| 14 | `19_Security_Checklists/03_pentest_checklist.md` | Penetration Test Checklist (added) | Reference | Use this as the top-level structure for any full engagement: confirm scope/RoE are signed before folder-by-folder testing begins. |
