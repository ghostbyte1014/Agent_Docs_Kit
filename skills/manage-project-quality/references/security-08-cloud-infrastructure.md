# Cloud Infrastructure

# Phase 8: Cloud Infrastructure & Deployment

**When to run this:** Before first deploying to a new environment, and periodically thereafter for drift.

**Goal of this pass:** Confirm IAM, network, storage, and container configuration follow least privilege and don't expose more than intended.

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
- Total items in this phase: 11

---

# What to Check — Phase 8: Cloud Infrastructure & Deployment

Reference checklist only — no result columns. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a test pass.

| # | Source file | Item | Severity | Example test |
|---|---|---|---|---|
| 1 | `07_Cloud_Infra_Deployment/01_environment_separation.md` | Environment Separation | Critical | Attempt to reach the staging environment unauthenticated from the public internet and confirm it requires auth or is not publicly indexable. |
| 2 | `07_Cloud_Infra_Deployment/02_iam_policy_review.md` | Cloud IAM Policy Review | Critical | Export all IAM policies and grep for '*:*' or overly broad wildcard actions/resources; confirm each is justified or scoped down. |
| 3 | `07_Cloud_Infra_Deployment/03_blue_green_canary_rollback.md` | Blue-Green / Canary Deployment & Rollback | High | Trigger a rollback in staging and time how long it takes to reach the previous stable version; compare against your defined rollback-time target. |
| 4 | `07_Cloud_Infra_Deployment/04_container_k8s_security.md` | Container Orchestration (Kubernetes) Security | High | Run 'kubectl auth can-i --list' as a low-privilege service account and confirm it cannot perform cluster-admin-level actions. |
| 5 | `07_Cloud_Infra_Deployment/05_cloud_storage_misconfig.md` | Cloud Storage Misconfiguration | Critical | List every storage bucket/container and confirm none allow anonymous public read/write except explicitly intended public assets. |
| 6 | `07_Cloud_Infra_Deployment/06_infra_as_code_scanning.md` | Infrastructure-as-Code Scanning | High | Run an IaC scanner (e.g. tfsec/Checkov) against the current Terraform/CloudFormation config and confirm zero unresolved high/critical findings. |
| 7 | `07_Cloud_Infra_Deployment/07_container_image_security.md` | Container Image Security | High | Run a CVE scanner (e.g. Trivy/Grype) against the production container image and confirm no unpatched critical CVEs, and that it isn't tagged 'latest'. |
| 8 | `07_Cloud_Infra_Deployment/08_network_segmentation_cloud.md` | Cloud Network Segmentation | High | From a low-trust workload/VPC, attempt to reach a sensitive internal service directly and confirm network policy blocks it. |
| 9 | `07_Cloud_Infra_Deployment/09_post_deploy_monitoring.md` | Post-Deployment Monitoring | Medium | During the next deploy, confirm an on-call owner is actively watching error-rate/latency dashboards for the defined post-deploy window. |
| 10 | `07_Cloud_Infra_Deployment/10_feature_flag_safety.md` | Feature Flags & Kill Switches | Medium | Toggle a high-risk feature flag off in staging and confirm the code path is actually disabled immediately, not just hidden in the UI. |
| 11 | `07_Cloud_Infra_Deployment/11_deploy_pipeline_iam_scoping.md` | Least-Privilege IAM for Deployment | Critical | Inspect the CI/CD service account's IAM role and confirm a staging-deploy credential cannot touch production resources. |
