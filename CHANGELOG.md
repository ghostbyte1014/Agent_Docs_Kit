# Changelog

Notable user-visible changes are recorded here. Versions follow semantic versioning.

## 6.1.0 - 2026-10-15

### Added

- Expand the `setup` template `AGENTS.md` with governance switches (`CHANGE RECORDS` and `FREEZE`), a change-records policy (timestamped per-topic files in Philippine time, UTC+8), a change-freeze protocol (per-file confirmation, scope verification, and allowed read-only operations), an `## Always` section covering commit, secret, and data-boundary constraints, a documentation routing table, a development-commands reference, and starter sections for architecture and design rules.
- Scaffold `docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md` explaining switch semantics, session-restart requirements, tool-specific configuration locks, and the freeze protocol for all AI coding agents in any mode.
- Scaffold `docs/05-operations/agents/feature-updates/README.md` providing the naming convention (`YYYY-MM-DD_HHMM_short-topic.md`) and a copy-paste change-record template with date, AI tool, files changed, approval, and type fields.
- Update the generated `docs/05-operations/README.md` to include an `## Agent operations` section linking to the two new guides.

### Changed

- The generated `AGENTS.md` attribution header now includes `> Created by ghostbyte1014 · Agent Docs Kit` and a project-summary placeholder.
- The governance scope line explicitly names all major AI coding agents and modes (Claude Code, Codex, Gemini CLI, Cursor, Copilot, Antigravity, and any other) including auto, auto-accept, full-access, YOLO, and skip-permissions modes.

## 6.0.0 - 2026-10-15

### Breaking


- Security and engineering worksheet commands now require an initialized documentation workspace. Existing users who previously created standalone worksheets must first run `setup --dry-run`, review the planned files, and then run `setup`.
- Explicit setup now creates a root `AGENTS.md` when one is absent. An existing `AGENTS.md` is always preserved, including with `--force`; merge the continuous-documentation policy from the generated `docs/README.md` deliberately when repository instructions already exist.

### Migration from 5.x

1. Run `npx @ghostbyte/agent-docs-kit@6.0.0 setup --dry-run` in the target project.
2. Review the planned documentation scaffold and protected `AGENTS.md` behavior.
3. Run `npx @ghostbyte/agent-docs-kit@6.0.0 setup` to initialize documentation before creating security or engineering worksheets.
4. If the project already has `AGENTS.md`, keep it and deliberately merge only the continuous-documentation guidance the project accepts.
5. Use `npx @ghostbyte/agent-docs-kit@6.0.0 suggest reviews --staged` or `--base <git-ref>` when an advisory change-based reminder is useful. No Git hook is installed automatically.

### Added

- Add a protected `AGENTS.md` to explicit project setup when one is absent, establishing a continuous documentation-impact loop without overwriting existing repository instructions.
- Add read-only `suggest reviews` Git change tracing for staged changes and branch-base comparisons, with evidence-labeled security and engineering review candidates.
- Require the documentation workspace to be initialized before security or engineering worksheets can be created, with direct setup guidance for people and calling agents.
- Add a closed-beta testing guide, safe disposable-project paths, and a structured beta feedback issue template.
- Add sanitized before/after, documentation-audit, security-worksheet, and engineering-review examples to the website and README.
- Render the public guides, including the beta guide, as styled and navigable website pages instead of linking readers to raw Markdown.
- Replace maintainer-oriented homepage footer links with user navigation plus dedicated Privacy and Terms of Use pages.
- Use the same Privacy, Terms of Use, and Security Model footer across public trust and generated guide pages without exposing maintainer navigation.

### Changed

- Position the documentation workflow as AI-first and agent-assisted while preserving the complete manual path and clearly stating that instruction files do not run an agent.
- Separate continuous documentation maintenance from scoped, point-in-time security and engineering reviews.
- Reorganize first-run guidance around prerequisites, read-only onboarding, setup preview, and a clearly separated optional write step.
- Clarify across the website, README, CLI help, package metadata, and project skill that only documentation structure checks are automated; security and engineering worksheets require evidence and judgment.
- Use the Cloudflare Workers URL as the canonical website in package metadata, the CLI opener, documentation, and HTML metadata; retain GitHub Pages configuration for an explicitly optional mirror.
- Make website workflow tabs progressively enhanced, improve keyboard navigation and focus behavior, respect reduced motion, and make copy buttons copy the exact visible command block.

### Fixed

- Require the latest applicable documentation audit to be recognized, structurally valid, and passing before `next` advances beyond Stage 4; a newer failure now overrides an older pass.
- Reject empty, malformed, unrelated, ambiguous, or incomplete saved reports as workflow evidence while retaining a compatibility path for valid legacy text reports.
- Keep security and engineering worksheets open when statuses, stable IDs, evidence, ownership, verification, or overall state are incomplete.
- Generate the report validator from one canonical implementation so CLI workflow state and installed-skill checks use the same status rules.

### Security

- Escape generated documentation metadata and Markdown output, reject active URI schemes, and add safe external-link attributes in the dependency-free site renderer.
- Correct the privacy notice for Cloudflare canonical hosting, the GitHub Pages mirror, local storage, npm registry access, and optional AI-provider data flows without making unsupported logging promises.

### Release note draft

**Stable major release:** improves first-time guidance and automation boundaries; aligns canonical links and data-handling documentation; strengthens audit-progress detection so saved failures are not mistaken for successful checks; and adds continuous-documentation policy, changed-path review suggestions, beta walkthroughs, feedback support, examples, accessibility refinements, and regression coverage. See the migration steps above before using security or engineering worksheet commands in an uninitialized project.

## 5.1.0 - 2026-10-14

### Added

- Guided `start new|existing|agent|manual` onboarding paths for first-time users.
- A read-only `next` command that derives the current workflow stage from repository state.
- Terminal continuation instructions after setup, skill installation, documentation audits, and worksheet creation.
- A website guide explaining how the CLI, repository skill, coding agent, and durable project records work together.
- A targeted-loading explanation showing how focused references can reduce unnecessary AI context and token usage.

### Changed

- The interactive menu is organized around starting, continuing, focused workflows, and maintenance instead of a flat command list.
- The unified skill now detects first-use and post-setup requests and ends with one evidence-bounded next action.
- Local website preview now builds the current source before starting the server.
- Website builds use the same explicit public-document allowlist as the npm package.

## 5.0.1 - 2026-10-14

### Fixed

- Local documentation workspaces and generated audit records are excluded from the npm archive by an explicit public-document allowlist.
- Package validation and smoke installation now reject missing declared entry points and unexpected documentation files.
- The legacy `main` field resolves to the same public API used by `exports`.
- Forced scaffold replacement stages content before swapping the owned file into place.

### Changed

- GitHub workflows use the reviewed, SHA-pinned checkout v7.0.1, setup-node v7.1.0, configure-pages v6.0.0, upload-pages-artifact v5.0.0, and deploy-pages v5.0.1 releases.

## 5.0.0 - 2026-10-14

### Added

- Configuration-aware documentation audits with text, Markdown, JSON, report, and strict modes.
- Separate security and engineering worksheet schemas.
- Five documentation templates and five new engineering review topics.
- Seven canonical documentation guidance areas with CLI discovery and progressive skill references.
- Package-installation smoke testing and monthly maintenance automation.

### Changed

- Node.js 22 is now the minimum supported runtime.
- Catalog schema is version 2 and records review dates.
- Security guidance uses current OWASP and NIST baselines and safer authorization boundaries.
- Canonical commands are `security worksheet` and `engineering worksheet`; v4 aliases remain supported.

### Fixed

- Invalid options and installation targets are rejected.
- Local report dates no longer use the previous UTC calendar day.
- Repeated reports avoid accidental filename collisions.
- Repeated templates support descriptive names and collision-safe filenames.
- Generated worksheets pass the bundled schema-aware report validator.
- Documentation audits validate required metadata fields, dates, same-document anchors, and exact persisted formats.
- Forced skill updates replace the owned skill cleanly instead of retaining obsolete files.
- Stale package metadata, legacy folder instructions, content paths, duplicate headings, and report validation gaps were removed.
- Version-tag publishing verifies release identity and creates the matching GitHub Release.
