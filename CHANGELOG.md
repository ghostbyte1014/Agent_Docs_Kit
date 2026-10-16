# Changelog

Notable user-visible changes are recorded here. Versions follow semantic versioning.

## 6.2.1 - 2026-10-16

Fixes for defects found in 6.2.0 before it was published. 6.2.0 was never released to npm, so no installed version is affected.

### Fixed

- `audit documentation --strict` no longer fails on legitimate content that happens to use starter wording. The prose fallback added in 6.2.0 matched phrases in **any** document, so `Status: Needs update` — one of the statuses the generated `docs/README.md` instructs users to apply — produced a permanent `starter-text` failure on real content. The fallback now applies only to the three documents `setup` owns. The `agent-docs:starter` marker remains authoritative anywhere, so deleting a marker still cannot be used to pass an unfinished starter document.
- The documentation audit no longer fails on material under `docs/archive/`. The generated policy states that the archive is historical and must not be audited against, and that records there are permanent, which made a passing audit unreachable once archived material contained superseded starter wording. Covered by the same path scoping as above.
- `--agents`, `--timezone`, and `--attribution` now take effect on an already-initialized project. `.agent-docs/config.json` is a protected scaffold file, so a rerun skipped it and all three flags were silent no-ops unless `--force` was supplied, which also rewrites every starter document. They now update their own keys in place and preserve every other key, including hand-edited values. `--dry-run` previews the change and writes nothing.
- `--agents none` now clears the stored agent list. An explicit `--agents` value is authoritative rather than additive, so a named list replaces what was stored. `--agents auto` still adds detected tools. Removing an agent never deletes its instruction file: the file is kept exactly as it is and stops being checked, and the CLI says so.
- Every `path` in a documentation-audit report now uses forward slashes on all platforms. On Windows a single JSON report mixed separators for the same file, reporting configured paths with forward slashes and inspected files with backslashes, which prevented a CI consumer from matching or grouping report paths reliably.
- `scripts/sync-version.mjs` is idempotent for prerelease versions. Its patterns ignored the prerelease suffix, so a second run over an already-synced pin appended it again and produced `6.2.1-beta.1-beta.1`. This corrupted the pins and made `sync-version.mjs --check` fail while reporting a mismatch that did not exist, which blocked the documented `beta` dist-tag release path. The rules now live in `scripts/version-rules.mjs` and are unit tested across release and prerelease versions.
- `scripts/sync-version.mjs` no longer rewrites a bare `vX.Y.Z` in prose. Its release-tag rule is anchored to the commands that name a release tag, because documentation sometimes contrasts two different versions deliberately and rewriting both destroyed the point. `docs/RELEASE_PROCESS.md` uses `<version>` placeholders for that contrast and documents that a prerelease publish requires a real version bump, since the publish workflow requires the tag to equal `package.json`.

### Changed

- `docs/COMPATIBILITY.md` records the starter-text path scoping, the in-place configuration update, and the forward-slash guarantee for report paths.

## 6.2.0 - 2026-10-16

Not published to npm. Its changes reach users through 6.2.1.

### Behavior change

- `audit documentation --strict` now fails on untouched scaffold starter text. A freshly generated scaffold previously passed the strict audit and exited `0`, so a strict check in CI stayed green on empty documentation. Each generated starter document now carries an `agent-docs:starter` marker, and `audit` and `next` read one shared detector instead of two separate rules, so they can no longer disagree about the same files. Deleting a marker without replacing the text does not clear the check: the detector also recognizes the untouched starter prose. **Projects whose CI currently passes on an untouched scaffold will begin to fail.** Replace the starter text with verified project facts and delete the marker in the same edit. `audit documentation` without `--strict` still exits `0`, as documented in `docs/COMPATIBILITY.md`.
- The generated `AGENTS.md` no longer hardcodes Philippine time (UTC+8) or a `Created by ghostbyte1014` line. Change-record instructions use UTC by default, and attribution is opt-in. This affects newly generated files only; an existing `AGENTS.md` is never replaced.

### Added

- `setup --agents <claude,gemini|all|auto|none>` creates thin `CLAUDE.md` and `GEMINI.md` pointer files that import `AGENTS.md` with a single `@AGENTS.md` line. `AGENTS.md` stays the one canonical policy; the pointer files never copy it. `--agents auto` creates pointers only for tools the repository already shows signs of using.
- Existing agent instruction files are never overwritten, including with `--force`. When one lacks the import, the CLI prints the single line to add rather than editing the file.
- `setup --ai` initializes documentation, `AGENTS.md`, the agent pointer files, and the project skill in one command, with a full `--dry-run` preview. It writes only inside the target project. If a later step fails, the documentation is kept, the exit code is `1`, the message names the failed step, and rerunning the command completes the install.
- Per-agent project skill targets. `skill install --target claude` installs into `.claude/skills/`, the location Claude Code documents. Project-level targets write only inside the repository; `--target codex` remains the one explicit user-level target.
- A documentation-audit `agent-pointer` rule that checks every agent recorded in `config.agents` still has a pointer file importing `AGENTS.md`, so a tool-specific file cannot silently drift.
- Installed skills record the producing CLI version in `.agent-docs-skill.json`. `next` and `audit documentation` report a copy older than the running CLI and name the refresh command. A mismatch is reported, never failed, so upgrading the CLI cannot break an existing pipeline.
- Configurable `timezone` and `attribution` keys in `.agent-docs/config.json`, settable with `setup --timezone <UTC|local|IANA zone>` and `setup --attribution <text>`. A later `setup` inherits both.
- `docs/COMPATIBILITY.md` states the public contract: CLI surface, exit codes, report formats, configuration schema, owned files, generated text, programmatic API, and the deprecation rule.
- `scripts/sync-version.mjs` makes `package.json` the only source for every pinned version. `site/index.html` holds a placeholder that `scripts/build-site.mjs` substitutes at build time. `npm run release:check` and a test fail when any pin, including `package-lock.json`, disagrees.
- Release safety in `.github/workflows/publish-npm.yml`: publication derives its npm dist-tag from the version (a prerelease publishes to `beta`, so `@latest` does not move), publishes with `--provenance`, and a new `smoke` job installs the published version from the registry on a clean runner, verifies the provenance attestation with `npm audit signatures`, and drives the documented first-run path with retries for registry propagation.
- Old-version compatibility fixtures under `tests/fixtures/compat`, generated from the released 5.1.0, 6.0.0, and 6.1.0 source, with their expected `next` stage and audit outcome recorded in `tests/compat.test.mjs`.
- Regression tests for project paths containing spaces and non-ASCII characters, documents and pointer files using CRLF line endings, and files saved with a UTF-8 byte-order mark.
- Agent-behavior scenarios and written release criteria in `docs/TESTING_GUIDE.md`, covering change records, the freeze switch, pointer-file import resolution, and secret handling. The guide was renamed from `docs/BETA_TESTING_GUIDE.md` because it documents ordinary verification, not a time-boxed beta programme.

### Changed

- A configuration whose `schemaVersion` is newer than the CLI understands now fails with a message naming the version and the supported range instead of a bare error.
- A configuration file saved with a UTF-8 byte-order mark now fails with a message naming the BOM and how to fix it, instead of a raw JSON parser error.
- Release documentation uses portable `npm` commands with a single note about Windows PowerShell, rather than `npm.cmd` throughout.
- `next` reports maintenance notices, such as a stale installed skill, on every stage rather than only two.

### Fixed

- The `README.md` version pin said `@6.0.0` while every other surface said `6.1.0`, and the release documents hardcoded `6.0.0`. All pins now derive from `package.json`.

### Removed

- Test fixtures are excluded from the published package (`!tests/fixtures`), so the compatibility trees are not shipped to consumers.

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
