# Database & Backend

# Phase 3: Database & Backend Layer

**When to run this:** While building/reviewing server-side business logic and the data access layer.

**Goal of this pass:** Confirm the backend enforces authorization and business rules itself, and that the data layer doesn't quietly reintroduce injection or over-fetching risk.

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
- Total items in this phase: 12

---

# What to Check — Phase 3: Database & Backend Layer

Reference checklist only — no result columns. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a test pass.

| # | Source file | Item | Severity | Example test |
|---|---|---|---|---|
| 1 | `05_Backend_Handling/01_business_logic_validation.md` | Business Logic Validation | High | Attempt to call the 'ship order' step of a checkout flow while skipping the 'payment' step and confirm the server rejects the out-of-order transition. |
| 2 | `05_Backend_Handling/02_file_upload_handling.md` | File Upload Handling | Critical | Upload a file with a .jpg extension but executable/script magic bytes inside, and confirm the server validates content type by inspecting bytes, not just the extension. |
| 3 | `05_Backend_Handling/03_orm_database_security.md` | ORM & Database Layer Security | High | Search the codebase for any raw-query escape hatches in the ORM and confirm every one uses parameter binding, not string concatenation. |
| 4 | `05_Backend_Handling/04_background_job_queue_security.md` | Background Job & Queue Security | Medium | Submit a queued job payload with malformed/malicious data directly (bypassing the API layer) and confirm the worker validates it the same way the API would. |
| 5 | `05_Backend_Handling/05_error_handling_stack_traces.md` | Error Handling & Stack Trace Exposure | Medium | Send a malformed request (bad JSON, wrong content-type) to a production endpoint and confirm the response is a generic error, not a stack trace or file path. |
| 6 | `03_Access_Control_Session_Auth/02_backend_access_control.md` | Backend Access Control | Critical | Using User A's valid session, request User B's resource ID directly and confirm a 403, not the data. |
| 7 | `03_Access_Control_Session_Auth/05_rbac_abac.md` | RBAC / ABAC Models (added) | Medium | Pick a long-lived test account and diff its current granted permissions against what its role should have today, looking for accumulated excess access. |
| 8 | `06_Data_Protection_Secrets/01_encryption_at_rest.md` | Encryption at Rest | High | Confirm via cloud console/CLI that the database volume, backups, and object storage all show encryption-at-rest enabled, not just the primary disk. |
| 9 | `06_Data_Protection_Secrets/02_encryption_in_transit.md` | Encryption in Transit | High | Attempt to connect to the database and any internal service-to-service endpoint over plaintext and confirm the connection is refused, TLS-only. |
| 10 | `06_Data_Protection_Secrets/03_pii_data_classification.md` | PII & Data Classification | Medium | Pull a sample data export/report and check whether it exposes any field classified as higher-sensitivity than the export's intended audience. |
| 11 | `06_Data_Protection_Secrets/04_key_management.md` | Key Management (KMS) | Critical | Confirm encryption keys live in a KMS/HSM (not a config file or env var) and walk through the documented key-revocation procedure end to end. |
| 12 | `06_Data_Protection_Secrets/05_tls_certificate_management.md` | TLS Certificate Management | High | Run an SSL/TLS scan (e.g. against the Mozilla Observatory or testssl.sh) on each public endpoint and confirm TLS 1.2+ only, no weak ciphers, valid expiry. |
