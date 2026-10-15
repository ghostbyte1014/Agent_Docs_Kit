# PRE_BETA_IMPACT_AUDIT.md

> Historical status: this report records the pre-implementation assessment that preceded the `6.0.0` release candidate. Some findings described below were subsequently implemented. Use the current source, changelog, tests, and dated validation evidence to determine release readiness; do not treat this document as a current pass or security certification.

## Executive summary

This report audits `AGENT_DOCS_KIT_PRE_BETA_REFINEMENT.md` against the checked-out Agent Docs & Quality Kit repository. It is an impact assessment only; no product code, documentation, configuration, tests, dependencies, generated output, deployment, or release state was changed.

### Recommendation: CONDITIONAL GO

Proceed with a small, controlled pre-beta patch, but do **not** approve the current checkout for closed-beta release yet. The proposed direction is compatible with the existing architecture and does not require a redesign. Release should remain blocked until the following conditions are met:

1. Correct `next` so it advances only from a recognized, applicable, passing documentation audit; malformed, failing, unknown, and superseded results must fail closed.
2. Close the adjacent worksheet-state gap: `next` currently treats a worksheet as complete when the literal `Unverified` text disappears, even if statuses or evidence are invalid.
3. Have the owner confirm the canonical host and whether GitHub Pages remains a mirror. Then align package metadata, the `website` command, public copy, canonical metadata, and the privacy notice.
4. Clarify the automation boundary in the homepage and README before inviting inexperienced testers.
5. Run the full release gate, packed-consumer smoke test, cross-platform CI, manual accessibility/mobile checks, and live-host verification after implementation.

The highest-confidence findings are:

- **Confirmed correctness defect:** `src/commands/workflow.mjs:181-192` uses the existence of any regular file in `documentationReports` as evidence that documentation is audited. It never parses the result or chooses the newest applicable audit.
- **Confirmed adjacent correctness defect:** `src/commands/workflow.mjs:193-227` determines whether security/engineering work is open only by searching for `Unverified`. An invalid `Pass` edit can therefore advance to Stage 6. The existing lifecycle test at `tests/cli.test.mjs:90-92` demonstrates this by replacing every `Unverified` string with `Pass` without adding valid ownership or verification evidence.
- **Confirmed URL/privacy inconsistency:** `package.json:57`, `src/commands/website.mjs:3`, and `site/index.html:384` use GitHub Pages, while the refinement brief identifies Cloudflare as primary and the current branch contains `wrangler.jsonc`. `site/privacy.html:30` states that the site is hosted by GitHub Pages only.
- **Onboarding is present but not novice-first:** the CLI already has four `start` paths, read-only `next`, `setup --dry-run`, and explicit write boundaries. However, `README.md:17-32` presents a long command catalog before the four-path onboarding section and does not provide the proposed safe three-step path or an authentic example.
- **Website boundaries are partial:** the site has strong evidence and authorization language, but the hero still leads with the abstract tagline, the documentation card can imply semantic verification, and release-blocking copy can imply enforcement by the package.
- **Safety/release infrastructure is substantial:** zero runtime dependencies, no install hooks, explicit file ownership, collision-safe reports, project-relative path validation, an npm allowlist, a packed-installation smoke script, and a 3-OS/3-Node CI matrix already exist. These should be preserved, not redesigned.

### Scope and evidence limits

- Baseline before creating this report: clean `fix/cloudflare-static-assets` branch at commit `a138615fc2117b8e519b38e944c218df47625706`, dated 2026-10-14.
- Package metadata version: `5.1.0` in both `package.json` and `package-lock.json`.
- This branch differs from `origin/main` in `.gitignore`, `package.json`, `package-lock.json`, and the new `wrangler.jsonc`; the Cloudflare configuration is therefore branch-specific until merged.
- A local ignored legacy text audit exists at `docs/audits/2026-10-14-documentation.txt`. It is a genuine passing report, but it has no explicit overall result or embedded timestamp. The current `next` command counted it only because it is a regular file.
- Read-only checks run during this audit passed: `npm.cmd run validate`, `npm.cmd run review:dates`, CLI help/version/doctor/start/next, and a non-reporting strict documentation audit.
- `npm ci`, `npm test`, builds, package smoke tests, `npm audit`, `npm pack`, browser launch, deployments, and publishing were intentionally not run because they install dependencies, write build/cache/fixture artifacts, perform external operations, or exceed this audit's read-only restriction.
- Both public website URLs were attempted through the available read-only web verifier, but neither was accessible through that verifier. Live availability, redirects, hosting headers, deployed revision, analytics added outside the repository, and parity between hosts remain **unverified and require external validation**.

## Current codebase findings

### Architecture and command surface

The architecture already matches the product boundaries the brief asks to preserve:

| Layer | Current implementation | Finding |
|---|---|---|
| CLI/API | ESM CLI in `bin/` and `src/cli/`; command modules in `src/commands/`; public exports in `src/api/index.mjs` | Cohesive and small; no redesign is necessary. |
| Configuration and file safety | `src/core/config.mjs` validates project-relative paths and linked ancestors; `src/core/files.mjs` provides exclusive, atomic, collision-safe writes | Strong foundation. Preserve default skip behavior, `--dry-run`, `--force`, and symlink/path containment. |
| Canonical content | `content/catalog.json` and 33 focused Markdown sources | Verified by read-only validation as 7 documentation areas, 12 security phases, and 14 engineering topics. |
| Agent integration | Progressive skill under `skills/manage-project-quality/` with protocols, report assets, generated references, and a report checker | Evidence-first instructions already exist. Compatibility is concrete for the packaged OpenAI/Codex metadata; support by other agents depends on their repository-skill behavior. |
| Website | Dependency-free static HTML/CSS/JS under `site/`; `scripts/build-site.mjs` creates `build/site` and renders approved docs | Suitable for the proposed copy and accessibility refinements without a framework. |
| Distribution | Scoped npm package with `agent-docs` binary, public API export, explicit `files`, MIT license, Node `>=22` | Stable public surface; proposed work can remain patch-compatible. |
| Validation/release | Node tests, content/link checks, review-date check, site/skill builds, packed-consumer smoke, npm audit, CI matrix, tag publishing | Good release design, but the full gate was not executed in this audit. |
| Hosting | Automatic GitHub Pages workflow plus branch-local Cloudflare static-assets configuration | Dual-host intent is plausible but not documented or externally verified. |

The four onboarding paths are implemented in `src/commands/workflow.mjs:8-64`; `start` and `next` are exposed through `src/cli/main.mjs:77-83`; legacy security/engineering aliases are retained at `src/cli/main.mjs:95-101`. The package public API exports the workflow, audit, setup, template, skill, config, catalog, and website functions without exposing internal file helpers.

### Existing safety properties

The following proposal assumptions are already implemented and do not need feature work:

- No `preinstall`, `install`, or `postinstall` script exists. `prepublishOnly` runs the release gate only during publication preparation.
- There are no runtime dependencies. The current branch adds only the pinned Wrangler development dependency.
- `setup` writes a fixed owned scaffold, skips existing files by default, previews with `--dry-run`, and replaces only those owned paths under explicit `--force`.
- Reports and templates use exclusive collision-safe filenames; forced file replacement is staged and restored on failure.
- Project-configured roots must remain inside the selected project, including through the nearest existing symlink ancestor.
- Security and engineering worksheets start as `Unverified` and include evidence, remediation/recommendation, owner, and verification fields.
- Active security testing authorization is repeatedly required by the skill, site, terms, generated worksheets, and security documentation.
- The catalog and progressive references are validated for count, stable IDs, freshness, and one-H1 structure.
- The package smoke script builds a tarball manifest, rejects local docs and generated data, installs into a temporary consumer, exercises the binary and API, and validates generated worksheets.

These properties need regression coverage after the proposed changes; they should not be reimplemented.

### Current gaps and contradictions

1. **`next` documentation state is not evidence-based.** `regularFiles()` includes any non-`.gitkeep` file recursively. Stage 4 ends as soon as the returned array is non-empty. A failed `.md`, failed `.json`, empty file, unrelated file, or newer failure after an older pass all advance.
2. **`next` worksheet state is also lexical rather than validated.** It looks only for `Overall status: Unverified` or a table cell containing `Unverified`. It does not call `validateReport`, verify evidence/owner/verification, recognize invalid statuses, or reconcile overall and row statuses.
3. **The report formats are not equally suitable for progress detection.** JSON has `checkedAt`, `pass`, and checks. Markdown has `Checked`, `Result`, and rows. Text has only individual `PASS`/`FAIL` rows and no embedded timestamp or overall result. A compatibility policy is required.
4. **The site and README overstate some boundaries in context.** `site/index.html:151` describes checks such as scope/architecture drift that the structural CLI audit cannot establish by itself. `README.md:15`, `site/index.html:166`, `docs/PURPOSE.md:21`, and shipped skill/security references say failures block release without consistently saying that a separately enforced policy or CI gate must act on the result.
5. **Public URL statements conflict.** GitHub Pages is wired into package/CLI/site/test copy and an automatic workflow. Cloudflare is configured on this branch and named by the brief. Privacy describes GitHub Pages only.
6. **Tests encode parts of the current presentation that the brief asks to change.** `tests/cli.test.mjs:304` rejects a “View on GitHub” CTA; lines 315-321 require commands to precede installation; line 349 requires the GitHub Pages privacy sentence. These are expected test updates, not regressions, if the proposal is approved.
7. **No authentic before/after example or beta guide exists.** The homepage console and routing diagram are illustrative, not captured CLI results. There is no beta/feedback document or issue template.
8. **Accessibility is partly implemented, not verified.** Skip links, visible focus, responsive breakpoints, reduced-motion handling, ARIA tabs, and keyboard arrows exist. Workflow tabs omit Home/End behavior, copy feedback has no live region, and the multi-command panel buttons do not copy the exact visible panel. Hidden workflow panels also mean two workflows are unavailable when JavaScript is disabled.

## Change and possible-update table

This table is a compact decision aid. The “possible update” column describes a recommended implementation option; it does not indicate that the update has been authorized or implemented.

| ID / area | Current finding | Possible update | Main affected files/components | Priority | Risk | Recommendation |
|---|---|---|---|---|---|---|
| P0-01 Homepage purpose and boundaries | Hero leads with the abstract brand tagline. Automation limits appear later, and some workflow wording can imply factual verification or automatic release enforcement. | Lead with a practical outcome; retain the tagline secondarily; add an immediate automation-boundary note; give each workflow explicit “does/does not” language while preserving anchors. | `site/index.html`, `site/styles.css`, `site/app.js`, website tests | Critical pre-beta | Medium | Implement minimally; do not redesign the site or require the exact proposed page order. |
| P0-02 README first run | Node 22 and dry-run guidance exist, but a long command catalog precedes onboarding. npm/npx network and cache effects, expected outcomes, and pinned team usage are not explained. | Put prerequisite checks, read-only `start`, and `setup --dry-run` first; separate the optional write step; retain the complete command reference later; document pinned versions. | `README.md`, command-example consistency checks | Critical pre-beta | Low | Implement as a documentation-only reorganization without changing command syntax. |
| P0-03 Canonical URL | Package metadata, CLI, site reference, and tests use GitHub Pages; the branch has Cloudflare configuration; the brief calls Cloudflare primary. Live topology is unverified. | Owner selects the primary and mirror policy after live verification; align metadata, CLI, README/site links, canonical metadata, and tests; retain the mirror until verified. | `package.json`, `src/commands/website.mjs`, `site/index.html`, hosting docs/config/workflow, tests | Critical pre-beta | Medium-High | Conditional: do not switch or delete hosting paths until the owner confirms the live arrangement. |
| P0-03 Privacy accuracy | Privacy says GitHub Pages is the host, while the proposed public URL is Cloudflare. Repository assets show no project analytics/forms, but provider-side logging is externally unverified. | Name every actual host and local-storage behavior; retain npm and optional AI-provider disclosures; link third-party policies; update the effective date without promising provider logging behavior. | `site/privacy.html`, possibly `site/terms.html`, privacy tests | Critical pre-beta | Medium | Implement only after the host decision and external verification. |
| P0-04 Documentation audit progression | `next` advances after any non-`.gitkeep` file exists in the documentation-report directory. It does not parse status, relevance, or recency. | Add strict parsers for JSON/Markdown and a documented legacy-text path; recognize generated audit candidates; select the newest applicable result; fail closed on failure, malformed data, ambiguity, or unknown status. | `src/commands/workflow.mjs`, `src/commands/audit.mjs` or a small core parser, `tests/cli.test.mjs` | Critical pre-beta | High | Mandatory before beta; keep `next` read-only and preserve current public result fields. |
| Adjacent P0 worksheet progression | Removing the word `Unverified` can advance security/engineering work even when evidence, owner, verification, or status is invalid. | Factor the existing report validator into reusable core logic and validate every applicable worksheet; define Stage 6 as structurally completed, not universally passing. | `src/commands/workflow.mjs`, report-validator core/wrapper, tests | Critical pre-beta | Medium-High | Implement with P0-04 or explicitly disclose the limitation and block release. |
| P0-05 Claims consistency | Limitations are strong in some files but prominent README/site/package/skill wording still mixes structural checks, audits, assurance, and release blocking. | Use a small approved-claims matrix; update high-risk wording; add targeted checks for scanning, certification, npx downloads, canonical URL, and enforcement claims; keep ordinary editorial review manual. | README, package description, site, CLI help/setup copy, purpose/security docs, skill/protocol sources and generated references | Critical pre-beta | Medium | Implement targeted semantic consistency; avoid a centralized copy framework or brittle full-sentence snapshots. |
| P0-06 Release and package validation | Release scripts, packed-consumer smoke testing, allowlists, and cross-platform CI already exist. Only read-only validation was run for this audit. | On an authorized implementation branch, run clean install, tests, validation, review dates, build, smoke package, release check, npm audit, pack manifest inspection, consumer install, and declared CI matrix. | Scripts, tests, workflows, package manifest; product files only if failures reveal defects | Critical pre-beta | Medium | Required release evidence; do not publish or deploy merely to test. |
| P1-01 Authentic example | Site illustrations are conceptual; there is no verified before/after tree or real audit/worksheet excerpt. | Capture sanitized text output from a disposable fictional repository after behavior is final; show structural results and initial `Unverified` states; label samples clearly. | `site/index.html`, `README.md`, optional public example doc, related styles/tests | Recommended | Low-Medium | Add after correctness work; prefer text over screenshots. |
| P1-02 Beta guide and feedback | No beta guide or beta-specific feedback route exists. | Add a safe 5-minute and 15–20-minute guide, cleanup boundaries, sensitive-data warnings, private security route, and feedback questions. If linked from npm/site, update every public-doc/package allowlist. | New `docs/BETA_TESTING_GUIDE.md`; optionally issue template; package/public-doc allowlists, build/smoke tests, README/site links | Recommended | Low-Medium | Add before invitations; keep feedback in the guide unless a public issue template is explicitly wanted. |
| P1-03 Accessibility and copy | Responsive/focus/tab foundations exist. Multi-command copy buttons do not copy the full visible block, feedback is not explicitly announced, workflow tabs lack Home/End, and hidden panels depend on JavaScript. | Copy from the active visible code block; add a polite live status; complete ARIA keyboard behavior; provide a no-script fallback; manually test mobile, high zoom, keyboard, contrast, reduced motion, and clipboard failure. | `site/index.html`, `site/app.js`, `site/styles.css`, site tests/manual records | Recommended; copy defect before beta | Medium | Fix the concrete copy mismatch before beta; avoid a broader visual redesign. |
| Release notes and versioning | `CHANGELOG.md` has an Unreleased section, but no refinement work has been implemented. The existing tag workflow is suitable. | After verified changes, record only completed work and draft release notes; prefer a patch version if all public contracts remain compatible. | `CHANGELOG.md`, owner release checklist | Release requirement | Low | Do not edit as if work shipped, bump a version, tag, publish, or deploy before approval. |
| P2-01 SEO/social metadata | Basic title/description exist; canonical and social metadata are absent. | After host/copy stabilization, add a factual canonical link and minimal Open Graph/social metadata; add an image only if maintainable. | Site `<head>` and optional static asset | Optional / post-beta | Low | Defer until the canonical origin and beta messaging are stable. |

## Requirement-by-requirement assessment

Risk below means implementation/regression risk, not the severity of leaving the issue unfixed.

### P0-01 — Rewrite the homepage hero and clarify all three review boundaries

**Status:** Partially implemented. **Necessity:** Required before novice beta. **Risk:** Medium.

**WHY necessary:** The hero at `site/index.html:32-38` leads with “One project memory. Three quality lenses” and a broad “review and improve” claim. A user must scroll to learn that only documentation structure checks run automatically and that security/engineering outputs are worksheets requiring evidence. The workflow content contains boundaries, but they are uneven: documentation “What it checks” can be read as semantic verification; security release-blocking language can be read as automatic enforcement.

**WHAT it affects:** Primarily `site/index.html`; small layout additions in `site/styles.css`; dynamic/copy behavior in `site/app.js`; site assertions in `tests/cli.test.mjs`; possibly the meta description and footer summary.

**WHAT could go wrong:** A broad rewrite could break established anchors, remove advanced reference content, make non-JavaScript access worse, invalidate existing tests, or introduce claims that the CLI cannot prove. Reordering the entire page exactly as proposed would create unnecessary review churn.

**HOW to mitigate:** Change the hero outcome and automation boundary first; preserve the tagline as secondary copy; add “does/does not” language to each workflow; preserve all existing IDs or add compatible anchor targets; keep the static dependency-free structure. Treat the proposed wording and page order as editorial guidance, not an exact architecture mandate. Test deep links and non-JavaScript reading order.

**Necessity judgment:** The clarity change is genuinely necessary. The exact prose and exact nine-section order are not. A smaller semantic edit and limited reorder can meet the goal.

### P0-02 — Reorganize README around a safe three-step first run

**Status:** Partially implemented. **Necessity:** Required. **Risk:** Low.

**WHY necessary:** Node 22 and `setup --dry-run` are documented, and `start` is read-only, but `README.md:17-32` gives ten commands before the user reaches “Choose a starting path.” It does not explain npm as a prerequisite, npx download/cache behavior, a pinned-version team workflow, expected outcomes, or the explicit transition from preview to a write.

**WHAT it affects:** `README.md` directly; command examples should remain synchronized with `src/cli/help.mjs`, `src/commands/workflow.mjs`, and `site/index.html`. The npm package page renders this README, so the effect reaches installed-package discovery without changing runtime behavior.

**WHAT could go wrong:** Removing the command catalog would hurt experienced users; changing valid command forms could create documentation/runtime drift; saying the first steps are wholly non-mutating would ignore npx registry/cache activity.

**HOW to mitigate:** Keep the full reference later in the README; put `node --version`, `npm --version`, `start`, and `setup --dry-run` first; explicitly distinguish target-project writes from npm/network/cache effects; separate the optional `setup` write; document a pinned version for repeatable team use. Validate every shown command against CLI parsing.

**Necessity judgment:** Necessary. This is a low-risk documentation change and should not alter commands or generated paths.

### P0-03 — Fix host/link inconsistency and privacy accuracy

**Status:** Missing, with partial Cloudflare infrastructure on the current branch. **Necessity:** Required after owner decision. **Risk:** Medium.

**WHY necessary:** Users can be sent to different origins, and the privacy notice can be factually wrong for the origin they visit. `package.json:57`, `src/commands/website.mjs:3`, `site/index.html:384`, and current tests use GitHub Pages. `wrangler.jsonc` names a Cloudflare asset deployment, while the brief names the Workers URL as primary. `site/privacy.html:30` names only GitHub Pages.

**WHAT it affects:** `package.json`, `src/commands/website.mjs`, `site/index.html`, `site/privacy.html`, possibly `site/terms.html`, `README.md`, `docs/GITHUB_AND_NPM_SETUP.md`, `docs/ARCHITECTURE.md`, URL consistency tests, and hosting documentation. `package-lock.json` should not need a change for a homepage-only edit. Hosting workflows/configurations should change only if the owner changes deployment behavior.

**WHAT could go wrong:** Switching blindly to an unverified Cloudflare URL could replace a working destination with a dead one. Deleting GitHub Pages could remove a useful mirror. Claiming no host logging would be unsupported. A CLI URL change affects all users of the newly published package and the exported `websiteUrl` API value.

**HOW to mitigate:** First establish, outside this audit, which origin is live and maintained. Record one canonical URL and an explicit mirror/redirect policy. Keep both deployments until canonical availability and redirects are verified. Update privacy to name the actual hosts and link their policies without promising their logging behavior. Add one consistency test covering package homepage, exported CLI URL, README/site primary links, and canonical metadata. Retain `openWebsite` dependency injection so tests never launch a browser.

**Necessity judgment:** The inconsistency must be fixed; the brief's preference for Cloudflare is not sufficient evidence by itself to choose it.

### P0-04 — Make `next` require a passing documentation audit

**Status:** Confirmed defect. **Necessity:** Critical pre-beta. **Risk:** High.

**WHY necessary:** Current logic equates file existence with success. This can produce false progress after a failed strict audit, exactly the failure the evidence-first design is intended to prevent.

**WHAT it affects:** `src/commands/workflow.mjs`; report rendering/parsing near `src/commands/audit.mjs:140-170`; likely a small shared internal report parser; `tests/cli.test.mjs`; Stage 4/5 wording in README, site, architecture, help, and skill if semantics change. The public `nextWorkflow()` result shape should remain compatible.

**WHAT could go wrong:** A permissive parser can retain the false-positive bug. A strict parser can strand users with valid legacy text reports. Choosing by filename alone fails across formats and same-day suffixes. Changing JSON fields or report text destructively can break consumers. Re-running and persisting an audit from `next` would violate read-only behavior.

**HOW to mitigate:**

- Recognize only generated documentation-audit candidates, not arbitrary files.
- Parse JSON structurally and verify `pass`, `checkedAt`, check-row consistency, and expected configuration/required-document checks.
- Parse Markdown from its heading, checked time, explicit result, and table; require result/table consistency.
- Treat legacy text as valid only when every non-empty line matches a known audit row, the configuration and all current required-document checks are present, and no row fails. Use file metadata only as a documented legacy ordering fallback.
- Select the newest applicable result by embedded `checkedAt` where available; fail closed on invalid timestamps, ties that cannot be resolved safely, malformed newer candidate reports, and unknown outcomes.
- Do not use substring matching such as `includes("pass")`.
- Keep `next` to `readdir`/`stat`/`readFile`; do not invoke a reporting audit or write state.
- Add optional metadata to new reports only in an additive manner. Avoid removing current JSON fields or changing `auditDocumentation()`'s return contract.
- When a legacy result is ambiguous, remain at Stage 4 and tell the user exactly which report was ignored and how to generate a current Markdown or JSON report.

**Backward compatibility:** Command syntax and APIs can remain compatible. Behavior intentionally becomes conservative. Some users with unparseable legacy `.txt` reports may be asked to rerun the audit; this is safer than silently advancing and should be documented as a correctness fix.

**Necessity judgment:** Mandatory. No beta recommendation should be issued without this fix and its regression matrix.

### Adjacent P0 correctness gap — Validate open security/engineering worksheets

**Status:** Not called out as a matrix item, but contradicted by the brief's operating rules. **Necessity:** Critical or explicitly disclosed as a beta limitation. **Risk:** Medium to High.

**WHY necessary:** The brief says a generated worksheet must never be treated as completed without evidence. Current `next` checks only whether `Unverified` text remains. The bundled `validateReport` already rejects unsupported statuses and non-Unverified rows lacking evidence, owner, or verification, but `next` does not use it.

**WHAT it affects:** `src/commands/workflow.mjs`, the report-validation implementation currently under `skills/manage-project-quality/scripts/check-report.mjs`, tests, and Stage 5/6 wording.

**WHAT could go wrong:** Importing core CLI behavior from a skill-internal script creates an undesirable layering dependency. Making every advisory row mandatory could also prevent legitimate partial worksheets from progressing.

**HOW to mitigate:** Move or factor the schema-neutral validation logic into a small internal core module and keep the skill script as a wrapper; preserve allowed security and engineering status sets. Define Stage 6 narrowly: no structurally invalid report and no open `Unverified` finding, while `Fail`, `Partial`, or `Recommended` remain valid recorded outcomes and do not falsely become `Pass`/`Applied`. Explain that Stage 6 means “record structurally completed,” not “all controls passed.”

### P0-05 — Synchronize claims and examples across surfaces

**Status:** Partially implemented. **Necessity:** Required, but scope should be targeted. **Risk:** Medium.

**WHY necessary:** Strong limitations exist in `SECURITY.md`, terms, privacy, skill instructions, and worksheet generation, but prominent wording remains inconsistent. Examples include “evidence-based security assurance” in README, “scope and architecture drift” under website checks, and unconditional release-blocking language across README/site/purpose/skill/reference content.

**WHAT it affects:** `README.md`, `package.json` description, `site/index.html`, `src/cli/help.mjs`, generated setup copy in `src/commands/setup.mjs`, `docs/PURPOSE.md`, `docs/SECURITY_MODEL.md`, `skills/manage-project-quality/SKILL.md`, security protocol/full-reference sources and generated copies, and targeted tests.

**WHAT could go wrong:** A single centralized copy system would overengineer a small static project. Brittle exact-sentence tests can make harmless copy editing expensive. Editing generated skill references directly would be overwritten by `npm run build`.

**HOW to mitigate:** Maintain a short claims matrix with approved concepts, then add focused automated checks only for high-risk assertions: canonical URL, automatic scanning/certification, npx download behavior, and release enforcement. Keep editorial review manual. Edit canonical `content/` sources and rebuild generated references rather than editing generated copies. Preserve status vocabularies and IDs.

**Necessity judgment:** Necessary for trust. Exact identical prose across every surface is unnecessary; consistent meaning is the goal.

### P0-06 — Re-run release, package, and disposable-project checks

**Status:** Test infrastructure exists; release evidence is incomplete for this checkout. **Necessity:** Required after implementation. **Risk:** Medium.

**WHY necessary:** The package writes into user repositories and ships an AI skill. A passing source-level unit suite alone does not prove tarball contents, consumer installation, collision behavior, or cross-platform paths.

**WHAT it affects:** Primarily execution evidence. Any failures could require changes to tests, `scripts/smoke-package.mjs`, packaging allowlists, or affected product modules. CI workflows should remain structurally unchanged unless a demonstrated coverage gap requires an addition.

**WHAT could go wrong:** Running release scripts in the wrong environment can write `build/`, `.npm-cache/`, temporary artifacts, or accidentally invoke external services. Testing via npx from the package root can exercise npm self-resolution rather than consumer behavior. Passing local Windows checks cannot establish Linux/macOS support.

**HOW to mitigate:** Use a clean clone/branch and OS temp directories; run the documented gate without publish/deploy credentials; inspect `npm pack --dry-run --json`; install the resulting tarball into a fresh external consumer; preserve `--ignore-scripts` in the smoke install; rely on CI for all declared OS/Node combinations; archive command outputs as release evidence. Never use `npm publish` as a smoke test.

**Current read-only evidence:** validation, internal Markdown links, catalog counts, package paths, website anchors, and review dates passed. Full tests/build/smoke/audit/tarball inspection remain required.

### P1-01 — Add an authentic before/after walkthrough

**Status:** Missing. **Necessity:** Valuable but not a correctness blocker. **Risk:** Low to Medium.

**WHY necessary:** Existing console and routing illustrations explain concepts but do not show the actual generated tree, a structural audit result, or the initial `Unverified` worksheet state. A small real example would reduce interpretation effort.

**WHAT it affects:** `site/index.html`, `README.md`, possibly a dedicated public example document, CSS for `<details>`/code blocks, and tests that assert example labels/commands.

**WHAT could go wrong:** Hand-edited examples can drift from output, expose local paths/user data, or suggest that generated worksheets are verified. Large screenshots are harder to keep accessible and current.

**HOW to mitigate:** Generate from a disposable fictional fixture after code is final; sanitize paths; label every excerpt as a sample; show a real failing or passing documentation structure result and `Unverified` worksheets; prefer text over screenshots; add a lightweight test for key generated paths and status labels.

**Necessity judgment:** Recommended for beta comprehension, but can follow the correctness and URL work.

### P1-02 — Add a beta testing guide and feedback template

**Status:** Missing. **Necessity:** Recommended for a closed beta. **Risk:** Low to Medium.

**WHY necessary:** The repository has no beta guide, disposable-project walkthrough, feedback questions, or beta-specific sensitive-data warning. Closed-group feedback is likely to be inconsistent without it.

**WHAT it affects:** A new `docs/BETA_TESTING_GUIDE.md` and either a section in that guide or a GitHub issue template. If linked from the npm README or website, also update `package.json`'s explicit files, `docs/.npmignore`, `scripts/public-docs.mjs`, `scripts/build-site.mjs`, `scripts/smoke-package.mjs`, architecture wording that currently says six public guides, and build/package tests.

**WHAT could go wrong:** Adding the guide only to the repository creates a broken npm README link because package docs use an allowlist. A public issue template can encourage accidental disclosure of private code or vulnerabilities. Cleanup instructions can be dangerous if they use broad deletion commands.

**HOW to mitigate:** Decide whether the guide is repository-only or distributed; if README/npm links it, include it through every allowlist and smoke assertion. Keep feedback questions in the guide unless a public template is clearly wanted. Direct sensitive findings to private reporting, prohibit credentials/private code, and describe cleanup only for a known disposable directory.

**Necessity judgment:** Strongly recommended before invitations, but not a runtime blocker.

### P1-03 — Review mobile, accessibility, and copy behavior

**Status:** Partially implemented; not manually verified. **Necessity:** Recommended, with one concrete copy defect. **Risk:** Medium.

**WHY necessary:** The site already has responsive CSS, focus-visible rules, a skip link, reduced-motion behavior, and ARIA tabs. However, the command-panel copy buttons at `site/index.html:248-266` copy only a selected suffix while the visible panel shows multiple commands. `site/app.js:106-119` changes button text but provides no explicit live announcement. Workflow tabs support only Left/Right, unlike the code tabs' Home/End support. Two workflow panels are HTML-hidden without JavaScript.

**WHAT it affects:** `site/index.html`, `site/app.js`, `site/styles.css`, and website tests/manual test records.

**WHAT could go wrong:** Tab changes can create focus traps or incorrect ARIA state. Making all tab panels visible by default can cause flashes/duplication when JavaScript loads. Mobile fixes can degrade desktop code blocks. Clipboard tests may fail in browsers without secure-context clipboard access.

**HOW to mitigate:** Follow the ARIA tabs pattern consistently; derive copied text from the active visible code block instead of maintaining a second command value; use a polite status/live region; provide a no-script reading fallback; test keyboard, screen reader labels, 360px layout, high zoom, clipboard success/failure, and both npx/global modes. Preserve horizontal scrolling and focus visibility.

**Necessity judgment:** Fix the copy mismatch before beta; complete manual accessibility/mobile review as a release condition. Broader visual redesign is unnecessary.

### P2-01 — SEO/social metadata and duplicate wording cleanup

**Status:** Mostly missing. **Necessity:** Optional. **Risk:** Low.

**WHY useful:** `site/index.html` has a title and description but no canonical link or social-card metadata. These help later discovery and can clarify the primary host.

**WHAT it affects:** Site `<head>` content and possibly a static social image.

**WHAT could go wrong:** Metadata can reinforce the wrong canonical host or stale product claims. A social image adds an asset-maintenance burden.

**HOW to mitigate:** Defer until the canonical host and beta wording are stable. Add only factual metadata and no adoption/security claims.

**Necessity judgment:** Defer until after beta correctness and usability work.

### Release governance and changelog requirements

**Status:** Existing process is suitable; no current refinement entry exists. **Necessity:** Required only after actual changes. **Risk:** Low.

`CHANGELOG.md` already has an `Unreleased` section. The release workflow verifies tag/version agreement, ancestry on `main`, the full gate, npm publication state, and GitHub Release creation. The implementation should add accurate Unreleased entries only after changes exist. A patch release is appropriate if command syntax, status values, return shapes, and report fields remain backward-compatible. A minor release is unnecessary unless the work expands the supported public surface materially.

No version bump, tag, push, publish, or deployment should occur during implementation review. Published npm versions are immutable; rollback after publication means deprecating a bad version if necessary and publishing a new corrective patch.

## Affected files and components

The list below is an impact map, not authorization to edit every file.

| Component | Expected files | Why affected | Compatibility notes |
|---|---|---|---|
| Documentation audit progress | `src/commands/workflow.mjs`, `src/commands/audit.mjs`, possibly one new internal core parser, `tests/cli.test.mjs` | Parse, order, and explain audit evidence | Preserve `next` syntax, read-only behavior, stages, and existing return fields. |
| Worksheet completion | `src/commands/workflow.mjs`, report-validator core/wrapper, `tests/cli.test.mjs` | Prevent lexical bypass of evidence rules | Stage 6 wording must mean structurally complete, not universally passing. |
| CLI/public API | `src/commands/website.mjs`, optionally `src/cli/help.mjs`, `src/api/index.mjs` only if a new public export is intentionally added | Canonical URL and clarified descriptions | `websiteUrl` value changes for new versions; avoid removing exports. |
| README/npm landing | `README.md`, `package.json` | Safe onboarding, precise package description, primary links | No runtime change. npm renders README and homepage on next publish. |
| Website content/UX | `site/index.html`, `site/styles.css`, `site/app.js`, `site/privacy.html`, perhaps `site/terms.html` | Hero, boundaries, example, navigation, copy/accessibility, host disclosure | Preserve IDs/deep links and no-JS access; do not add a framework. |
| Website build/docs | `scripts/build-site.mjs`, `scripts/public-docs.mjs`, website build tests | Only needed if a new public beta guide is rendered | Generated `build/` remains ignored and should be rebuilt, not hand-edited. |
| Agent guidance | `skills/manage-project-quality/SKILL.md`, protocol sources, canonical `content/` source, generated references | Align enforcement and evidence wording | Existing installed skills do not auto-update; project installs skip unless the user explicitly forces an update. |
| Public docs | `docs/PURPOSE.md`, `docs/SECURITY_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/GITHUB_AND_NPM_SETUP.md`, new beta guide | Claims, host topology, public-guide count, beta workflow | Existing generated user project docs are not migrated automatically. |
| Package allowlists | `package.json`, `docs/.npmignore`, `scripts/smoke-package.mjs` | Required only if the beta guide ships in npm | Missing one allowlist update can omit the guide or fail smoke tests. |
| Tests and validation | `tests/cli.test.mjs`, possibly a focused claim/link check script, `package.json` validate chain | New state matrix, URL consistency, site behavior | Avoid brittle full-copy snapshots; assert contracts and dangerous claims. |
| Release notes | `CHANGELOG.md` | Accurate Unreleased record after implementation | Do not claim fixes before tests pass. |
| Hosting | `wrangler.jsonc`, `.github/workflows/pages.yml`, external Cloudflare integration | Only if owner changes deployment topology | Do not remove either path until live verification establishes the intended mirror/primary model. |

### Installed packages and generated-project impact

- Already installed npm versions are immutable and will not change. Only a newly published version would receive the refinements.
- Existing project scaffolds are not migrated automatically. Updated strings in `setup.mjs` affect new projects; existing owned files change only if a user explicitly uses `setup --force`, which must remain clearly warned.
- Existing documentation reports remain user records. A new parser should read them; it must never rewrite or delete them.
- Legacy text audits may require a one-time rerun if their validity or ordering cannot be established. This is an intentional fail-closed compatibility tradeoff.
- Existing repository/user-level AI skills do not auto-update. A normal install skips the destination; explicit `--force` replaces the owned skill directory. Release notes should tell users when updated skill wording matters.
- Changing `package.json.homepage` changes npm/GitHub ecosystem links after publication but not CLI behavior. Changing exported `websiteUrl` changes the value observed by API consumers, though the export and type remain intact.
- Adding optional fields to JSON reports is normally backward-compatible; renaming/removing fields or changing status values is not recommended.

## Risk and compatibility analysis

| Risk | Level | Consequence | Mitigation |
|---|---|---|---|
| False Stage 5 after failing/malformed audit | High | Users are told documentation is audited without passing evidence | Structured parser, newest-result rule, fail-closed tests. |
| False Stage 6 after invalid worksheet edit | High | Invalid evidence can appear complete; contradicts product safety model | Reuse/factor report validator; precise Stage 6 semantics. |
| Wrong canonical-host decision | Medium-High | Dead links, misleading privacy, split SEO, broken CLI destination | Owner decision plus live primary/mirror/redirect verification before edits ship. |
| Legacy report rejection | Medium | Existing users must rerun an audit | Parse known legacy formats; explain ambiguity; do not rewrite records. |
| JSON/API contract drift | Medium | Automation consuming reports or exported functions can break | Additive fields only; preserve result objects and command syntax; API regression tests. |
| Copy-only tests masking functional regressions | Medium | Site looks correct while commands/examples drift | Execute examples in disposable fixtures; test high-risk claims, not every sentence. |
| Website tab/copy regressions | Medium | Keyboard/screen-reader users lose access; wrong command reaches clipboard | ARIA pattern tests, copy from visible DOM, manual keyboard/mobile checks. |
| Package allowlist omission for beta guide | Medium | Broken npm links or smoke failure | Update all allowlists/build lists together and inspect tarball JSON. |
| Generated-reference divergence | Medium | CLI content and installed skill disagree | Edit canonical sources and run build/validation; never hand-maintain generated duplicates. |
| Breaking existing anchors/page navigation | Low-Medium | External deep links and user bookmarks fail | Preserve IDs or add compatible anchors; validate links. |
| Documentation/metadata wording changes | Low | Minor confusion or search-position changes | Review claims matrix and changelog; no command changes. |
| SEO/social work before host decision | Low | Stale canonical/preview metadata | Defer. |

### Backward-compatibility conclusion

The coherent minimal implementation can be backward-compatible at the command, package-name, binary-name, license, catalog-ID, configuration-schema, public-export, and status-model levels. The only deliberate behavioral change is that `next` becomes more conservative. That change corrects a false-positive state transition and is appropriate for a patch release if legacy handling and messages are tested.

Do not rename stages, selectors, report statuses, catalog IDs, or generated directories. Do not make `next` write a cache/state file. Do not add runtime dependencies, install hooks, telemetry, background work, or network scanning.

## Technical feasibility

All required work fits the current architecture:

- Static copy and layout changes fit `site/` and the existing build script.
- README and policy clarification are direct Markdown/HTML edits.
- URL alignment fits the existing exported constant and metadata; a targeted consistency test is sufficient.
- Audit-state correction needs a small deterministic parser/selector, not a new database, migration, daemon, or report service.
- Worksheet validation can share the already implemented validation rules after modest refactoring.
- Beta documentation fits the existing public-doc rendering and package allowlists.
- Testing can use the existing `node:test` temporary-fixture pattern.

Unnecessary complexity to avoid:

- a website framework, CMS, analytics service, feedback backend, or animation library;
- cryptographic signing or a project identity system for local audit reports;
- automatic live re-auditing, state databases, hidden progress files, or migrations;
- a single-source copy templating system for all prose;
- a new report status vocabulary or catalog schema version merely for marketing text;
- automatic host failover inside the CLI before primary/mirror behavior is confirmed.

## Proposed implementation plan

### Phase 0 — Resolve decisions and freeze contracts

1. Owner confirms canonical host, active mirror, redirect expectations, and Cloudflare deployment mechanism.
2. Record preserved contracts: package/binary names, public exports, CLI syntax, config schema 1/2 support, report statuses, catalog IDs/counts, path layout, and anchor IDs.
3. Define report-recognition and newest-result rules, including exact legacy text behavior and Stage 6 meaning.
4. Capture a clean baseline with the full gate on an implementation branch; do not conflate pre-existing failures with changes.

**Rollback:** No user-facing change yet. If host ownership cannot be confirmed, keep current URLs and mark P0-03 blocked rather than guessing.

### Phase 1 — Correct evidence-based state detection

1. Add failing tests for all documentation audit transitions before modifying logic.
2. Implement recognized report parsing and newest-applicable selection while keeping `next` read-only.
3. Add worksheet structural validation to Stage 5/6 or explicitly scope and disclose it if owner defers it.
4. Keep result objects additive and error messages actionable; include evaluated/ignored report paths in detected output where safe.
5. Update architecture/help wording only as needed to match actual behavior.

**Rollback:** Revert the parser/validator commit as a unit. Reports remain untouched. If legacy compatibility proves unreliable, default to Stage 4 with a rerun message rather than restoring false-positive advancement.

### Phase 2 — Resolve canonical URL and privacy

1. Verify both live origins, redirects, host policies, deployment ownership, and deployed revision.
2. Update the package homepage, exported CLI URL, site command reference, README links, and canonical metadata to one primary URL.
3. Describe GitHub Pages as a mirror only if it remains active; otherwise retain deployment files until decommission is separately approved.
4. Update privacy host language, local-storage disclosure, npm access, and optional AI-provider flow; update the effective date.
5. Add a cross-surface URL test and keep browser spawning mocked.

**Rollback:** Point the primary metadata/CLI constant back in a corrective patch and redeploy the last known static artifact. Do not delete the mirror during this phase.

### Phase 3 — Clarify onboarding and public claims

1. Move a safe, outcome-oriented first run to the top of README while preserving advanced commands later.
2. Refine the hero and add an adjacent automation boundary.
3. Give each workflow an explicit “does/does not” statement; distinguish structural checks from factual review and policy decisions from technical enforcement.
4. Update high-risk claims in package description, purpose docs, skill/protocol content, and generated references.
5. Preserve all anchors and validate shown commands.

**Rollback:** Content-only commits should be separable from runtime correctness. Revert copy without reverting the parser fix.

### Phase 4 — Demonstrate output and support beta feedback

1. After behavior is final, generate a sanitized disposable-project walkthrough.
2. Add a short beta guide with 5-minute and 15-20-minute paths, safe cleanup, private security reporting, and AI-provider data warning.
3. Decide whether the guide ships in npm/site; if yes, update every allowlist/build/test together.
4. Keep feedback questions in the guide initially; add a public issue template only if the owner wants public beta intake.

**Rollback:** Remove links and the guide from all allowlists together. Do not leave a README link to an unpackaged document.

### Phase 5 — Accessibility, release evidence, and owner review

1. Fix copy buttons to use exact visible text for active command mode and panel; add accessible result feedback.
2. Complete keyboard, no-JS, high-zoom, 360px/tablet/desktop, contrast, and reduced-motion review.
3. Run the full automated and packed-consumer gates in a clean environment.
4. Inspect tarball contents and live artifacts; verify exact npm version and both hosts only after owner-approved publication/deployment.
5. Add truthful Unreleased notes and a release-note draft based on completed work.

**Rollback:** Website can redeploy the prior reviewed commit. npm cannot be overwritten; deprecate a faulty version if appropriate and publish a new patch.

### Priority classification

**Critical pre-beta:** P0-04; adjacent worksheet validation; P0-03 after owner host decision; P0-01 boundary clarity; P0-02 safe README path; P0-05 high-risk claims; P0-06 full release evidence.

**Recommended before invitations:** exact-copy accessibility fix, manual mobile/keyboard checks, sanitized example, beta guide and feedback questions.

**Optional after beta:** SEO/social metadata, broader page reordering, duplicate-copy polish, invite text.

## Required regression tests

### `next` documentation state matrix

Use disposable fixtures and assert stage, message, selected report, and an unchanged filesystem snapshot:

1. No workspace -> Stage 1.
2. Config exists and required files are missing -> Stage 2.
3. Required docs exist but starter prompts remain -> Stage 3.
4. Baseline complete and no report exists -> Stage 4.
5. Latest recognized report explicitly fails in JSON, Markdown, and supported legacy text -> Stage 4.
6. Empty, malformed, unrelated, invalid-JSON, inconsistent-summary/table, and unknown-result files -> Stage 4 when no valid applicable report exists.
7. Older pass plus newer fail -> Stage 4 across same and mixed formats.
8. Older fail plus newer verified pass -> Stage 5.
9. Valid pass in JSON and Markdown -> Stage 5; valid legacy text follows the documented compatibility policy.
10. A copied or incomplete report missing current configured required-document checks does not pass.
11. Timestamp/suffix ties or invalid embedded dates fail closed with an explanation.
12. `next` does not create, remove, rename, or change any target-project file in any case.

### Worksheet state tests

1. Generated `Unverified` security and engineering worksheets remain Stage 5.
2. Replacing `Unverified` with `Pass`/`Applied` without evidence, owner, and verification remains Stage 5 as invalid.
3. Unknown statuses remain Stage 5 and identify the validation error.
4. Valid `Fail`, `Partial`, or `Recommended` records can be structurally complete without being described as passing.
5. Overall status and row statuses are reconciled or clearly treated as an unresolved limitation.
6. Multiple reports: every applicable open/invalid worksheet is reported; five-item display truncation does not hide that more remain.

### File and project safety

1. `setup --dry-run`, skill dry-run, worksheet dry-run, and template dry-run leave a byte-for-byte project tree unchanged.
2. Default setup preserves unrelated and existing owned files.
3. `--force` changes only documented owned targets and leaves no staging/backup artifacts after success or failure.
4. Configured paths reject absolute paths, traversal, and symlink/junction escape on supported platforms.
5. Collision-safe reports/templates remain unique under concurrency.
6. `next`, `start`, list, guide, validate, help, version, and doctor remain target-project read-only.

### Claims, links, and website

1. One canonical URL matches package homepage, `websiteUrl`, README/site primary links, and `<link rel="canonical">`; any mirror URL is explicitly labeled.
2. `openWebsite` tests mock spawning on Windows/macOS/Linux and never open a real browser.
3. README quick-start commands are accepted by the parser and run against disposable fixtures.
4. High-risk claim checks reject automatic vulnerability scanning, certification/compliance guarantees, built-in AI-model claims, no-download npx claims, and automatic deployment blocking.
5. Existing anchor IDs and all local generated-site links remain valid.
6. Workflow and code tabs support expected keyboard navigation and correct ARIA state.
7. Copy buttons copy the complete visible active command block in npx/global modes and announce success/failure accessibly.
8. Essential workflow content remains available without JavaScript.
9. Manual records cover 360px, tablet, desktop, high zoom, keyboard-only use, reduced motion, contrast, and code-block overflow.

### Package, CI, and release

Run and retain exact results for:

```text
npm ci
npm test
npm run validate
npm run review:dates
npm run build
npm run smoke:package
npm run release:check
npm pack --dry-run --json
```

Also require:

- consumer installation from the actual packed tarball outside the source root;
- manifest inspection for unexpected/private files and all declared `main`/`bin`/`exports` targets;
- Node 22/24/26 on Windows, macOS, and Linux through CI as currently declared;
- intentional pass/fail strict-audit exit codes;
- no lifecycle setup, telemetry, background process, or live scan;
- npm registry/audit and actual published-version checks in an authorized networked environment;
- site build/deploy checks for every retained host without automatic production deployment during review.

## Recommended changes to defer

- Exact adoption of the proposed full page order; make the smallest reorder that puts purpose, boundary, and safe first run early.
- SEO/social cards, broad duplicate-wording cleanup, and the optional invite text until canonical hosting and beta copy stabilize.
- A website framework, component system, CMS, telemetry, analytics, form backend, or major theme system.
- Automatic vulnerability scanning, active testing, CI deployment gates, background agents, or new external services.
- Cryptographic report signatures, project IDs, a report database, hidden progress state, or migrations. These exceed the demonstrated local-workflow need.
- Deletion of GitHub Pages or addition of a new Cloudflare deployment workflow until the owner confirms existing external integration and mirror intent.
- A public beta issue template if closed-group testers can use a safer private feedback route; the guide can contain the questions first.
- Any catalog renumbering/renaming, configuration schema bump, new status vocabulary, or directory restructuring.

## Final recommendation

### CONDITIONAL GO for implementation; current checkout is NO-GO for beta release

The refinement brief is directionally sound and technically feasible without architectural redesign. Most work is low-risk content and static-site refinement. The confirmed `next` defect, adjacent worksheet-validation bypass, URL/privacy inconsistency, and incomplete release evidence are substantive enough that the current checkout should not be presented as beta-ready.

Authorize implementation only as a minimal patch with the following gates:

- owner-approved canonical-host/mirror decision;
- passing documentation-report and worksheet-state regression matrices;
- preserved CLI/API/config/catalog/status contracts and read-only `next` behavior;
- precise automation/release-enforcement language across prominent surfaces;
- complete clean-clone, packed-consumer, cross-platform, accessibility, and live-host validation;
- explicit owner approval before any version bump, tag, push, npm publish, or production deployment.

If those conditions pass, the project is a reasonable candidate for an invitation-only beta. A patch version is the likely semantic-version outcome. If the canonical host cannot be established or `next` cannot reliably distinguish passing from ambiguous legacy evidence, release should remain blocked rather than silently accepting uncertainty.

## Audit command record

Read-only commands executed successfully:

- `git status --short --branch`, branch/log/remote/diff inspection, file inventory, and targeted source searches.
- `npm.cmd run validate`: passed 33 catalog entries, package paths, website anchors, internal Markdown links, templates, and unified skill validation.
- `npm.cmd run review:dates`: passed 33 areas as of 2026-10-15.
- `node bin/agent-docs.mjs --help`: passed and displayed the current command surface.
- `node bin/agent-docs.mjs --version`: returned `5.1.0`.
- `node bin/agent-docs.mjs doctor`: passed Node `v24.19.0` and Git `2.55.0.windows.3`.
- `node bin/agent-docs.mjs start`: displayed all four read-only onboarding paths.
- `node bin/agent-docs.mjs next`: returned Stage 5 based on the single ignored legacy text report, illustrating the existence-only implementation path.
- `node bin/agent-docs.mjs audit documentation --strict --format json`: passed without writing a report.

Not executed and still requiring validation: dependency installation, full tests, builds, skill regeneration, package smoke, npm audit, tarball packing/installation, browser/manual accessibility tests, external CI status, registry state, live site/redirect checks, publish, and deployment.
