# Changelog

Notable user-visible changes are recorded here. Versions follow semantic versioning.

## Unreleased

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
