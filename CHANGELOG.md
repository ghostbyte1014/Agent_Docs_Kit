# Changelog

Notable user-visible changes are recorded here. Versions follow semantic versioning.

## Unreleased

### Added

- Render the six public maintainer guides as styled, navigable HTML pages on the GitHub Pages site instead of linking readers to raw Markdown.
- Replace maintainer-oriented homepage footer links with user navigation plus dedicated Privacy and Terms of Use pages.
- Use the same Privacy, Terms of Use, and Security Model footer across public trust and generated guide pages without exposing maintainer navigation.

### Security

- Escape generated documentation metadata and Markdown output, reject active URI schemes, and add safe external-link attributes in the dependency-free site renderer.

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
