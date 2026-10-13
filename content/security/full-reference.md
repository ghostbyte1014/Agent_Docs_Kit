# Dev Quality Agent — Security Checklist

A single consolidated reference covering all 19 security domains: code, API,
deployment, and the surrounding program (compliance, vendors, incident response).
Originally organized as 151 separate files; merged here into one document so an
agent or reviewer can work through it end to end without switching files.

Each item includes: what it is, why it matters, the original test checklist,
a **severity** rating, one **concrete example test step**, a **last reviewed**
date, and (where relevant) **see also** cross-links to related items.

See `../UPDATE_CADENCE.md` for the review schedule and version log, and
`SECURITY_RESULTS_TEMPLATE.md` for how to record findings from a pass through this
document.

## Before you start

- Only point testing (yours or an agent's) at systems you own or have explicit
  written permission to test.
- Prefer staging/QA environments over production for anything in
  **Web Vulnerabilities**, **Cloud Infra & Deployment**, and
  **DNS, Email & Domain Security** — some checks there can have live side effects.
- Decide who signs off that a section is done, even if it's just you.

## Table of contents


- [01_API_Security — API Security](#01_api_security)
- [02_Web_Vulnerabilities — Web Vulnerabilities](#02_web_vulnerabilities)
- [03_Access_Control_Session_Auth — Access Control, Session & Auth](#03_access_control_session_auth)
- [04_UI_Framework_Security — UI / Framework Security](#04_ui_framework_security)
- [05_Backend_Handling — Backend Handling](#05_backend_handling)
- [06_Data_Protection_Secrets — Data Protection & Secrets](#06_data_protection_secrets)
- [07_Cloud_Infra_Deployment — Cloud Infra & Deployment](#07_cloud_infra_deployment)
- [08_Release_Engineering_Version_Control — Release Engineering & Version Control](#08_release_engineering_version_control)
- [09_Release_Pipeline_Stages — Release Pipeline Stages](#09_release_pipeline_stages)
- [10_Dependency_Supply_Chain — Dependency & Supply Chain](#10_dependency_supply_chain)
- [11_Logging_Monitoring — Logging & Monitoring](#11_logging_monitoring)
- [12_Third_Party_Integration_Vendor_Risk — Third-Party Integration & Vendor Risk](#12_third_party_integration_vendor_risk)
- [13_Backup_DR_Resilience — Backup, DR & Resilience](#13_backup_dr_resilience)
- [14_Incident_Response_Security_Ops — Incident Response & Security Ops](#14_incident_response_security_ops)
- [15_Architecture_Compliance — Architecture & Compliance](#15_architecture_compliance)
- [16_Edge_CDN_Security — Edge / CDN Security](#16_edge_cdn_security)
- [17_DNS_Email_Domain_Security — DNS, Email & Domain Security](#17_dns_email_domain_security)
- [18_Mobile_App_Security — Mobile App Security](#18_mobile_app_security)
- [19_Security_Checklists — Security Checklists (Reference Rollups)](#19_security_checklists)


---

## 01_API_Security — API Security

### `01_API_Security/01_rate_limiting.md`

# Rate Limiting

## What it is
Restricting how many requests a client can make in a given time window.

## Why it matters
Prevents brute force, scraping, and denial-of-service abuse.

## Test checklist
- [ ] Verify limits per IP / per API key / per user
- [ ] Check for proper 429 responses with Retry-After header
- [ ] Test burst vs sustained limits
- [ ] Confirm limits can't be bypassed via header spoofing (X-Forwarded-For)
- [ ] Check distributed rate limiting across multiple servers/regions

## References
- OWASP API Security Top 10 - API4:2023 Unrestricted Resource Consumption

**Severity:** High
**Example test:** Fire 200 requests/sec at a login endpoint from one IP and confirm 429s with Retry-After start well before account lockout thresholds are reachable.
**Last reviewed:** 2026-08-29

### `01_API_Security/02_api_keys.md`

# API Keys

## What it is
Static credentials used to identify and authenticate calling applications.

## Why it matters
Weak key management leads to unauthorized access and abuse.

## Test checklist
- [ ] Keys are not exposed in client-side code/URLs
- [ ] Keys can be rotated without downtime
- [ ] Keys are scoped to least privilege
- [ ] Key usage is logged and monitored
- [ ] Revoked/expired keys are rejected immediately

## References
- OWASP API Security Top 10 - API2:2023 Broken Authentication

**Severity:** High
**Example test:** Grep the built client bundle and mobile binary for hardcoded key patterns, then rotate one key and confirm the old value is rejected within minutes.
**Last reviewed:** 2026-08-29

### `01_API_Security/03_oauth2.md`

# OAuth 2.0

## What it is
Delegated authorization framework for granting limited access without sharing credentials.

## Why it matters
Misconfiguration leads to token theft, account takeover, and privilege escalation.

## Test checklist
- [ ] Validate redirect_uri strictly (no open redirect)
- [ ] Enforce PKCE for public clients
- [ ] Verify state parameter to prevent CSRF
- [ ] Check token expiration and refresh token rotation
- [ ] Confirm scopes are enforced server-side, not just requested

## References
- OAuth 2.0 Security Best Current Practice (RFC 9700)

**Severity:** Critical
**Example test:** Attempt the authorization flow with a modified redirect_uri (e.g. attacker.com) and confirm the server rejects it rather than redirecting.
**Last reviewed:** 2026-08-29

### `01_API_Security/04_jwt_validation.md`

# JWT Validation

## What it is
Verifying the signature, claims, and integrity of JSON Web Tokens.

## Why it matters
Improper validation allows token forgery and privilege escalation.

## Test checklist
- [ ] Algorithm confirmed server-side (reject 'alg: none')
- [ ] Signature verified before trusting claims
- [ ] exp/nbf/iat claims enforced
- [ ] Audience (aud) and issuer (iss) validated
- [ ] Key rotation (kid) handled securely (JWKS)

## References
- RFC 7519 JSON Web Token
- OWASP JWT Cheat Sheet

**Severity:** Critical
**Example test:** Submit a token with 'alg' changed to 'none' and an empty signature; confirm the API rejects it instead of trusting the claims.
**Last reviewed:** 2026-08-29
**See also:** `03_Access_Control_Session_Auth/07_session_management.md`

### `01_API_Security/05_input_sanitation.md`

# Input Sanitation

## What it is
Validating and cleaning all incoming data before processing.

## Why it matters
Root cause of injection attacks (SQLi, XSS, command injection, etc).

## Test checklist
- [ ] Allowlist validation over denylist
- [ ] Type/length/format checks on every field
- [ ] Sanitize on both client and server side
- [ ] Encode output based on context (HTML, JS, SQL, URL)
- [ ] Test with boundary and malformed payloads

## References
- OWASP Input Validation Cheat Sheet

**Severity:** High
**Example test:** Submit oversized, wrong-type, and boundary values (e.g. negative quantity, 10k-char string) on every field and confirm consistent server-side rejection.
**Last reviewed:** 2026-08-29

### `01_API_Security/06_cors_policy.md`

# CORS Policy

## What it is
Browser mechanism controlling which origins can call an API from client-side JS.

## Why it matters
Overly permissive CORS enables cross-origin data theft.

## Test checklist
- [ ] Avoid wildcard '*' with credentials enabled
- [ ] Explicit origin allowlist, not reflected origin
- [ ] Preflight (OPTIONS) requests handled correctly
- [ ] Test with null origin and subdomain spoofing

## References
- OWASP CORS Misconfiguration Guide

**Severity:** High
**Example test:** Send a fetch with Origin: https://evil.com and credentials:'include'; confirm the Access-Control-Allow-Origin response does not reflect evil.com.
**Last reviewed:** 2026-08-29

### `01_API_Security/07_mtls.md`

# Mutual TLS (mTLS)

## What it is
Both client and server present certificates to authenticate each other.

## Why it matters
Provides strong service-to-service identity verification.

## Test checklist
- [ ] Certificate chain validated against trusted CA
- [ ] Certificate revocation checked (CRL/OCSP)
- [ ] Expired/self-signed certs rejected
- [ ] Cert rotation process tested

## References
- NIST SP 800-52

**Severity:** Medium
**Example test:** Present an expired or self-signed client certificate to the mTLS endpoint and confirm the connection is rejected, not silently accepted.
**Last reviewed:** 2026-08-29

### `01_API_Security/08_request_signing.md`

# Request Signing

## What it is
Cryptographically signing requests (e.g. HMAC) to prove authenticity and integrity.

## Why it matters
Prevents tampering and replay attacks even over secure channels.

## Test checklist
- [ ] Signature includes timestamp/nonce to prevent replay
- [ ] Signature covers full payload, not just headers
- [ ] Clock skew tolerance tested
- [ ] Key used for signing is rotated and stored securely

## References
- AWS Signature Version 4 docs (as reference pattern)

**Severity:** Medium
**Example test:** Replay a previously captured signed request unmodified after its timestamp window; confirm it is rejected as a replay.
**Last reviewed:** 2026-08-29

### `01_API_Security/09_ip_allowlisting.md`

# IP Allowlisting

## What it is
Restricting API access to a known set of source IP addresses/ranges.

## Why it matters
Reduces attack surface for internal/partner APIs.

## Test checklist
- [ ] Verify enforcement at network + application layer
- [ ] Test allowlist bypass via spoofed headers
- [ ] Confirm process exists for updating allowlist safely
- [ ] Check behavior for IPv6 vs IPv4 coverage

## References
- NIST SP 800-41

**Severity:** Medium
**Example test:** Send a request from a disallowed IP with a spoofed X-Forwarded-For header set to an allowlisted IP and confirm it is still blocked.
**Last reviewed:** 2026-08-29

### `01_API_Security/10_security_headers.md`

# Security Headers (added)

## What it is
HTTP response headers that instruct browsers to enforce protections.

## Why it matters
Missing headers weaken defense-in-depth against XSS, clickjacking, downgrade attacks.

## Test checklist
- [ ] Content-Security-Policy configured and tested
- [ ] Strict-Transport-Security (HSTS) enabled
- [ ] X-Content-Type-Options: nosniff present
- [ ] X-Frame-Options / frame-ancestors set

## References
- OWASP Secure Headers Project

**Severity:** Medium
**Example test:** Run curl -I against each public endpoint and confirm CSP, HSTS, X-Content-Type-Options, and frame-ancestors are all present.
**Last reviewed:** 2026-08-29


---

## 02_Web_Vulnerabilities — Web Vulnerabilities

### `02_Web_Vulnerabilities/01_sql_injection.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# SQL Injection

## What it is
Untrusted input alters the structure of a SQL query.

## Why it matters
Can lead to full database compromise.

## Test checklist
- [ ] Test parameterized queries are used everywhere
- [ ] Test error messages don't leak query structure
- [ ] Test with encoded/blind injection payload classes
- [ ] Verify ORM usage doesn't fall back to raw string concat

## References
- OWASP SQL Injection Prevention Cheat Sheet

**Severity:** Critical
**Example test:** Submit a single quote and boolean/time-based payloads (e.g. ' OR '1'='1, SLEEP(5)) in every input field and inspect responses/timing for injection signals.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/02_xss.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Cross-Site Scripting (XSS)

## What it is
Injection of malicious scripts into pages viewed by other users.

## Why it matters
Enables session hijacking, defacement, credential theft.

## Test checklist
- [ ] Test reflected, stored, and DOM-based XSS
- [ ] Verify output encoding per context
- [ ] Confirm CSP is enforced and restrictive
- [ ] Test rich text / file upload fields for stored XSS

## References
- OWASP XSS Prevention Cheat Sheet

**Severity:** Critical
**Example test:** Submit <script>alert(document.domain)</script> and common encoded variants into every reflected, stored, and DOM-rendered field.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/03_csrf.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Cross-Site Request Forgery (CSRF)

## What it is
Tricking an authenticated user's browser into making unwanted requests.

## Why it matters
Can perform state-changing actions on behalf of the victim.

## Test checklist
- [ ] Anti-CSRF tokens present on state-changing requests
- [ ] SameSite cookie attribute set appropriately
- [ ] Verify tokens are validated server-side, not just present
- [ ] Test GET requests don't perform state changes

## References
- OWASP CSRF Prevention Cheat Sheet

**Severity:** High
**Example test:** Build an auto-submitting HTML form on a separate origin targeting a state-changing endpoint using the victim's real session cookie, and confirm it is rejected.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/04_ssrf.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Server-Side Request Forgery (SSRF)

## What it is
Server is tricked into making requests to unintended destinations.

## Why it matters
Can expose internal services, cloud metadata endpoints, etc.

## Test checklist
- [ ] Test allowlisting of outbound destinations
- [ ] Test cloud metadata endpoint (169.254.169.254) is blocked
- [ ] Test URL parsing against redirect-based bypass
- [ ] Test DNS rebinding protections

## References
- OWASP SSRF Prevention Cheat Sheet

**Severity:** Critical
**Example test:** Submit a URL-fetching parameter pointing at http://169.254.169.254/latest/meta-data/ and confirm the server does not fetch it.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/05_idor.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Insecure Direct Object Reference (IDOR)

## What it is
Access to objects via user-supplied identifiers without authorization checks.

## Why it matters
Allows access to other users' data by guessing/incrementing IDs.

## Test checklist
- [ ] Test object-level authorization on every endpoint
- [ ] Test with another user's ID/token combination
- [ ] Use non-sequential/opaque identifiers where possible
- [ ] Confirm authorization checked server-side, not inferred from UI

## References
- OWASP API Security Top 10 - API1:2023 Broken Object Level Authorization

**Severity:** Critical
**Example test:** Log in as User A, capture an object ID from a request, then repeat the identical request as User B and confirm access is denied.
**Last reviewed:** 2026-08-29
**See also:** `03_Access_Control_Session_Auth/02_backend_access_control.md`

### `02_Web_Vulnerabilities/06_clickjacking.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Clickjacking

## What it is
Tricking a user into clicking something different from what they perceive via an invisible iframe.

## Why it matters
Can be used to trigger unintended actions on a victim's account.

## Test checklist
- [ ] X-Frame-Options / frame-ancestors CSP directive set
- [ ] Test framing the page from an external origin
- [ ] Verify sensitive actions require re-confirmation

## References
- OWASP Clickjacking Defense Cheat Sheet

**Severity:** Medium
**Example test:** Embed the target page in an <iframe> on a test page and confirm the browser refuses to render it (frame-ancestors/X-Frame-Options enforced).
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/07_open_redirect.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Open Redirect

## What it is
Application redirects to a URL controlled by attacker-supplied input.

## Why it matters
Used for phishing and OAuth token theft.

## Test checklist
- [ ] Test redirect parameters against external domains
- [ ] Use allowlist of permitted redirect targets
- [ ] Test partial-match bypass tricks (e.g. evil.com/trusted.com)

## References
- OWASP Unvalidated Redirects and Forwards Cheat Sheet

**Severity:** Medium
**Example test:** Set the redirect parameter to an external domain (and bypass tricks like //evil.com or trusted.com.evil.com) and confirm the app refuses or rewrites it.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/08_path_traversal.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Path Traversal

## What it is
Manipulating file paths to access files outside the intended directory.

## Why it matters
Can expose source code, config files, or credentials.

## Test checklist
- [ ] Test with ../ and encoded variants
- [ ] Confirm file access is restricted to an allowlisted directory
- [ ] Test null byte and unicode normalization bypasses

## References
- OWASP Path Traversal Cheat Sheet

**Severity:** Critical
**Example test:** Submit ../../../../etc/passwd and URL-encoded/unicode variants in any file-path parameter and confirm access stays within the intended directory.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/09_insecure_deserialization.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Insecure Deserialization

## What it is
Deserializing untrusted data can lead to remote code execution or object injection.

## Why it matters
One of the most severe vulnerability classes when exploitable.

## Test checklist
- [ ] Avoid deserializing untrusted input where possible
- [ ] Use safe/allowlisted formats (e.g. JSON over native serialization)
- [ ] Test with tampered serialized objects
- [ ] Integrity-check serialized data (signing)

## References
- OWASP Deserialization Cheat Sheet

**Severity:** Critical
**Example test:** Tamper with a serialized object/cookie (flip a field, change a type) and submit it; confirm the server rejects it rather than deserializing blindly.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/10_broken_authentication.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Broken Authentication

## What it is
Flaws in login, session management, or credential handling.

## Why it matters
Leads to account takeover.

## Test checklist
- [ ] Test password policy and brute-force protections
- [ ] Test session fixation and session expiry
- [ ] Test MFA bypass paths
- [ ] Test credential stuffing resilience

## References
- OWASP Authentication Cheat Sheet

**Severity:** Critical
**Example test:** Run a scripted credential-stuffing pass against the login endpoint using a small known-breached credential list and confirm lockout/rate-limit triggers.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/11_ssti.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Server-Side Template Injection (SSTI) (added)

## What it is
User input is evaluated by a server-side template engine.

## Why it matters
Can lead to remote code execution.

## Test checklist
- [ ] Test template syntax injection in all user-controlled fields
- [ ] Confirm templates render with sandboxing where supported
- [ ] Never build templates via string concatenation with user input

## References
- OWASP SSTI reference

**Severity:** Critical
**Example test:** Submit template syntax such as {{7*7}} or ${7*7} into user-controlled text fields and check whether the output evaluates to 49.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/12_xxe.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# XML External Entity (XXE) Injection (added)

## What it is
XML parsers process external entity references from untrusted XML.

## Why it matters
Can lead to file disclosure, SSRF, or DoS.

## Test checklist
- [ ] Disable external entity resolution in XML parsers
- [ ] Use allowlisted/least-feature parser configuration
- [ ] Test with DTD-based payload classes

## References
- OWASP XXE Prevention Cheat Sheet

**Severity:** Critical
**Example test:** Submit an XML payload with a DOCTYPE defining an external entity pointing to a local file and confirm the parser refuses to resolve it.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/13_mass_assignment.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Mass Assignment (added)

## What it is
Binding user input directly to internal objects/fields without filtering.

## Why it matters
Can allow attackers to set privileged fields (e.g. isAdmin).

## Test checklist
- [ ] Explicit allowlist of bindable fields per endpoint
- [ ] Test submitting extra/unexpected fields in requests
- [ ] Confirm role/privilege fields are never client-settable

## References
- OWASP API Security Top 10 - API6:2023 Unrestricted Access to Business Flows

**Severity:** High
**Example test:** Add an unexpected field such as "isAdmin": true to a normal profile-update request body and confirm it is ignored, not applied.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/14_race_conditions.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Race Conditions (added)

## What it is
Concurrent requests exploit timing gaps in business logic.

## Why it matters
Can lead to duplicate discounts, double-spending, inventory bypass.

## Test checklist
- [ ] Test parallel/concurrent request submission on critical flows
- [ ] Confirm atomic operations / locking on shared resources
- [ ] Test idempotency key enforcement

## References
- PortSwigger Race Condition research

**Severity:** High
**Example test:** Fire 20 identical concurrent requests at a discount/redeem endpoint and confirm only one succeeds, not all twenty.
**Last reviewed:** 2026-08-29

### `02_Web_Vulnerabilities/15_request_smuggling.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# HTTP Request Smuggling (added)

## What it is
Discrepancies in how front-end and back-end servers parse requests.

## Why it matters
Can bypass security controls and access other users' requests.

## Test checklist
- [ ] Test Content-Length vs Transfer-Encoding handling discrepancies
- [ ] Test across all proxy/load balancer layers
- [ ] Keep proxy and origin server HTTP parsing aligned

## References
- PortSwigger HTTP Request Smuggling research

**Severity:** Critical
**Example test:** Send a request with conflicting Content-Length and Transfer-Encoding headers through the full proxy chain and observe whether front-end/back-end parsing disagrees.
**Last reviewed:** 2026-08-29


---

## 03_Access_Control_Session_Auth — Access Control, Session & Auth

### `03_Access_Control_Session_Auth/01_ui_ux_access_control.md`

# UI/UX-Level Access Control

## What it is
Hiding buttons/menus based on role, purely on the client side.

## Why it matters
Cosmetic only — must never be the sole enforcement layer.

## Test checklist
- [ ] Confirm hidden UI elements are also blocked server-side
- [ ] Test direct API calls bypassing the UI
- [ ] Test role-based visibility across all user tiers

## References
- OWASP Access Control Cheat Sheet

**Severity:** Medium
**Example test:** Call the underlying API directly with a lower-privilege token, bypassing the UI that hides the button, and confirm the server still denies it.
**Last reviewed:** 2026-08-29

### `03_Access_Control_Session_Auth/02_backend_access_control.md`

# Backend Access Control

## What it is
Server-side enforcement of who can do what to which resource.

## Why it matters
The real security boundary; UI hiding is not sufficient.

## Test checklist
- [ ] Every endpoint enforces authN + authZ independently
- [ ] Test vertical privilege escalation (user -> admin)
- [ ] Test horizontal privilege escalation (user A -> user B's data)
- [ ] Deny-by-default posture confirmed

## References
- OWASP Access Control Cheat Sheet

**Severity:** Critical
**Example test:** Using User A's valid session, request User B's resource ID directly and confirm a 403, not the data.
**Last reviewed:** 2026-08-29
**See also:** `02_Web_Vulnerabilities/05_idor.md`, `03_Access_Control_Session_Auth/01_ui_ux_access_control.md`

### `03_Access_Control_Session_Auth/03_cache_invalidation_on_auth_change.md`

# Cache Invalidation on Auth/Privilege Change

## What it is
Ensuring cached session/permission data is invalidated immediately when auth state changes.

## Why it matters
Stale cached permissions can let a de-privileged or logged-out user keep acting with old rights.

## Test checklist
- [ ] Test that logout invalidates cached session data immediately, not just client-side
- [ ] Test that a role/permission downgrade takes effect without requiring re-login
- [ ] Confirm password change invalidates other active sessions (or as designed)
- [ ] Test cache TTLs aren't so long that revocation is effectively delayed

## References
- OWASP Session Management Cheat Sheet

**Severity:** High
**Example test:** Downgrade a test user's role, then immediately retry a privileged action with their still-active session and confirm it's now denied.
**Last reviewed:** 2026-08-29

### `03_Access_Control_Session_Auth/04_device_trust_fingerprinting.md`

# Device Trust & Fingerprinting

## What it is
Recognizing a returning trusted device to reduce friction (e.g. skip MFA on known devices).

## Why it matters
Weak device trust can be spoofed to bypass MFA entirely.

## Test checklist
- [ ] Confirm device trust is tied to a secure, unpredictable device identifier, not just User-Agent
- [ ] Test that device trust expires and re-verification is required periodically
- [ ] Confirm new/unrecognized devices always trigger full auth + MFA
- [ ] Test for device trust bypass via spoofed identifiers

## References
- NIST SP 800-63B

**Severity:** Medium
**Example test:** Replay a captured device-trust identifier from a different browser/device and confirm it does not skip MFA.
**Last reviewed:** 2026-08-29

### `03_Access_Control_Session_Auth/05_rbac_abac.md`

# RBAC / ABAC Models (added)

## What it is
Role-Based vs Attribute-Based access control models.

## Why it matters
Choosing/implementing the wrong model leads to over-permissioning.

## Test checklist
- [ ] Roles/attributes map to least privilege
- [ ] Role assignment changes are logged and reviewed
- [ ] Test for privilege creep in long-lived accounts

## References
- NIST RBAC/ABAC guidance

**Severity:** Medium
**Example test:** Pick a long-lived test account and diff its current granted permissions against what its role should have today, looking for accumulated excess access.
**Last reviewed:** 2026-08-29

### `03_Access_Control_Session_Auth/06_forced_reauth_sensitive_actions.md`

# Forced Re-Authentication for Sensitive Actions

## What it is
Requiring fresh credential/MFA confirmation before high-risk actions, even within an active session.

## Why it matters
Auto-login/remember-me sessions shouldn't be enough to authorize account takeover-level changes.

## Test checklist
- [ ] Test that changing password/email/MFA requires re-entering current credentials
- [ ] Test that a session restored via remember-me token still requires step-up auth for sensitive actions
- [ ] Confirm step-up auth prompt can't be bypassed by replaying an old confirmation
- [ ] Test time window after step-up auth before it expires again

## References
- OWASP Authentication Cheat Sheet - Re-authentication

**Severity:** High
**Example test:** From an already-logged-in session, attempt to change the account email/password without re-entering credentials and confirm it's blocked.
**Last reviewed:** 2026-08-29

### `03_Access_Control_Session_Auth/07_session_management.md`

# Session Management (added)

## What it is
Handling of session tokens/cookies across the user's authenticated lifecycle.

## Why it matters
Weak session handling enables hijacking and fixation attacks.

## Test checklist
- [ ] Session ID regenerated on login/privilege change
- [ ] Sessions expire after inactivity and absolute timeout
- [ ] Secure, HttpOnly, SameSite cookie flags set
- [ ] Logout invalidates session server-side

## References
- OWASP Session Management Cheat Sheet

**Severity:** High
**Example test:** Capture the session cookie before and after login and confirm the session ID value actually changes (regenerates) rather than persisting.
**Last reviewed:** 2026-08-29
**See also:** `01_API_Security/04_jwt_validation.md`, `03_Access_Control_Session_Auth/10_remember_me_persistent_login.md`

### `03_Access_Control_Session_Auth/08_mfa.md`

# Multi-Factor Authentication (added)

## What it is
Requiring a second verification factor beyond password.

## Why it matters
Significantly reduces account takeover risk.

## Test checklist
- [ ] Test MFA cannot be bypassed via password reset flow
- [ ] Test backup codes are single-use and rate-limited
- [ ] Confirm MFA enforced for privileged accounts at minimum

## References
- NIST SP 800-63B

**Severity:** Critical
**Example test:** Attempt the password-reset flow and confirm it cannot be used to fully log in while skipping the MFA step.
**Last reviewed:** 2026-08-29

### `03_Access_Control_Session_Auth/09_session_store_caching.md`

# Session Store Security (Redis/Memcached)

## What it is
Securing the backing store used to hold server-side session data.

## Why it matters
A compromised or exposed session store can leak or forge every active session.

## Test checklist
- [ ] Confirm session store requires authentication and isn't publicly reachable
- [ ] Confirm sensitive session data is encrypted at rest in the store
- [ ] Test session store connection uses TLS where it crosses network boundaries
- [ ] Confirm session store access is least-privilege (app can't run arbitrary admin commands)

## References
- OWASP Session Management Cheat Sheet

**Severity:** High
**Example test:** Attempt to connect directly to the Redis/Memcached session store from outside the app network and confirm authentication is required and it isn't publicly reachable.
**Last reviewed:** 2026-08-29

### `03_Access_Control_Session_Auth/10_remember_me_persistent_login.md`

# "Remember Me" & Persistent Login Tokens

## What it is
Long-lived tokens that let a user skip login on return visits, and the rotation
strategy used to keep those long-lived tokens safe over time (including
refresh-token rotation patterns).

## Why it matters
A stolen remember-me or persistent-login token is effectively a stolen account
if not designed carefully — and if the token never rotates, a single leak gives
an attacker indefinite access.

## Test checklist
- [ ] Confirm tokens are long, random, and stored hashed server-side
- [ ] Confirm tokens rotate on each use (rotating refresh-token pattern), not a static reusable value
- [ ] Test that reuse of an already-rotated-out token triggers alerting/session revocation (breach detection)
- [ ] Test token doesn't grant access to sensitive actions without step-up auth
- [ ] Confirm tokens can be individually revoked (e.g. "log out all devices")
- [ ] Confirm a maximum absolute lifetime is enforced even with continuous rotation

## References
- OWASP Authentication Cheat Sheet - Remember Me section
- OAuth 2.0 Security Best Current Practice - Refresh Token Rotation

**Severity:** High
**Example test:** Use a captured remember-me token once, then reuse the same (now-rotated-out) token value again and confirm it triggers revocation/alerting rather than silent success.
**Last reviewed:** 2026-08-29
**See also:** `03_Access_Control_Session_Auth/07_session_management.md`


---

## 04_UI_Framework_Security — UI / Framework Security

### `04_UI_Framework_Security/01_framework_xss_sinks.md`

# Framework-Specific XSS Sinks

## What it is
Bypassing a framework's built-in auto-escaping via dangerous APIs (dangerouslySetInnerHTML, v-html, [innerHTML]).

## Why it matters
Frameworks auto-escape by default, but these escape hatches reintroduce raw XSS.

## Test checklist
- [ ] Grep codebase for dangerouslySetInnerHTML / v-html / innerHTML / bypassSecurityTrust*
- [ ] Confirm any raw HTML rendering is sanitized (e.g. DOMPurify) before use
- [ ] Test rich text editor output specifically
- [ ] Confirm third-party embedded widgets don't inject unsanitized HTML

## References
- OWASP XSS Prevention Cheat Sheet
- React/Vue/Angular security docs

**Severity:** High
**Example test:** grep -r 'dangerouslySetInnerHTML\|v-html\|innerHTML' across the frontend source and confirm every hit sanitizes input (e.g. via DOMPurify) first.
**Last reviewed:** 2026-08-29

### `04_UI_Framework_Security/02_client_side_routing_auth.md`

# Client-Side Routing & Route Guards

## What it is
SPA route guards (React Router, Vue Router) that hide pages based on client-side auth state.

## Why it matters
Route guards are UX only; the underlying API/data must be protected server-side too.

## Test checklist
- [ ] Directly call underlying API/data endpoints without going through the guarded route
- [ ] Confirm sensitive data isn't fetched before the auth check resolves
- [ ] Test back-button/cached-page access after logout
- [ ] Verify server-side authorization on every data-fetching call, not just route entry

## References
- OWASP Access Control Cheat Sheet

**Severity:** High
**Example test:** Call the data-fetching API endpoint behind a guarded route directly via curl/Postman without going through the SPA route guard, and confirm it's still blocked server-side.
**Last reviewed:** 2026-08-29

### `04_UI_Framework_Security/03_state_management_leaks.md`

# State Management Data Leaks

## What it is
Sensitive data stored in global client state (Redux/Vuex/Context) visible via devtools.

## Why it matters
Devtools extensions and browser inspection can expose tokens, PII, or internal data left in state.

## Test checklist
- [ ] Inspect Redux/Vuex devtools in production build for sensitive fields
- [ ] Confirm devtools are disabled/stripped in production builds
- [ ] Test that tokens/secrets are never placed in global state, only in memory scoped narrowly
- [ ] Check persisted state (redux-persist, localStorage) for sensitive data

## References
- OWASP Client-Side Storage guidance

**Severity:** Medium
**Example test:** Open Redux/Vuex devtools against the production build and search global state for tokens, secrets, or full user PII objects.
**Last reviewed:** 2026-08-29

### `04_UI_Framework_Security/04_build_config_exposure.md`

# Build Config & Source Map Exposure

## What it is
Environment variables bundled into client JS, and source maps left accessible in production.

## Why it matters
Anything bundled client-side is public; exposed source maps make reversing trivial.

## Test checklist
- [ ] Confirm only public-safe env vars are exposed to the client bundle
- [ ] Test that .map files are not accessible in production
- [ ] Search built JS bundle for accidentally-included secrets/API keys
- [ ] Confirm build pipeline separates client-safe vs server-only config

## References
- OWASP Configuration Cheat Sheet

**Severity:** Medium
**Example test:** Fetch every .map file path from the production bundle directly and confirm 404s; grep the deployed JS bundle for API key-shaped strings.
**Last reviewed:** 2026-08-29

### `04_UI_Framework_Security/05_csp_framework_compatibility.md`

# CSP Compatibility with UI Frameworks

## What it is
Configuring Content-Security-Policy so it works with a framework's inline styles/scripts without weakening it.

## Why it matters
A CSP with 'unsafe-inline' to make a framework work defeats much of its purpose.

## Test checklist
- [ ] Use nonces or hashes instead of 'unsafe-inline' where the framework requires inline scripts/styles
- [ ] Test CSP doesn't break in production build vs dev build
- [ ] Confirm CSP report-uri/report-to is monitored

## References
- OWASP Content Security Policy Cheat Sheet

**Severity:** Medium
**Example test:** Check the deployed CSP header for 'unsafe-inline'; if present, test whether nonces/hashes can replace it without breaking the framework's inline scripts.
**Last reviewed:** 2026-08-29


---

## 05_Backend_Handling — Backend Handling

### `05_Backend_Handling/01_business_logic_validation.md`

# Business Logic Validation

## What it is
Enforcing that requests follow intended workflows/state transitions, not just syntactic validation.

## Why it matters
Technically valid requests can still violate business rules (e.g. skipping payment step).

## Test checklist
- [ ] Test skipping steps in a multi-step workflow (e.g. checkout without payment)
- [ ] Test submitting negative quantities/prices where not expected
- [ ] Test state transitions that shouldn't be reachable (e.g. cancelled -> shipped)
- [ ] Confirm server re-validates business rules, not just trusting client-submitted state

## References
- OWASP Business Logic Testing Guide

**Severity:** High
**Example test:** Attempt to call the 'ship order' step of a checkout flow while skipping the 'payment' step and confirm the server rejects the out-of-order transition.
**Last reviewed:** 2026-08-29

### `05_Backend_Handling/02_file_upload_handling.md`

# File Upload Handling

## What it is
Validating, storing, and serving user-uploaded files safely.

## Why it matters
Improper handling leads to RCE, stored XSS, or storage abuse.

## Test checklist
- [ ] Validate file type by content (magic bytes), not just extension/MIME header
- [ ] Store uploads outside the web root or in isolated object storage
- [ ] Enforce file size limits and scan for malware
- [ ] Serve uploaded files with safe Content-Disposition/Content-Type, no inline execution

## References
- OWASP File Upload Cheat Sheet

**Severity:** Critical
**Example test:** Upload a file with a .jpg extension but executable/script magic bytes inside, and confirm the server validates content type by inspecting bytes, not just the extension.
**Last reviewed:** 2026-08-29

### `05_Backend_Handling/03_orm_database_security.md`

# ORM & Database Layer Security

## What it is
Ensuring the data access layer enforces the same protections as raw SQL would need.

## Why it matters
ORMs reduce but don't eliminate injection and over-fetching risks.

## Test checklist
- [ ] Confirm raw query escape hatches in the ORM are parameterized
- [ ] Test for excessive data exposure (ORM returning full objects instead of needed fields)
- [ ] Review database user permissions (least privilege, no superuser for app connection)
- [ ] Confirm connection strings/credentials aren't hardcoded

## References
- OWASP SQL Injection Prevention Cheat Sheet

**Severity:** High
**Example test:** Search the codebase for any raw-query escape hatches in the ORM and confirm every one uses parameter binding, not string concatenation.
**Last reviewed:** 2026-08-29

### `05_Backend_Handling/04_background_job_queue_security.md`

# Background Job & Queue Security

## What it is
Securing async job processing (queues, workers, cron jobs) from injection and abuse.

## Why it matters
Queued jobs often skip the validation that sits in front of synchronous API endpoints.

## Test checklist
- [ ] Confirm queued job payloads are validated the same as API input
- [ ] Test for job payload tampering (signed/authenticated messages)
- [ ] Confirm job retries can't be abused for duplicate side effects (idempotency)
- [ ] Review access control on queue management/admin interfaces

## References
- OWASP Asynchronous Processing guidance

**Severity:** Medium
**Example test:** Submit a queued job payload with malformed/malicious data directly (bypassing the API layer) and confirm the worker validates it the same way the API would.
**Last reviewed:** 2026-08-29

### `05_Backend_Handling/05_error_handling_stack_traces.md`

# Error Handling & Stack Trace Exposure

## What it is
Ensuring errors are handled gracefully without leaking internal details.

## Why it matters
Verbose errors reveal file paths, stack traces, and internal architecture to attackers.

## Test checklist
- [ ] Confirm production mode disables detailed error pages/stack traces
- [ ] Test that generic error messages are returned to clients
- [ ] Confirm full error detail is only logged server-side, not returned in response
- [ ] Test unexpected input types (wrong content-type, malformed JSON) for graceful handling

## References
- OWASP Error Handling Cheat Sheet

**Severity:** Medium
**Example test:** Send a malformed request (bad JSON, wrong content-type) to a production endpoint and confirm the response is a generic error, not a stack trace or file path.
**Last reviewed:** 2026-08-29


---

## 06_Data_Protection_Secrets — Data Protection & Secrets

### `06_Data_Protection_Secrets/01_encryption_at_rest.md`

# Encryption at Rest

## What it is
Encrypting stored data (databases, backups, file storage) so raw access doesn't expose plaintext.

## Why it matters
Protects data if physical storage or backups are stolen or improperly accessed.

## Test checklist
- [ ] Confirm databases/disks/object storage have encryption at rest enabled
- [ ] Confirm backups are encrypted, not just the live database
- [ ] Test that encryption keys are stored separately from the encrypted data
- [ ] Confirm sensitive fields (PII, secrets) use field-level encryption where appropriate

## References
- NIST SP 800-111 Storage Encryption

**Severity:** High
**Example test:** Confirm via cloud console/CLI that the database volume, backups, and object storage all show encryption-at-rest enabled, not just the primary disk.
**Last reviewed:** 2026-08-29

### `06_Data_Protection_Secrets/02_encryption_in_transit.md`

# Encryption in Transit

## What it is
Encrypting data as it moves between clients, services, and internal components.

## Why it matters
Prevents interception/tampering on the network, including internal service-to-service traffic.

## Test checklist
- [ ] Confirm all external traffic is HTTPS-only (no plain HTTP fallback)
- [ ] Confirm internal service-to-service traffic is also encrypted, not assumed 'trusted network'
- [ ] Test for TLS downgrade attack resistance
- [ ] Confirm database connections use TLS, not plaintext

## References
- NIST SP 800-52

**Severity:** High
**Example test:** Attempt to connect to the database and any internal service-to-service endpoint over plaintext and confirm the connection is refused, TLS-only.
**Last reviewed:** 2026-08-29

### `06_Data_Protection_Secrets/03_pii_data_classification.md`

# PII & Data Classification

## What it is
Identifying and labeling data by sensitivity so appropriate controls are applied.

## Why it matters
You can't protect what you haven't identified; misclassified data gets under-protected.

## Test checklist
- [ ] Data inventory identifies where PII/sensitive data lives
- [ ] Access controls scale with data sensitivity classification
- [ ] Confirm data retention/deletion policy matches classification requirements
- [ ] Test that exports/reports don't leak higher-sensitivity data than intended

## References
- NIST SP 800-122 PII Guide

**Severity:** Medium
**Example test:** Pull a sample data export/report and check whether it exposes any field classified as higher-sensitivity than the export's intended audience.
**Last reviewed:** 2026-08-29

### `06_Data_Protection_Secrets/04_key_management.md`

# Key Management (KMS)

## What it is
Generating, storing, rotating, and revoking cryptographic keys used across the system.

## Why it matters
Weak key management undermines every encryption control built on top of it.

## Test checklist
- [ ] Use a dedicated KMS/HSM rather than hardcoded or file-based keys
- [ ] Confirm key rotation policy is defined and automated where possible
- [ ] Confirm key access is logged and least-privilege
- [ ] Test key revocation process (e.g. after suspected compromise)

## References
- NIST SP 800-57 Key Management Guide

**Severity:** Critical
**Example test:** Confirm encryption keys live in a KMS/HSM (not a config file or env var) and walk through the documented key-revocation procedure end to end.
**Last reviewed:** 2026-08-29

### `06_Data_Protection_Secrets/05_tls_certificate_management.md`

# TLS Certificate Management

## What it is
Issuing, renewing, and monitoring TLS certificates across all deployed endpoints.

## Why it matters
Expired or misconfigured certs cause outages and downgrade attack risk.

## Test checklist
- [ ] Confirm automated certificate renewal (e.g. ACME/Let's Encrypt or managed cert service)
- [ ] Monitor certificate expiry with alerting well before expiration
- [ ] Confirm TLS 1.2+ only, weak ciphers disabled
- [ ] Test HSTS is enabled and preload-eligible if applicable

## References
- Mozilla SSL Configuration Generator

**Severity:** High
**Example test:** Run an SSL/TLS scan (e.g. against the Mozilla Observatory or testssl.sh) on each public endpoint and confirm TLS 1.2+ only, no weak ciphers, valid expiry.
**Last reviewed:** 2026-08-29

### `06_Data_Protection_Secrets/06_secrets_management.md`

# Secrets Management (added)

## What it is
Secure storage, rotation, and access control for credentials, keys, and tokens.

## Why it matters
Hardcoded/leaked secrets are one of the top causes of breaches.

## Test checklist
- [ ] No secrets committed to source control
- [ ] Secrets stored in a vault (not env files in prod)
- [ ] Automatic rotation policy in place
- [ ] Access to secrets is scoped and audited

## References
- OWASP Secrets Management Cheat Sheet

**Severity:** Critical
**Example test:** Run a secret-scanning tool (e.g. gitleaks/truffleHog) across the full git history, not just HEAD, and confirm zero committed credentials.
**Last reviewed:** 2026-08-29
**See also:** `06_Data_Protection_Secrets/04_key_management.md`, `08_Release_Engineering_Version_Control/05_cicd_security.md`


---

## 07_Cloud_Infra_Deployment — Cloud Infra & Deployment

### `07_Cloud_Infra_Deployment/01_environment_separation.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Environment Separation

## What it is
Keeping dev, staging, and production environments isolated from each other.

## Why it matters
Cross-environment leakage can expose prod data to lower-trust environments or vice versa.

## Test checklist
- [ ] Confirm prod credentials/data never exist in dev/staging
- [ ] Test that staging environments aren't publicly indexable/accessible without auth
- [ ] Confirm separate cloud accounts/projects per environment where possible
- [ ] Verify CI/CD pipeline can't accidentally deploy dev code to prod config

## References
- NIST SP 800-53 environment separation controls

**Severity:** Critical
**Example test:** Attempt to reach the staging environment unauthenticated from the public internet and confirm it requires auth or is not publicly indexable.
**Last reviewed:** 2026-08-29

### `07_Cloud_Infra_Deployment/02_iam_policy_review.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Cloud IAM Policy Review

## What it is
Reviewing identity and access management policies across cloud accounts/projects.

## Why it matters
Overly broad IAM policies are one of the most common root causes of cloud breaches.

## Test checklist
- [ ] Review for wildcard permissions (*:*) and scope them down
- [ ] Confirm least-privilege per role, reviewed periodically
- [ ] Test for privilege escalation paths between roles
- [ ] Confirm break-glass/emergency access is logged and time-limited

## References
- CIS AWS/Azure/GCP Foundations Benchmark

**Severity:** Critical
**Example test:** Export all IAM policies and grep for '*:*' or overly broad wildcard actions/resources; confirm each is justified or scoped down.
**Last reviewed:** 2026-08-29
**See also:** `07_Cloud_Infra_Deployment/11_deploy_pipeline_iam_scoping.md`

### `07_Cloud_Infra_Deployment/03_blue_green_canary_rollback.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Blue-Green / Canary Deployment & Rollback

## What it is
Gradually shifting traffic to new versions with the ability to roll back quickly.

## Why it matters
Safe deployment strategy limits blast radius of a bad or vulnerable release.

## Test checklist
- [ ] Confirm rollback can be executed within a defined time target
- [ ] Test canary release with a small traffic percentage before full rollout
- [ ] Confirm monitoring/alerts are tied to the canary phase specifically
- [ ] Test rollback doesn't cause data corruption from schema changes

## References
- Martin Fowler - BlueGreenDeployment (pattern reference)

**Severity:** High
**Example test:** Trigger a rollback in staging and time how long it takes to reach the previous stable version; compare against your defined rollback-time target.
**Last reviewed:** 2026-08-29

### `07_Cloud_Infra_Deployment/04_container_k8s_security.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Container Orchestration (Kubernetes) Security

## What it is
Hardening the cluster, workloads, and network policies of a container orchestration platform.

## Why it matters
A misconfigured cluster can allow lateral movement across every workload it hosts.

## Test checklist
- [ ] Confirm RBAC is enforced within the cluster, not default-permissive
- [ ] Confirm network policies restrict pod-to-pod traffic by default
- [ ] Test that secrets aren't stored as plain environment variables in manifests
- [ ] Confirm pod security standards (non-root, no privileged containers) are enforced

## References
- NIST SP 800-190
- CIS Kubernetes Benchmark

**Severity:** High
**Example test:** Run 'kubectl auth can-i --list' as a low-privilege service account and confirm it cannot perform cluster-admin-level actions.
**Last reviewed:** 2026-08-29

### `07_Cloud_Infra_Deployment/05_cloud_storage_misconfig.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Cloud Storage Misconfiguration

## What it is
Ensuring object storage (S3-style buckets, blobs) isn't unintentionally public or misconfigured.

## Why it matters
Public storage bucket leaks are one of the most common and damaging cloud misconfigurations.

## Test checklist
- [ ] Confirm buckets default to private with explicit allowlisting for public assets only
- [ ] Test bucket policies and ACLs for unintended public read/write
- [ ] Confirm logging/versioning enabled on storage containing sensitive data
- [ ] Scan periodically for newly created buckets that drift from policy

## References
- AWS/GCP/Azure storage security best practices

**Severity:** Critical
**Example test:** List every storage bucket/container and confirm none allow anonymous public read/write except explicitly intended public assets.
**Last reviewed:** 2026-08-29

### `07_Cloud_Infra_Deployment/06_infra_as_code_scanning.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Infrastructure-as-Code Scanning

## What it is
Static analysis of Terraform/CloudFormation/Pulumi configs before deployment.

## Why it matters
Misconfigured infra (open security groups, public buckets) is a top cause of breaches.

## Test checklist
- [ ] Run IaC scanning tool (e.g. tfsec/Checkov-style checks) in CI
- [ ] Confirm no security groups are open to 0.0.0.0/0 unintentionally
- [ ] Confirm storage buckets default to private
- [ ] Review IaC changes in PRs the same as application code

## References
- CIS Benchmarks for cloud providers

**Severity:** High
**Example test:** Run an IaC scanner (e.g. tfsec/Checkov) against the current Terraform/CloudFormation config and confirm zero unresolved high/critical findings.
**Last reviewed:** 2026-08-29

### `07_Cloud_Infra_Deployment/07_container_image_security.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Container Image Security

## What it is
Ensuring container images are built from minimal, patched, and scanned base images.

## Why it matters
Vulnerable or bloated images increase attack surface significantly.

## Test checklist
- [ ] Scan images for known CVEs before deployment
- [ ] Use minimal base images (distroless/alpine) where possible
- [ ] Confirm containers don't run as root
- [ ] Confirm image tags are pinned (not 'latest') and images are signed

## References
- NIST SP 800-190 Container Security Guide

**Severity:** High
**Example test:** Run a CVE scanner (e.g. Trivy/Grype) against the production container image and confirm no unpatched critical CVEs, and that it isn't tagged 'latest'.
**Last reviewed:** 2026-08-29

### `07_Cloud_Infra_Deployment/08_network_segmentation_cloud.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Cloud Network Segmentation

## What it is
Isolating workloads into separate network segments/VPCs based on trust level.

## Why it matters
Flat cloud networks let a single compromised service reach everything else.

## Test checklist
- [ ] Confirm production workloads are segmented from lower-trust environments
- [ ] Test that a compromised low-trust service can't reach sensitive internal services directly
- [ ] Confirm security groups/firewall rules follow least-privilege, not broad internal-only allow
- [ ] Review peering/VPN connections for unintended over-broad access

## References
- NIST SP 800-41 Firewall/Segmentation guidance

**Severity:** High
**Example test:** From a low-trust workload/VPC, attempt to reach a sensitive internal service directly and confirm network policy blocks it.
**Last reviewed:** 2026-08-29

### `07_Cloud_Infra_Deployment/09_post_deploy_monitoring.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Post-Deployment Monitoring

## What it is
Actively watching key metrics/logs immediately after a release goes live.

## Why it matters
Many issues (errors, latency spikes, security alerts) surface only under real production traffic.

## Test checklist
- [ ] Error rate and latency dashboards checked immediately after deploy
- [ ] Security alerting active during the post-deploy window
- [ ] Defined rollback trigger thresholds (e.g. error rate > X% triggers auto-rollback)
- [ ] On-call owner assigned for each deployment

## References
- Google SRE Book - Release Engineering chapter (as reference pattern)

**Severity:** Medium
**Example test:** During the next deploy, confirm an on-call owner is actively watching error-rate/latency dashboards for the defined post-deploy window.
**Last reviewed:** 2026-08-29

### `07_Cloud_Infra_Deployment/10_feature_flag_safety.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Feature Flags & Kill Switches

## What it is
Using feature flags to enable instant disabling of risky features without a full redeploy.

## Why it matters
Reduces time-to-mitigate when a new feature turns out to have a security or stability issue.

## Test checklist
- [ ] Confirm high-risk features are gated behind a flag with a kill switch
- [ ] Test that toggling a flag off actually disables the code path immediately
- [ ] Confirm flag management access is restricted to authorized roles
- [ ] Test flag state doesn't leak sensitive info to unauthorized users (e.g. flag payload exposed client-side)

## References
- LaunchDarkly / feature flag security best practices (as reference pattern)

**Severity:** Medium
**Example test:** Toggle a high-risk feature flag off in staging and confirm the code path is actually disabled immediately, not just hidden in the UI.
**Last reviewed:** 2026-08-29

### `07_Cloud_Infra_Deployment/11_deploy_pipeline_iam_scoping.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Least-Privilege IAM for Deployment

## What it is
Scoping deployment pipeline and service credentials to the minimum permissions needed.

## Why it matters
Overprivileged deploy credentials turn a pipeline compromise into a full account compromise.

## Test checklist
- [ ] Review IAM roles used by CI/CD for least privilege
- [ ] Confirm deploy credentials are short-lived/rotated, not long-lived static keys
- [ ] Test that a compromised pipeline token can't access unrelated resources
- [ ] Separate deploy permissions per environment (staging deployer can't touch prod)

## References
- AWS/GCP/Azure IAM best practices documentation

**Severity:** Critical
**Example test:** Inspect the CI/CD service account's IAM role and confirm a staging-deploy credential cannot touch production resources.
**Last reviewed:** 2026-08-29
**See also:** `07_Cloud_Infra_Deployment/02_iam_policy_review.md`


---

## 08_Release_Engineering_Version_Control — Release Engineering & Version Control

### `08_Release_Engineering_Version_Control/01_secure_coding_guidelines.md`

# Secure Coding Guidelines

## What it is
Personal/team reference of secure coding practices by language/framework.

## Why it matters
Prevents vulnerabilities from being written in the first place.

## Test checklist
- [ ] Language-specific secure coding cheat sheet linked
- [ ] Code review checklist includes security items
- [ ] Common anti-patterns documented with examples

## References
- OWASP Secure Coding Practices Quick Reference

**Severity:** Low
**Example test:** Confirm the team's secure-coding cheat sheet is linked from the PR template/onboarding docs, not just filed away unused.
**Last reviewed:** 2026-08-29

### `08_Release_Engineering_Version_Control/02_semantic_versioning.md`

# Semantic Versioning

## What it is
Using a consistent MAJOR.MINOR.PATCH scheme so version numbers communicate change impact.

## Why it matters
Inconsistent versioning makes it hard to know if an update is safe to deploy or breaks something.

## Test checklist
- [ ] Confirm a consistent versioning scheme is used across app/API
- [ ] Breaking changes always bump MAJOR version
- [ ] Version exposed in API responses/headers doesn't leak internal build details unnecessarily
- [ ] Clients can detect and handle version mismatches gracefully

## References
- Semantic Versioning 2.0.0 (semver.org)

**Severity:** Low
**Example test:** Check the last 3 releases and confirm any breaking change actually bumped the MAJOR version.
**Last reviewed:** 2026-08-29

### `08_Release_Engineering_Version_Control/03_branch_protection_signed_commits.md`

# Branch Protection & Signed Commits

## What it is
Enforcing required reviews, status checks, and commit/tag signing on protected branches.

## Why it matters
Prevents unreviewed or unverified code from reaching main/release branches.

## Test checklist
- [ ] Main/release branches require PR review before merge
- [ ] Required status checks (tests, security scans) block merge on failure
- [ ] Commits/tags are signed (GPG/SSH) and signature verification enforced
- [ ] Force-push and history rewriting disabled on protected branches

## References
- GitHub/GitLab branch protection documentation

**Severity:** High
**Example test:** Attempt to push directly to main without a PR/review and confirm the push is rejected by branch protection.
**Last reviewed:** 2026-08-29

### `08_Release_Engineering_Version_Control/04_artifact_integrity_provenance.md`

# Build Artifact Integrity & Provenance

## What it is
Verifying that the artifact being deployed is exactly what was built and reviewed, unaltered.

## Why it matters
Without provenance checks, a compromised build step could swap in a tampered artifact.

## Test checklist
- [ ] Build artifacts are checksummed/signed at build time
- [ ] Deployment pipeline verifies signature/checksum before deploying
- [ ] SBOM (Software Bill of Materials) generated per release
- [ ] Chain of custody from commit -> build -> artifact -> deploy is traceable

## References
- SLSA Framework (Supply-chain Levels for Software Artifacts)

**Severity:** High
**Example test:** Verify the checksum/signature of the last deployed artifact against the one produced by the build pipeline and confirm they match.
**Last reviewed:** 2026-08-29

### `08_Release_Engineering_Version_Control/05_cicd_security.md`

# CI/CD Pipeline Security

## What it is
Securing the build/release pipeline itself.

## Why it matters
A compromised pipeline can inject malicious code into every release.

## Test checklist
- [ ] Pipeline secrets stored in a vault, not plaintext config
- [ ] Build artifacts signed and verified
- [ ] Least-privilege access to pipeline configuration
- [ ] Branch protection and required review before merge to main

## References
- OWASP CI/CD Security Cheat Sheet

**Severity:** Critical
**Example test:** Check the CI/CD config for plaintext secrets and confirm all credentials are pulled from a vault/secrets manager instead.
**Last reviewed:** 2026-08-29

### `08_Release_Engineering_Version_Control/06_code_review_checklist.md`

# Security Code Review Checklist

## What it is
Personal checklist to run through during code review.

## Why it matters
Catches issues before they reach production.

## Test checklist
- [ ] Input validation present on all external input
- [ ] AuthZ checks present on every new endpoint
- [ ] No secrets or credentials in diff
- [ ] Error handling doesn't leak sensitive info

## References
- OWASP Code Review Guide

**Severity:** Medium
**Example test:** Pull the last 5 merged PRs and confirm each one's diff was checked against input validation, authZ, and no-secrets-in-diff criteria.
**Last reviewed:** 2026-08-29

### `08_Release_Engineering_Version_Control/07_changelog_release_notes.md`

# Changelog & Release Notes

## What it is
Documenting what changed in each release, including security-relevant fixes.

## Why it matters
Undocumented changes make it hard to assess risk before upgrading or to respond to incidents.

## Test checklist
- [ ] Every release has a changelog entry before deployment
- [ ] Security fixes are noted (with appropriate disclosure timing) without over-detailing exploit specifics
- [ ] Changelog is reviewed as part of the release checklist
- [ ] Rollback notes/known issues included where relevant

## References
- Keep a Changelog (keepachangelog.com)

**Severity:** Low
**Example test:** Confirm the most recent release has a changelog entry, including any security-relevant fix noted without disclosing exploit specifics.
**Last reviewed:** 2026-08-29

### `08_Release_Engineering_Version_Control/08_deprecated_version_sunset_policy.md`

# Deprecated Version & Sunset Policy

## What it is
Defining how long old API/app versions stay supported and how users are migrated off them.

## Why it matters
Indefinitely supporting old versions keeps unpatched attack surface alive.

## Test checklist
- [ ] Support lifecycle/EOL dates published for each major version
- [ ] Deprecation warnings (headers, in-app notices) surfaced ahead of sunset
- [ ] Confirm sunset versions are actually disabled, not left silently reachable
- [ ] Migration path documented for users on deprecated versions

## References
- API Deprecation best practices (Sunset HTTP header - RFC 8594)

**Severity:** Medium
**Example test:** Call a documented end-of-life API version and confirm it's actually disabled, not silently still functional.
**Last reviewed:** 2026-08-29
**See also:** `09_Release_Pipeline_Stages/08_deprecation_end_of_life.md`


---

## 09_Release_Pipeline_Stages — Release Pipeline Stages

### `09_Release_Pipeline_Stages/01_local_dev_testing.md`

# Stage 1: Local / Developer Testing

## What it is
Testing on a developer's own machine or local environment before anything is shared.

## Why it matters
Cheapest place to catch bugs and obvious security issues, before they cost more downstream.

## Test checklist
- [ ] Unit and integration tests pass locally
- [ ] Security linters/SAST run locally or in pre-commit hooks
- [ ] No real production data or credentials used locally
- [ ] Local environment config clearly separated from staging/prod

## References
- OWASP SAMM - Verification practices

**Severity:** Low
**Example test:** Confirm a fresh local dev environment setup never requires copying real production credentials or data.
**Last reviewed:** 2026-08-29

### `09_Release_Pipeline_Stages/02_internal_qa_testing.md`

# Stage 2: Internal QA Testing

## What it is
Testing by an internal team in a shared, controlled environment.

## Why it matters
Catches integration issues and regressions before any external users are exposed.

## Test checklist
- [ ] Dedicated QA environment isolated from production
- [ ] Synthetic/anonymized test data used, not real customer PII
- [ ] Manual + automated test suites executed and results recorded
- [ ] Security checklist (this whole folder) run against the QA build

## References
- ISTQB Testing Practices (as reference pattern)

**Severity:** Medium
**Example test:** Confirm the QA environment's test data is synthetic/anonymized, not a raw copy of production customer PII.
**Last reviewed:** 2026-08-29

### `09_Release_Pipeline_Stages/03_closed_beta_group_testing.md`

# Stage 3: Closed Beta / Group Testing

## What it is
Releasing to a small, known group of external or trusted users before general availability.

## Why it matters
Validates real-world usage patterns and gathers feedback while limiting exposure if something goes wrong.

## Test checklist
- [ ] Participants are known/vetted and under appropriate agreement (NDA/terms) if needed
- [ ] Feedback and bug-report channel set up and monitored actively
- [ ] Feature flags allow disabling the beta feature instantly if issues arise
- [ ] Monitoring/alerting active specifically for the beta cohort's traffic
- [ ] Clear criteria defined for 'graduating' from beta to wider rollout

## References
- Google/Microsoft beta program practices (as reference pattern)

**Severity:** Medium
**Example test:** Confirm the beta feature flag can be disabled instantly and test that toggling it off removes it from a live beta user's session.
**Last reviewed:** 2026-08-29

### `09_Release_Pipeline_Stages/04_staged_canary_rollout.md`

# Stage 4: Staged / Canary Rollout

## What it is
Gradually increasing the percentage of real production traffic hitting the new release.

## Why it matters
Limits blast radius — a bad release only affects a small slice of users before full rollout.

## Test checklist
- [ ] Rollout percentage increased in defined steps (e.g. 1% -> 10% -> 50% -> 100%)
- [ ] Automated rollback triggers defined (error rate, latency thresholds)
- [ ] Canary cohort monitored separately from the rest of production traffic
- [ ] Sufficient bake time at each stage before proceeding to the next

## References
- Google SRE Book - Canary releases

**Severity:** High
**Example test:** Confirm the automated rollback trigger (e.g. error-rate threshold) actually fires a rollback during the canary phase, not just logs a warning.
**Last reviewed:** 2026-08-29

### `09_Release_Pipeline_Stages/05_general_availability_release.md`

# Stage 5: General Availability (GA) Release

## What it is
Making the release available to 100% of users.

## Why it matters
The point of highest exposure — everything from earlier stages should already be validated.

## Test checklist
- [ ] All earlier stage criteria met and signed off
- [ ] Release communication sent to relevant stakeholders/users
- [ ] Support/on-call team briefed and ready
- [ ] Rollback plan still available even at 100% rollout

## References
- ITIL Release Management (as reference pattern)

**Severity:** Medium
**Example test:** Confirm a rollback plan and on-call briefing exist and are actionable even after reaching 100% rollout.
**Last reviewed:** 2026-08-29

### `09_Release_Pipeline_Stages/06_post_release_monitoring_support.md`

# Stage 6: Post-Release Monitoring & Support

## What it is
Actively watching the release in production and being ready to respond quickly.

## Why it matters
Most real-world issues surface only under full production load and diverse usage patterns.

## Test checklist
- [ ] Dashboards actively watched for a defined post-release window
- [ ] Support team has an escalation path for release-related issues
- [ ] Hotfix process defined and tested for critical post-release bugs
- [ ] User-reported issues are triaged with a defined SLA

## References
- Google SRE Book - Release Engineering

**Severity:** Medium
**Example test:** Confirm there is a defined SLA for triaging user-reported issues after a release and that it's actually being met on recent releases.
**Last reviewed:** 2026-08-29

### `09_Release_Pipeline_Stages/07_maintenance_patch_management.md`

# Stage 7: Maintenance & Patch Management

## What it is
Ongoing patching of the release for bugs and security vulnerabilities after GA.

## Why it matters
Software degrades in security over time as new vulnerabilities are discovered in its dependencies.

## Test checklist
- [ ] Patch cadence defined (e.g. critical CVEs patched within X days)
- [ ] Vulnerability scanning runs continuously, not just at release time
- [ ] Patch releases go through the same pipeline stages (scaled down as appropriate)
- [ ] Emergency patch process exists for actively exploited vulnerabilities

## References
- NIST SP 800-40 Patch Management Guide

**Severity:** High
**Example test:** Pick a recent critical CVE affecting a used dependency and confirm it was patched within the defined SLA window.
**Last reviewed:** 2026-08-29

### `09_Release_Pipeline_Stages/08_deprecation_end_of_life.md`

# Stage 8: Deprecation & End-of-Life

## What it is
Formally retiring an old version/feature once it's no longer safe or practical to support.

## Why it matters
The final stage of the lifecycle — closes the loop back to Q06 (sunset policy).

## Test checklist
- [ ] EOL date communicated well in advance
- [ ] Users migrated or forcibly upgraded before EOL date
- [ ] Deprecated infrastructure/endpoints actually decommissioned, not left dormant
- [ ] Post-mortem/retrospective captured for lessons learned across the full lifecycle

## References
- API Deprecation best practices (Sunset HTTP header - RFC 8594)

**Severity:** Medium
**Example test:** Confirm a recently EOL'd endpoint/feature is fully decommissioned (404/410), not left dormant and reachable.
**Last reviewed:** 2026-08-29
**See also:** `08_Release_Engineering_Version_Control/08_deprecated_version_sunset_policy.md`


---

## 10_Dependency_Supply_Chain — Dependency & Supply Chain

### `10_Dependency_Supply_Chain/01_backend_dependency_scanning.md`

# Dependency & SCA Scanning

## What it is
Tracking and scanning third-party libraries for known vulnerabilities.

## Why it matters
Most breaches originate from vulnerable dependencies, not custom code.

## Test checklist
- [ ] Automated SCA scanning in CI/CD
- [ ] SBOM generated for releases
- [ ] Policy for patching critical CVEs within SLA

## References
- OWASP Dependency-Check

**Severity:** High
**Example test:** Run the SCA scanner manually against the current backend dependency tree and confirm it matches what CI reports, with no critical CVEs unpatched past SLA.
**Last reviewed:** 2026-08-29

### `10_Dependency_Supply_Chain/02_dependency_version_pinning.md`

# Dependency Version Pinning

## What it is
Locking dependencies to exact, reviewed versions instead of open ranges.

## Why it matters
Unpinned dependencies can silently pull in a compromised or breaking new version.

## Test checklist
- [ ] Lockfiles (package-lock.json, poetry.lock, etc.) committed and enforced in CI
- [ ] Dependency updates go through review, not auto-pulled at build time
- [ ] Confirm build fails if lockfile and manifest are out of sync
- [ ] Critical security patches have an expedited update path

## References
- OWASP Dependency-Check

**Severity:** Medium
**Example test:** Delete the lockfile locally and reinstall; confirm CI fails the build if the regenerated lockfile differs from the committed one.
**Last reviewed:** 2026-08-29

### `10_Dependency_Supply_Chain/03_frontend_dependency_scanning.md`

# Frontend Dependency Scanning

## What it is
Scanning npm/yarn packages used in the UI layer for known vulnerabilities and supply-chain risk.

## Why it matters
Frontend supply-chain attacks (malicious npm packages) are a growing attack vector.

## Test checklist
- [ ] Run npm audit / yarn audit as part of CI
- [ ] Pin dependency versions and review lockfile diffs on update
- [ ] Check for typosquatted or newly-published packages before adding
- [ ] Monitor for post-install scripts in dependencies

## References
- OWASP Dependency-Check
- npm audit docs

**Severity:** Medium
**Example test:** Run npm audit / yarn audit and manually review any newly added package for typosquatting risk or suspicious post-install scripts.
**Last reviewed:** 2026-08-29


---

## 11_Logging_Monitoring — Logging & Monitoring

### `11_Logging_Monitoring/01_audit_logging.md`

# Audit Logging

## What it is
An immutable record of who did what, when, where, and with what result, across
both API calls and general system actions.

## Why it matters
Required for forensics, compliance, and incident response — and for APIs
specifically, it's the only reliable way to reconstruct who accessed or
changed what through a given endpoint.

## Test checklist
- [ ] Captures actor, action, timestamp, source IP, and result for every sensitive action (API and non-API)
- [ ] Logs are tamper-evident / write-once and stored separately with restricted write access
- [ ] Sensitive data (secrets, full PII) is redacted from log entries
- [ ] Retention period meets compliance requirements
- [ ] Regularly tested for completeness — can you fully reconstruct an incident from the logs alone?

## References
- OWASP Logging Cheat Sheet
- NIST SP 800-92

**Severity:** High
**Example test:** Perform a sensitive action (e.g. role change) and confirm the audit log captures actor, action, timestamp, source IP, and result — then try to alter that entry.
**Last reviewed:** 2026-08-29

### `11_Logging_Monitoring/02_log_injection.md`

# Log Injection (added)

## What it is
Untrusted input written into logs can forge entries or break parsers.

## Why it matters
Can be used to cover tracks or attack log analysis tooling.

## Test checklist
- [ ] Sanitize/encode user input before writing to logs
- [ ] Avoid free-text injection into structured log formats
- [ ] Test log viewer for stored XSS if logs are viewed in a UI

## References
- OWASP Log Injection reference

**Severity:** Medium
**Example test:** Submit a username or field containing newline characters and fake log-line content, then confirm it doesn't forge a fake log entry when written.
**Last reviewed:** 2026-08-29

### `11_Logging_Monitoring/03_siem_alerting.md`

# SIEM & Alerting (added)

## What it is
Centralized log aggregation and automated alerting on suspicious patterns.

## Why it matters
Turns raw logs into actionable detection.

## Test checklist
- [ ] Critical events (auth failures, privilege changes) trigger alerts
- [ ] Alert thresholds tuned to reduce noise/fatigue
- [ ] Incident response runbook linked to each alert type

## References
- MITRE ATT&CK for detection mapping

**Severity:** Medium
**Example test:** Trigger 10 failed logins for one account in a short window and confirm a SIEM alert fires with a linked response runbook.
**Last reviewed:** 2026-08-29


---

## 12_Third_Party_Integration_Vendor_Risk — Third-Party Integration & Vendor Risk

### `12_Third_Party_Integration_Vendor_Risk/01_vendor_security_assessment.md`

# Vendor Security Assessment

## What it is
Evaluating the security posture of third-party vendors before and during integration.

## Why it matters
A vendor's weak security can become your breach, especially with deep integrations or data sharing.

## Test checklist
- [ ] Security questionnaire/assessment completed before onboarding a new vendor
- [ ] Vendor's own compliance certifications (SOC 2, ISO 27001) reviewed where relevant
- [ ] Data shared with vendor is scoped to the minimum necessary
- [ ] Periodic re-assessment scheduled for critical vendors

## References
- NIST SP 800-161 Supply Chain Risk Management

**Severity:** Medium
**Example test:** Pull the most recently onboarded critical vendor's security questionnaire/SOC 2 report and confirm it was reviewed before data sharing began.
**Last reviewed:** 2026-08-29

### `12_Third_Party_Integration_Vendor_Risk/02_data_processing_agreements.md`

# Data Processing Agreements & Contracts

## What it is
Contractual terms governing how a vendor may use, store, and protect shared data.

## Why it matters
Without clear terms, there's no enforceable obligation on the vendor to protect your data.

## Test checklist
- [ ] DPA/contract in place before sharing personal or sensitive data with a vendor
- [ ] Contract specifies data handling, breach notification timelines, and deletion obligations
- [ ] Sub-processor use by the vendor is disclosed and approved
- [ ] This is a process checklist, not legal advice — involve legal/procurement

## References
- GDPR Article 28 (as reference pattern, not legal advice)

**Severity:** Medium
**Example test:** Confirm a signed DPA exists for every vendor receiving personal data, and that sub-processor disclosures are on file (consult legal for interpretation).
**Last reviewed:** 2026-08-29

### `12_Third_Party_Integration_Vendor_Risk/03_saas_integration_permission_scoping.md`

# SaaS Integration Permission Scoping

## What it is
Limiting the OAuth scopes/permissions granted to third-party SaaS tools connected to your system.

## Why it matters
Overscoped integrations turn a single compromised SaaS tool into a much bigger breach.

## Test checklist
- [ ] OAuth scopes requested/granted are the minimum needed for the integration's function
- [ ] Regularly review and revoke unused third-party app connections
- [ ] Confirm integration tokens are revocable independently without affecting other integrations
- [ ] Monitor for anomalous activity from connected third-party apps

## References
- OWASP OAuth 2.0 security guidance

**Severity:** Medium
**Example test:** Review the OAuth scopes granted to each connected third-party app and confirm none exceed what that integration actually needs.
**Last reviewed:** 2026-08-29

### `12_Third_Party_Integration_Vendor_Risk/04_third_party_integration_handling.md`

# Third-Party Integration Handling

## What it is
Validating and isolating data/requests coming from third-party services and integrations.

## Why it matters
A compromised or misbehaving third party shouldn't be able to compromise your backend.

## Test checklist
- [ ] Validate/sanitize all data received from third-party APIs before use
- [ ] Confirm third-party webhook signatures are verified (see webhook_security.md)
- [ ] Isolate third-party API keys/scopes to least privilege
- [ ] Test behavior when a third-party dependency is slow/down (timeouts, circuit breakers)

## References
- OWASP Third Party JavaScript / Integration guidance

**Severity:** High
**Example test:** Simulate a slow/failed response from a third-party API dependency and confirm your service times out gracefully instead of hanging or failing open.
**Last reviewed:** 2026-08-29

### `12_Third_Party_Integration_Vendor_Risk/05_webhook_security.md`

# Webhook Security (added)

## What it is
Securing inbound/outbound webhook calls between services.

## Why it matters
Unsigned webhooks can be spoofed to trigger unauthorized actions.

## Test checklist
- [ ] Payloads are signed and signature is verified
- [ ] Timestamps checked to prevent replay
- [ ] Endpoint validates sender identity, not just shared secret in URL
- [ ] Retries/idempotency handled safely

## References
- Stripe/GitHub webhook signing docs (as reference pattern)

**Severity:** High
**Example test:** Send a webhook payload with an invalid or missing signature and confirm the receiving endpoint rejects it rather than processing it.
**Last reviewed:** 2026-08-29
**See also:** `12_Third_Party_Integration_Vendor_Risk/04_third_party_integration_handling.md`


---

## 13_Backup_DR_Resilience — Backup, DR & Resilience

### `13_Backup_DR_Resilience/01_backup_job_monitoring.md`

# Backup & Error Logs

## What it is
Logs capturing system errors, crashes, and backup job status.

## Why it matters
Needed for reliability, debugging, and detecting silent failures.

## Test checklist
- [ ] Backup jobs log success/failure and are monitored
- [ ] Error logs don't leak sensitive data (stack traces, secrets)
- [ ] Alerting exists for repeated backup failures

## References
- OWASP Logging Cheat Sheet

**Severity:** Medium
**Example test:** Check the last 30 days of backup job logs and confirm every failure triggered an alert, not just a silent log entry.
**Last reviewed:** 2026-08-29

### `13_Backup_DR_Resilience/02_chaos_engineering_basics.md`

# Chaos Engineering Basics

## What it is
Deliberately injecting failures (killed instances, network latency, dependency outages) to test resilience.

## Why it matters
Confirms the system fails safely and recovers, rather than discovering this during a real outage.

## Test checklist
- [ ] Start with small-blast-radius experiments in non-prod before considering prod
- [ ] Define a hypothesis and success criteria before each experiment
- [ ] Confirm monitoring/alerting actually fires during the injected failure
- [ ] Document and fix weaknesses discovered, then re-test

## References
- Principles of Chaos Engineering (principlesofchaos.org)

**Severity:** Medium
**Example test:** Run a small-blast-radius experiment (e.g. kill one non-critical instance) in staging and confirm monitoring/alerting actually fires.
**Last reviewed:** 2026-08-29

### `13_Backup_DR_Resilience/03_disaster_recovery_failover_testing.md`

# Disaster Recovery / Failover Testing

## What it is
Actually executing a failover to a backup region/system, not just documenting the plan.

## Why it matters
An untested DR plan often fails in ways only discovered during a real disaster.

## Test checklist
- [ ] Full failover test executed at least annually (or per policy)
- [ ] RTO/RPO targets validated against actual failover time
- [ ] Data integrity confirmed after failover, not just availability
- [ ] Failback (returning to primary) tested as well, not just failover

## References
- NIST SP 800-34 Contingency Planning Guide

**Severity:** High
**Example test:** Execute a real failover to the backup region and measure actual RTO/RPO against the documented targets, then test failback too.
**Last reviewed:** 2026-08-29

### `13_Backup_DR_Resilience/04_backup_restore_testing.md`

# Backup Restore Testing

## What it is
Verifying backups can actually be restored successfully, not just that they complete.

## Why it matters
A backup that can't be restored provides false confidence and no real protection.

## Test checklist
- [ ] Full restore test performed periodically, not just backup job success checked
- [ ] Restored data verified for completeness and integrity
- [ ] Restore time measured against recovery time objectives
- [ ] Test restoring to an isolated environment, not overwriting production

## References
- NIST SP 800-34 Contingency Planning Guide

**Severity:** High
**Example test:** Restore the latest backup into an isolated environment and verify data completeness/integrity, not just that the restore job reported success.
**Last reviewed:** 2026-08-29

### `13_Backup_DR_Resilience/05_load_stress_testing.md`

# Load & Stress Testing

## What it is
Testing system behavior under high traffic/load, including at and beyond expected capacity.

## Why it matters
Reveals availability weaknesses that could be triggered by legitimate spikes or DoS attempts.

## Test checklist
- [ ] System tested at expected peak load with acceptable performance
- [ ] Behavior at/beyond capacity is graceful (queuing/throttling) not catastrophic failure
- [ ] Auto-scaling (if used) triggers correctly under load
- [ ] Dependent services' limits (DB connections, third-party API quotas) tested too

## References
- OWASP Testing Guide - Denial of Service testing

**Severity:** Medium
**Example test:** Load-test the system to 150% of expected peak traffic and confirm it degrades gracefully (queuing/throttling) rather than crashing outright.
**Last reviewed:** 2026-08-29

### `13_Backup_DR_Resilience/06_natural_disaster_scenarios.md`

# Natural Disaster Scenarios

## What it is
Earthquakes, floods, power outages, etc. affecting infrastructure availability.

## Why it matters
Tests business continuity and disaster recovery, not just cyber defenses.

## Test checklist
- [ ] Disaster recovery plan documented and tested (tabletop or live)
- [ ] RTO/RPO defined and validated
- [ ] Failover to secondary region tested
- [ ] Communication plan for stakeholders during outage

## References
- NIST SP 800-34 Contingency Planning Guide

**Severity:** Medium
**Example test:** Run a tabletop exercise simulating a regional outage and confirm the documented communication plan is actually followed by the team.
**Last reviewed:** 2026-08-29


---

## 14_Incident_Response_Security_Ops — Incident Response & Security Ops

### `14_Incident_Response_Security_Ops/01_bug_bounty_responsible_disclosure.md`

# Bug Bounty & Responsible Disclosure

## What it is
A defined program/process for external researchers to report vulnerabilities safely.

## Why it matters
Without a clear channel, researchers may disclose publicly before you can fix it, or not report at all.

## Test checklist
- [ ] security.txt or equivalent published with a clear reporting contact
- [ ] Defined response SLA for acknowledging reports
- [ ] Safe-harbor policy for good-faith researchers
- [ ] Process to track reported issues through to fix and disclosure

## References
- RFC 9116 security.txt
- disclose.io responsible disclosure guidelines

**Severity:** Medium
**Example test:** Fetch https://yourdomain.com/.well-known/security.txt and confirm it publishes a working contact and safe-harbor statement.
**Last reviewed:** 2026-08-29

### `14_Incident_Response_Security_Ops/02_manmade_adversarial_scenarios.md`

# Man-Made / Adversarial Scenarios

## What it is
DDoS, insider threats, ransomware, supply-chain compromise, phishing.

## Why it matters
Simulates realistic attacker behavior to validate detection and response.

## Test checklist
- [ ] Run tabletop exercise for a ransomware scenario
- [ ] Test detection of insider threat (unusual data access patterns)
- [ ] Test phishing simulation and measure click/report rate
- [ ] Validate supply-chain dependency scanning (SBOM)

## References
- MITRE ATT&CK Framework

**Severity:** Medium
**Example test:** Run a phishing simulation against staff and measure the click-through and report rate against your baseline target.
**Last reviewed:** 2026-08-29

### `14_Incident_Response_Security_Ops/03_red_team_purple_team_exercises.md`

# Red Team / Purple Team Exercises

## What it is
Simulated adversarial exercises (red team attacks, purple team collaborative testing) against the live system/org.

## Why it matters
Tests real detection and response capability, not just individual technical controls.

## Test checklist
- [ ] Scope and rules of engagement agreed in writing before starting
- [ ] Detection/response team's performance measured (were they alerted? how fast?)
- [ ] Findings feed back into both technical fixes and process improvements
- [ ] Exercise conducted periodically, not as a one-time event

## References
- MITRE ATT&CK Framework
- NIST SP 800-115

**Severity:** High
**Example test:** Run a scoped red-team exercise with written rules of engagement and measure how quickly the detection/response team noticed and reacted.
**Last reviewed:** 2026-08-29

### `14_Incident_Response_Security_Ops/04_incident_response.md`

# Incident Response Drill (added)

## What it is
Structured process for detecting, containing, and recovering from an incident.

## Why it matters
Untested IR plans fail under real pressure.

## Test checklist
- [ ] IR plan has clear roles and escalation path
- [ ] Communication templates prepared in advance
- [ ] Post-incident review process defined

## References
- NIST SP 800-61 Computer Security Incident Handling Guide

**Severity:** High
**Example test:** Run a tabletop IR drill for a plausible scenario (e.g. leaked API key) and confirm every role knows their escalation step without looking it up.
**Last reviewed:** 2026-08-29

### `14_Incident_Response_Security_Ops/05_sast_dast_tooling_integration.md`

# SAST/DAST Tooling Integration

## What it is
Automated static and dynamic application security testing integrated into CI/CD.

## Why it matters
Automation catches common issues continuously instead of relying only on periodic manual review.

## Test checklist
- [ ] SAST scans run on every PR/commit, not just occasionally
- [ ] DAST scans run against staging before production release
- [ ] Findings are triaged with clear severity-based SLAs
- [ ] False positive rate managed so alerts aren't ignored over time

## References
- OWASP DevSecOps Guideline

**Severity:** Medium
**Example test:** Confirm the last 10 PRs all triggered a SAST scan, and that staging received a DAST scan before its most recent production release.
**Last reviewed:** 2026-08-29

### `14_Incident_Response_Security_Ops/06_security_awareness_training.md`

# Security Awareness Training

## What it is
Ongoing training for developers and staff on secure practices and current threats.

## Why it matters
Many breaches originate from human error (phishing, misconfiguration) rather than novel technical exploits.

## Test checklist
- [ ] Developers trained on secure coding relevant to their stack
- [ ] All staff trained on phishing/social engineering recognition
- [ ] Training refreshed periodically, not a one-time onboarding item
- [ ] Incident post-mortems feed back into training content

## References
- OWASP SAMM - Education & Guidance

**Severity:** Low
**Example test:** Confirm every engineer completed secure-coding training within the last 12 months and that a recent incident's lessons were folded into the material.
**Last reviewed:** 2026-08-29

### `14_Incident_Response_Security_Ops/07_vulnerability_management_sla.md`

# Vulnerability Management SLA

## What it is
Defined timelines for triaging and remediating vulnerabilities based on severity.

## Why it matters
Without SLAs, critical vulnerabilities can linger unpatched indefinitely.

## Test checklist
- [ ] Severity levels defined (e.g. CVSS-based) with matching remediation SLAs
- [ ] Vulnerability tracking system in place (not just email threads)
- [ ] SLA compliance measured and reported regularly
- [ ] Escalation path exists for SLA breaches on critical findings

## References
- NIST SP 800-40 Patch Management Guide

**Severity:** High
**Example test:** Pull open vulnerabilities from the tracker and confirm none of Critical/High severity are past their defined remediation SLA.
**Last reviewed:** 2026-08-29


---

## 15_Architecture_Compliance — Architecture & Compliance

### `15_Architecture_Compliance/01_privacy_by_design.md`

# Privacy by Design

## What it is
Building privacy protections into the system architecture from the start, not bolted on later.

## Why it matters
Retrofitting privacy controls is expensive and error-prone compared to designing for it upfront.

## Test checklist
- [ ] Data minimization applied (collect only what's needed)
- [ ] Default settings favor privacy (opt-in over opt-out for data sharing)
- [ ] Privacy impact considered during design/threat modeling, not just at launch
- [ ] Data flows documented end-to-end

## References
- Privacy by Design framework (Cavoukian)

**Severity:** Medium
**Example test:** Review the most recent feature's design doc and confirm data collection was scoped to only what the feature actually needs.
**Last reviewed:** 2026-08-29

### `15_Architecture_Compliance/02_threat_modeling.md`

# Threat Modeling

## What it is
Systematically identifying threats, trust boundaries, and mitigations before/while building.

## Why it matters
Finds design-level flaws that testing alone won't catch.

## Test checklist
- [ ] Data flow diagram created for the system
- [ ] Trust boundaries identified
- [ ] STRIDE (or similar) analysis performed
- [ ] Mitigations tracked to closure

## References
- OWASP Threat Modeling
- Microsoft STRIDE

**Severity:** High
**Example test:** Pull the data-flow diagram for the highest-risk service and confirm a STRIDE (or equivalent) pass was actually performed and mitigations tracked to closure.
**Last reviewed:** 2026-08-29

### `15_Architecture_Compliance/03_consent_management.md`

# Consent Management

## What it is
Capturing, storing, and honoring user consent for data collection and processing.

## Why it matters
Missing or mishandled consent creates legal exposure and user trust issues.

## Test checklist
- [ ] Consent is captured explicitly, not pre-checked/implied
- [ ] Consent records are stored with timestamp and version of policy agreed to
- [ ] Users can withdraw consent and the system honors it promptly
- [ ] Consent is granular where required (e.g. marketing vs functional data use)

## References
- GDPR Article 7 (as reference pattern, not legal advice)

**Severity:** Medium
**Example test:** Attempt to withdraw consent for a non-essential data use as a test user and confirm the system actually stops that use promptly.
**Last reviewed:** 2026-08-29

### `15_Architecture_Compliance/04_defense_in_depth.md`

# Defense in Depth

## What it is
Layering multiple independent security controls so no single failure is catastrophic.

## Why it matters
Reduces blast radius when one control fails.

## Test checklist
- [ ] Network, application, and data layer controls all present
- [ ] No single point of failure for critical protections
- [ ] Compensating controls documented per layer

## References
- NIST Defense in Depth strategy

**Severity:** Medium
**Example test:** Pick one critical asset and map every independent control protecting it; confirm there isn't a single point whose failure alone exposes it.
**Last reviewed:** 2026-08-29

### `15_Architecture_Compliance/05_regulatory_compliance_mapping.md`

# Regulatory Compliance Mapping

## What it is
Identifying which regulations apply (GDPR, HIPAA, PCI-DSS, SOC 2, etc.) and mapping controls to them.

## Why it matters
Testing without knowing applicable regulations risks missing legally required controls.

## Test checklist
- [ ] Applicable regulations identified based on data type/user location/industry
- [ ] Controls mapped to specific regulatory requirements
- [ ] Gaps tracked with an owner and remediation timeline
- [ ] This is a starting checklist, not legal advice — confirm with qualified counsel/compliance staff

## References
- Relevant regulation text (GDPR, HIPAA, PCI-DSS, SOC 2) - consult legal counsel

**Severity:** Medium
**Example test:** Confirm each applicable regulation (GDPR/HIPAA/PCI-DSS/etc.) has specific controls mapped to it with an owner (not legal advice — confirm interpretation with counsel).
**Last reviewed:** 2026-08-29

### `15_Architecture_Compliance/06_zero_trust_network.md`

# Zero Trust Network Architecture

## What it is
Never trust, always verify — no implicit trust based on network location.

## Why it matters
Limits lateral movement if perimeter is breached.

## Test checklist
- [ ] Micro-segmentation implemented between services
- [ ] Every request authenticated/authorized regardless of network origin
- [ ] Least-privilege network policies enforced

## References
- NIST SP 800-207 Zero Trust Architecture

**Severity:** High
**Example test:** From inside the internal network, attempt to reach a service without presenting valid per-request authentication and confirm it's still denied.
**Last reviewed:** 2026-08-29

### `15_Architecture_Compliance/07_data_subject_rights_handling.md`

# Data Subject Rights Handling

## What it is
Supporting user rights to access, correct, export, or delete their data.

## Why it matters
Many privacy regulations legally require these capabilities to exist and function correctly.

## Test checklist
- [ ] Data export functionality returns complete and accurate user data
- [ ] Deletion requests actually remove data from backups/logs within defined timeframes, not just the primary DB
- [ ] Process exists to verify the requester's identity before fulfilling requests
- [ ] Requests are tracked and fulfilled within regulatory time limits

## References
- GDPR Articles 15-17 (as reference pattern, not legal advice)

**Severity:** High
**Example test:** Submit a test data-deletion request and confirm the data is actually removed from backups/logs within the promised timeframe, not just the primary DB.
**Last reviewed:** 2026-08-29

### `15_Architecture_Compliance/08_secure_sdlc.md`

# Secure SDLC (added)

## What it is
Integrating security activities across the software development lifecycle.

## Why it matters
Cheaper to fix issues at design/code time than after production release.

## Test checklist
- [ ] Security requirements defined at design phase
- [ ] SAST/DAST integrated in CI/CD
- [ ] Dependency scanning (SCA) automated
- [ ] Security review gate before production release

## References
- OWASP SAMM (Software Assurance Maturity Model)

**Severity:** Medium
**Example test:** Confirm the most recent feature had security requirements defined at design time, not bolted on after code review.
**Last reviewed:** 2026-08-29


---

## 16_Edge_CDN_Security — Edge / CDN Security

### `16_Edge_CDN_Security/01_waf_rules.md`

# Cloudflare WAF Rules

## What it is
Web Application Firewall rules filtering malicious traffic at the edge.

## Why it matters
First line of defense before traffic hits origin servers.

## Test checklist
- [ ] Managed rulesets enabled and tuned
- [ ] Custom rules cover app-specific attack patterns
- [ ] Rules tested in 'log' mode before enforcing 'block'
- [ ] Rate limiting rules configured for sensitive endpoints

## References
- Cloudflare WAF documentation

**Severity:** High
**Example test:** Send a known attack pattern (e.g. a basic SQLi string) through the WAF in log mode first, confirm detection, then verify it's actually blocked once enforced.
**Last reviewed:** 2026-08-29

### `16_Edge_CDN_Security/02_ddos_protection.md`

# DDoS Protection

## What it is
Mitigating volumetric and application-layer denial-of-service attacks.

## Why it matters
Downtime from DDoS directly impacts availability and revenue.

## Test checklist
- [ ] L3/L4 and L7 protections both enabled
- [ ] Under-attack mode tested
- [ ] Origin IP is not directly exposed/bypassable

## References
- Cloudflare DDoS documentation

**Severity:** High
**Example test:** Confirm the true origin IP isn't discoverable/reachable directly, bypassing the CDN/DDoS layer entirely.
**Last reviewed:** 2026-08-29

### `16_Edge_CDN_Security/03_bot_management.md`

# Bot Management

## What it is
Distinguishing and controlling automated traffic (good bots vs malicious bots).

## Why it matters
Prevents scraping, credential stuffing, and inventory hoarding.

## Test checklist
- [ ] Bot score thresholds tuned per endpoint
- [ ] Test credential stuffing simulation against login endpoint
- [ ] Allowlist legitimate bots (search engines, monitoring)

## References
- Cloudflare Bot Management documentation

**Severity:** Medium
**Example test:** Run a scripted login-attempt simulation against the login endpoint and confirm the bot-management layer flags/blocks it before it reaches the app.
**Last reviewed:** 2026-08-29

### `16_Edge_CDN_Security/04_cdn_caching_authenticated_content.md`

# CDN Caching of Authenticated Content

## What it is
Preventing personalized or authenticated responses from being cached and served to other users.

## Why it matters
Misconfigured CDN caching can leak one user's private data to another user entirely.

## Test checklist
- [ ] Confirm Cache-Control: private / no-store is set on authenticated responses
- [ ] Test that CDN doesn't cache responses varying by Authorization/Cookie header incorrectly
- [ ] Confirm Vary header is set correctly for personalized content
- [ ] Test by requesting the same URL as two different authenticated users through the CDN

## References
- OWASP Cache Deception guidance

**Severity:** Critical
**Example test:** Request the same authenticated URL as two different logged-in users through the CDN and confirm User B never sees User A's cached response.
**Last reviewed:** 2026-08-29
**See also:** `16_Edge_CDN_Security/05_cache_poisoning.md`

### `16_Edge_CDN_Security/05_cache_poisoning.md`

# Web Cache Poisoning

## What it is
Manipulating cache keys (headers, query params) to serve a malicious response to other users.

## Why it matters
A single poisoned cache entry can serve an attack payload to every subsequent visitor.

## Test checklist
- [ ] Test unkeyed headers (e.g. X-Forwarded-Host) for influence on cached response content
- [ ] Confirm cache key includes all inputs that affect the response
- [ ] Test parameter cloaking / cache-busting parameter behavior
- [ ] Review CDN/reverse proxy cache configuration for default unsafe behaviors

## References
- PortSwigger Web Cache Poisoning research

**Severity:** Critical
**Example test:** Send a request with an unusual header (e.g. X-Forwarded-Host: evil.com) and confirm it can't influence what gets cached and served to other visitors.
**Last reviewed:** 2026-08-29

### `16_Edge_CDN_Security/06_zero_trust_access.md`

# Cloudflare Zero Trust / Access

## What it is
Identity-aware access proxy for internal apps and networks.

## Why it matters
Removes reliance on flat VPN trust models.

## Test checklist
- [ ] Access policies scoped per-application, per-identity
- [ ] MFA enforced at the Access layer
- [ ] Session duration and re-auth policy tested

## References
- Cloudflare Zero Trust documentation

**Severity:** Medium
**Example test:** Attempt to reach an internal app through the Zero Trust proxy without a valid per-app identity policy match and confirm access is denied.
**Last reviewed:** 2026-08-29


---

## 17_DNS_Email_Domain_Security — DNS, Email & Domain Security

### `17_DNS_Email_Domain_Security/01_dnssec.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# DNSSEC

## What it is
Cryptographically signing DNS records to prevent spoofing/cache poisoning of DNS responses.

## Why it matters
Without it, attackers can potentially redirect your domain's traffic via DNS manipulation.

## Test checklist
- [ ] Confirm DNSSEC is enabled on the domain where supported by the registrar/DNS provider
- [ ] Test DNSSEC validation chain resolves correctly
- [ ] Monitor for DNSSEC validation failures/misconfiguration

## References
- NIST SP 800-81 DNSSEC guidance

**Severity:** Medium
**Example test:** Run a DNSSEC validation check (e.g. via a public DNSSEC debugger) against the domain and confirm the chain resolves without validation errors.
**Last reviewed:** 2026-08-29

### `17_DNS_Email_Domain_Security/02_spf_dkim_dmarc.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# SPF, DKIM & DMARC

## What it is
Email authentication standards that prevent spoofed emails from appearing to come from your domain.

## Why it matters
Missing these lets attackers send convincing phishing emails impersonating your organization.

## Test checklist
- [ ] SPF record published and correctly scoped to actual sending sources
- [ ] DKIM signing enabled for outgoing mail
- [ ] DMARC policy set (start at monitor, move toward reject) and reports reviewed
- [ ] Test with an online email authentication checker

## References
- dmarc.org
- RFC 7489 DMARC

**Severity:** High
**Example test:** Send a test email through an online authentication checker and confirm SPF, DKIM, and DMARC all pass and align.
**Last reviewed:** 2026-08-29

### `17_DNS_Email_Domain_Security/03_subdomain_takeover.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Subdomain Takeover (added)

## What it is
A DNS record points to a third-party service (e.g. cloud storage, SaaS) that's no longer claimed, letting an attacker claim it.

## Why it matters
Allows attackers to serve content from a trusted subdomain of your own domain.

## Test checklist
- [ ] Audit all DNS CNAME/records pointing to third-party services
- [ ] Remove DNS records for decommissioned third-party services immediately
- [ ] Periodically scan for dangling DNS entries
- [ ] Test claiming decommissioned service endpoints in a controlled way before attackers do

## References
- OWASP Subdomain Takeover guidance

**Severity:** Critical
**Example test:** Audit every CNAME record pointing at a third-party service and confirm none point to a deprovisioned/unclaimed resource that could be claimed by an attacker.
**Last reviewed:** 2026-08-29

### `17_DNS_Email_Domain_Security/04_certificate_transparency_monitoring.md`

> **Authorization reminder:** Only run these checks against systems you own or have explicit written permission to test. Prefer staging/QA over production — several checks here (injection probes, IAM changes, DNS record edits) can have live side effects.


# Certificate Transparency Monitoring

## What it is
Monitoring public CT logs for TLS certificates issued for your domains.

## Why it matters
Detects unauthorized or unexpected certificate issuance (potential impersonation) early.

## Test checklist
- [ ] Monitoring set up against CT logs (e.g. crt.sh or a CT monitoring service)
- [ ] Alerting configured for certificates issued for your domain outside known processes
- [ ] Process defined to respond to unauthorized certificate issuance (revocation request)

## References
- Certificate Transparency project (certificate.transparency.dev)

**Severity:** Medium
**Example test:** Query crt.sh for the domain and confirm every listed certificate maps to a known, authorized issuance process.
**Last reviewed:** 2026-08-29


---

## 18_Mobile_App_Security — Mobile App Security

### `18_Mobile_App_Security/01_certificate_pinning.md`

# Certificate Pinning (Mobile)

## What it is
Hardcoding expected TLS certificate/public key in the mobile app to prevent MITM via rogue/compromised CAs.

## Why it matters
Without pinning, a compromised CA or installed rogue cert can intercept 'secure' app traffic.

## Test checklist
- [ ] Confirm pinning is implemented for sensitive API calls
- [ ] Test app behavior when presented with an untrusted/rogue certificate
- [ ] Confirm a safe pin-rotation process exists (to avoid bricking the app on cert renewal)

## References
- OWASP Mobile Application Security Testing Guide (MASTG)

**Severity:** High
**Example test:** Intercept app traffic with a proxy presenting a non-pinned trusted certificate and confirm the app refuses to connect.
**Last reviewed:** 2026-08-29

### `18_Mobile_App_Security/02_secure_local_storage_mobile.md`

# Secure Local Storage (Mobile)

## What it is
Storing sensitive data (tokens, credentials, PII) using platform-secure storage (Keychain/Keystore).

## Why it matters
Data stored in plain files/shared prefs can be extracted from a rooted/jailbroken or backed-up device.

## Test checklist
- [ ] Sensitive data stored via Keychain (iOS) / Keystore (Android), not plain files/SharedPreferences
- [ ] Confirm data isn't included in unencrypted device/cloud backups
- [ ] Test extracting app data from a rooted/jailbroken device

## References
- OWASP MASTG - Data Storage

**Severity:** High
**Example test:** Pull app data off a rooted/jailbroken test device and confirm tokens/PII aren't sitting in plaintext files or SharedPreferences.
**Last reviewed:** 2026-08-29

### `18_Mobile_App_Security/03_jailbreak_root_detection.md`

# Jailbreak / Root Detection

## What it is
Detecting when the app is running on a compromised (jailbroken/rooted) device.

## Why it matters
Rooted devices bypass OS-level protections the app may rely on.

## Test checklist
- [ ] Confirm detection is in place for common root/jailbreak indicators
- [ ] Define and test the app's response (warn vs restrict sensitive features)
- [ ] Test detection isn't trivially bypassed by common hiding tools

## References
- OWASP MASTG - Anti-Reversing

**Severity:** Medium
**Example test:** Run the app on a rooted/jailbroken device with a common detection-bypass tool active and confirm the app's protection still triggers or degrades safely.
**Last reviewed:** 2026-08-29

### `18_Mobile_App_Security/04_mobile_api_key_protection.md`

# Mobile API Key / Secret Protection

## What it is
Protecting API keys and secrets embedded in a distributed mobile app binary.

## Why it matters
Anything shipped in the app binary can be extracted by a determined attacker.

## Test checklist
- [ ] Confirm high-privilege secrets are never embedded in the mobile binary
- [ ] Use short-lived tokens issued by a backend, not long-lived static keys in-app
- [ ] Test extracting strings/secrets from the compiled app binary
- [ ] Confirm backend-issued tokens are scoped narrowly per mobile session

## References
- OWASP MASTG - Code Quality and Build Settings

**Severity:** High
**Example test:** Decompile/extract strings from the shipped app binary and confirm no high-privilege static API key or secret is embedded.
**Last reviewed:** 2026-08-29


---

## 19_Security_Checklists — Security Checklists (Reference Rollups)

### `19_Security_Checklists/01_owasp_top10_checklist.md`

# OWASP Top 10 Checklist

## What it is
Reference checklist mapping tests to the OWASP Top 10 web risks.

## Why it matters
Provides a widely recognized baseline for web app security testing.

## Test checklist
- [ ] Broken Access Control tested
- [ ] Cryptographic Failures tested
- [ ] Injection tested
- [ ] Insecure Design reviewed
- [ ] Security Misconfiguration tested
- [ ] Vulnerable & Outdated Components scanned
- [ ] Identification & Authentication Failures tested
- [ ] Software & Data Integrity Failures tested
- [ ] Security Logging & Monitoring Failures tested
- [ ] SSRF tested

## References
- owasp.org/Top10

**Severity:** Reference
**Example test:** Use this as a coverage tracker after running folders 01-18 — check off each OWASP Top 10 category once its dedicated checklist items have been executed.
**Last reviewed:** 2026-08-29

### `19_Security_Checklists/02_api_security_checklist.md`

# OWASP API Security Top 10 Checklist

## What it is
Checklist specific to API-shaped attack surface.

## Why it matters
APIs have distinct risk patterns from traditional web apps.

## Test checklist
- [ ] Broken Object Level Authorization (BOLA) tested
- [ ] Broken Authentication tested
- [ ] Broken Object Property Level Authorization tested
- [ ] Unrestricted Resource Consumption tested
- [ ] Broken Function Level Authorization tested
- [ ] Server-Side Request Forgery tested
- [ ] Security Misconfiguration tested
- [ ] Improper Inventory Management tested

## References
- owasp.org/API-Security

**Severity:** Reference
**Example test:** Use this as a coverage tracker after running folder 01 (API_Security) and relevant items from 02/03 — confirm each OWASP API Top 10 category is addressed.
**Last reviewed:** 2026-08-29

### `19_Security_Checklists/03_pentest_checklist.md`

# Penetration Test Checklist (added)

## What it is
General structure for conducting an application penetration test.

## Why it matters
Keeps testing consistent, repeatable, and complete.

## Test checklist
- [ ] Scope and rules of engagement defined
- [ ] Recon and information gathering completed
- [ ] Authenticated + unauthenticated testing both performed
- [ ] Findings documented with severity and reproduction steps
- [ ] Retest performed after fixes

## References
- PTES - Penetration Testing Execution Standard

**Severity:** Reference
**Example test:** Use this as the top-level structure for any full engagement: confirm scope/RoE are signed before folder-by-folder testing begins.
**Last reviewed:** 2026-08-29
