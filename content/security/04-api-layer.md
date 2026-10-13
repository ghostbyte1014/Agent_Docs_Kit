# API Layer

# Phase 4: API Layer

**When to run this:** While building/reviewing any endpoint that's called over the network — internal or external.

**Goal of this pass:** Confirm authentication, authorization, and abuse controls are enforced on every endpoint, not assumed from the caller.

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
- Total items in this phase: 17

---

# What to Check — Phase 4: API Layer

Reference checklist only — no result columns. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a test pass.

| # | Source file | Item | Severity | Example test |
|---|---|---|---|---|
| 1 | `01_API_Security/01_rate_limiting.md` | Rate Limiting | High | Fire 200 requests/sec at a login endpoint from one IP and confirm 429s with Retry-After start well before account lockout thresholds are reachable. |
| 2 | `01_API_Security/02_api_keys.md` | API Keys | High | Grep the built client bundle and mobile binary for hardcoded key patterns, then rotate one key and confirm the old value is rejected within minutes. |
| 3 | `01_API_Security/03_oauth2.md` | OAuth 2.0 | Critical | Attempt the authorization flow with a modified redirect_uri (e.g. attacker.com) and confirm the server rejects it rather than redirecting. |
| 4 | `01_API_Security/04_jwt_validation.md` | JWT Validation | Critical | Submit a token with 'alg' changed to 'none' and an empty signature; confirm the API rejects it instead of trusting the claims. |
| 5 | `01_API_Security/05_input_sanitation.md` | Input Sanitation | High | Submit oversized, wrong-type, and boundary values (e.g. negative quantity, 10k-char string) on every field and confirm consistent server-side rejection. |
| 6 | `01_API_Security/06_cors_policy.md` | CORS Policy | High | Send a fetch with Origin: https://evil.com and credentials:'include'; confirm the Access-Control-Allow-Origin response does not reflect evil.com. |
| 7 | `01_API_Security/07_mtls.md` | Mutual TLS (mTLS) | Medium | Present an expired or self-signed client certificate to the mTLS endpoint and confirm the connection is rejected, not silently accepted. |
| 8 | `01_API_Security/08_request_signing.md` | Request Signing | Medium | Replay a previously captured signed request unmodified after its timestamp window; confirm it is rejected as a replay. |
| 9 | `01_API_Security/09_ip_allowlisting.md` | IP Allowlisting | Medium | Send a request from a disallowed IP with a spoofed X-Forwarded-For header set to an allowlisted IP and confirm it is still blocked. |
| 10 | `01_API_Security/10_security_headers.md` | Security Headers (added) | Medium | Run curl -I against each public endpoint and confirm CSP, HSTS, X-Content-Type-Options, and frame-ancestors are all present. |
| 11 | `03_Access_Control_Session_Auth/07_session_management.md` | Session Management (added) | High | Capture the session cookie before and after login and confirm the session ID value actually changes (regenerates) rather than persisting. |
| 12 | `03_Access_Control_Session_Auth/08_mfa.md` | Multi-Factor Authentication (added) | Critical | Attempt the password-reset flow and confirm it cannot be used to fully log in while skipping the MFA step. |
| 13 | `03_Access_Control_Session_Auth/09_session_store_caching.md` | Session Store Security (Redis/Memcached) | High | Attempt to connect directly to the Redis/Memcached session store from outside the app network and confirm authentication is required and it isn't publicly reachable. |
| 14 | `03_Access_Control_Session_Auth/10_remember_me_persistent_login.md` | "Remember Me" & Persistent Login Tokens | High | Use a captured remember-me token once, then reuse the same (now-rotated-out) token value again and confirm it triggers revocation/alerting rather than silent success. |
| 15 | `03_Access_Control_Session_Auth/06_forced_reauth_sensitive_actions.md` | Forced Re-Authentication for Sensitive Actions | High | From an already-logged-in session, attempt to change the account email/password without re-entering credentials and confirm it's blocked. |
| 16 | `03_Access_Control_Session_Auth/03_cache_invalidation_on_auth_change.md` | Cache Invalidation on Auth/Privilege Change | High | Downgrade a test user's role, then immediately retry a privileged action with their still-active session and confirm it's now denied. |
| 17 | `03_Access_Control_Session_Auth/04_device_trust_fingerprinting.md` | Device Trust & Fingerprinting | Medium | Replay a captured device-trust identifier from a different browser/device and confirm it does not skip MFA. |
