# Versioning, compatibility, and upgrades

This document states what users and automation may rely on, and what may change without warning. The maintained compatibility baseline begins at version 1.3.7.

Anything not listed here is internal. Internal behavior can change in any release.

## Versioning

The package follows semantic versioning.

### Version-line reset

Version `1.3.7` intentionally restarts the maintained release line after the earlier `4.0.0` through `6.2.1` development releases advanced before the product contract had stabilized. Published npm versions remain immutable and their changelog history is preserved.

This is not a semantic-version upgrade from 6.x: package managers will not automatically move an existing 6.x installation to the numerically lower `1.3.7`. A user choosing the reset line must install the exact version deliberately. Compatibility promises in this document apply to `1.3.7` and later releases in the reset line; the retained 5.x and 6.x fixtures demonstrate migration tolerance but do not redefine the new version order.

[`RELEASE_HISTORY.md`](RELEASE_HISTORY.md) lists the observed npm, Git-tag, and changelog state for every earlier version. The 4.x, 5.x, and 6.x major lines are retired and reserved; after 3.x, the next permitted major is 7.0.0. `npm run release:version-policy` enforces that boundary locally.

## Upgrade and migration workflow

Before changing the package version used by a project:

1. Record the currently installed version with `agent-docs --version` or `npx agent-docs --version`.
2. Read the changelog entries between the installed and target releases, including any version-line reset notice.
3. Pin the target version explicitly in team automation rather than relying on a moving dist-tag.
4. Run `setup --dry-run`, `doctor`, `next`, and `audit documentation --strict` before applying any forced scaffold refresh.
5. Refresh the repository skill separately with `skill install --target project --force`, then review its diff.
6. Never use `setup --force` as an automatic migration. It can replace setup-owned starter documents; protected agent instructions remain manual merges.

For the 6.x-to-1.3.7 reset, use an exact install such as `npm install --save-dev @ghostbyte/agent-docs-kit@1.3.7`. Keep the existing project documentation and configuration in place, run the read-only checks above, and review differences before replacing any generated asset.

- **Patch:** backward-compatible fixes.
- **Minor:** backward-compatible features, and corrections to checks that were not enforcing what they documented. A minor release may make a check stricter; such a change is listed in the changelog under an explicit "Behavior change" heading.
- **Major:** breaking changes to anything in this document.

## CLI surface

The supported CLI surface is the set of commands and options printed by `agent-docs --help`.

`review guide` prints the packaged `docs/REVIEW_GUIDE.md` content without writing project files. `review guide --open` opens the canonical hosted guide and prints its URL as a fallback.

The version 4 aliases `audit security <phase>` and `review engineering <topic>` remain supported and documented as aliases of `security worksheet <phase>` and `engineering worksheet <topic>`.

For compatibility with older scripted invocations, `security worksheet --phase <selector>` and `engineering worksheet --topic <selector>` are supported aliases for the positional selector forms. Supplying both a positional selector and its flag is rejected as ambiguous.

## Exit codes

| Exit | When |
|---|---|
| `0` | The command completed. |
| `1` | An unknown subcommand or an unknown option. |
| `1` | A worksheet command run before `setup` has initialized documentation. |
| `1` | A configuration path that escapes the project, an invalid configuration value, or an unreadable configuration file. |
| `1` | `audit documentation --strict` when any check fails. |
| `1` | `report validate <worksheet>` when the worksheet is structurally incomplete or inconsistent. |
| `1` | `doctor` when a prerequisite check fails. |
| `1` | `setup --ai` when the documentation was written but a later step failed. The message names the failed step, and rerunning the command is safe. |

`audit documentation` **without** `--strict` exits `0` even when checks fail. This is deliberate: the plain command reports status, and `--strict` is the gate. Use `--strict` in CI. This behavior is asserted by a test and will not change within the 1.x reset line.

## Report formats

`audit documentation --report` writes text, Markdown, or JSON, selected with `--format`.

`report validate <worksheet>` is read-only. Security worksheets require control ID, priority, evidence mode, status, evidence, remediation, owner, and verification columns. Engineering worksheets require practice ID, status, evidence, impact, recommendation, owner, and verification columns. New worksheets record an `Expected finding IDs` metadata field containing the selected reference's stable IDs. Validation compares that stored set with both the findings table and embedded Reference checklist, which detects accidental or partial removal while the metadata remains unchanged. It does not consult the canonical catalog, so it cannot detect a deliberate edit that changes the metadata, findings table, and Reference checklist consistently.

Worksheets created before this metadata field was introduced remain readable. Validation falls back to IDs in their embedded Reference checklist and emits a warning that completeness cannot be fully verified because the fallback checklist is editable. Recreate the worksheet from the same selector when full canonical completeness verification is required.

The JSON report is the stable machine-readable form:

| Field | Meaning |
|---|---|
| `checkedAt` | ISO 8601 timestamp of the run. |
| `pass` | `true` only when every check passed. |
| `checks` | Array of `{ pass, rule, path, detail }`. |

Every `path` is project-relative and uses forward slashes on every platform, including Windows, so the same file is always reported under one spelling.

New fields may be added. Within a major version, existing fields are not renamed, removed, or changed in type. New `rule` values may be added, so treat an unrecognized rule as a failure to investigate rather than an error.

Text reports produced by version 5.x remain readable. A report whose result cannot be determined unambiguously is ignored with a message and is never promoted to a pass.

## Configuration

Configuration lives in `.agent-docs/config.json`.

- `schemaVersion` is required in generated configurations. This CLI reads `1` and `2`. A higher value fails with a message naming the version, not a stack trace.
- Every new key is optional and has a documented default, so a configuration written by an older version keeps working with no migration step.
- An unknown key is rejected, so a typo fails loudly instead of being silently ignored.
- A configuration file saved with a UTF-8 byte-order mark fails with a message that names the BOM.

Keys added in 6.2.0, with their defaults:

| Key | Default | Purpose |
|---|---|---|
| `timezone` | `"UTC"` | Time zone used by generated change-record instructions. Accepts `"UTC"`, `"local"`, or an IANA zone name. |
| `attribution` | `""` | Optional "Created by" line in a generated `AGENTS.md`. Empty means no line. |
| `agents` | `[]` | Agent ids whose pointer files the documentation audit checks. |

## Files the commands own

`setup --force` may replace only the scaffold files it generates: `.agent-docs/config.json` and the starter documents under the configured documentation root.

Separately, `--agents`, `--timezone`, and `--attribution` update their own keys in an existing `.agent-docs/config.json` without `--force`, because those flags exist to change configuration. Every other key in that file, including hand-edited values, is preserved. An explicit `--agents` value replaces the stored list rather than adding to it, so `--agents none` clears it; `--agents auto` adds detected tools to the stored list. Removing an agent never deletes its instruction file: the file is kept exactly as it is and simply stops being checked. `skill install --force` may replace only the installed `manage-project-quality` skill directory.

These files are **never** replaced, including with `--force`:

- `AGENTS.md`
- `CODEX.md`, `CLAUDE.md`, `GEMINI.md`, `CURSOR.md`, `COPILOT.md`, and any later agent pointer file
- every file the commands did not generate, including unrelated skills under `.agents/skills/`

`setup`, `setup --ai`, and every project-level `skill install` target write only inside the target project. `skill install --target codex` is the one command that writes to the user's home directory, and it must be requested explicitly.

## Generated text

Generated files change what AI agents do, so their content is part of the contract, not an implementation detail. Every change to the text of `AGENTS.md`, the starter documents, the agent pointer files, or the bundled skill is recorded in the changelog.

The `1.3.7` generated policy keeps documentation maintenance active for every material change and separates that continuous duty from point-in-time reviews. It asks agents to recommend a narrowly scoped security or engineering review when risk, release, architecture, reliability, testing, or operational evidence warrants one; a recommendation is not a completed review. It also discovers repository-specific development commands and authorization evidence instead of assuming npm/TypeScript or reading Git identity as approval.

Existing projects are unaffected by such a change unless someone reruns `setup --force`, because setup skips files that already exist.

## Starter-text detection

A document is unfinished while it carries an `agent-docs:starter` marker comment. The marker is authoritative anywhere, including in a document copied from a template.

In addition, the untouched starter prose that `setup` generated counts as unfinished, but **only in the documents `setup` owns**: `docs/01-system/overview.md`, `docs/02-project/README.md`, and `docs/05-operations/README.md`. The prose is not matched elsewhere, because several of those phrases are legitimate in real content. `Status: Needs update` is one of the statuses the generated `docs/README.md` instructs users to apply, and archived material keeps superseded wording that the generated policy says not to edit and not to audit against.

`audit documentation --strict` fails on both signals, and `next` reports the same documents. Both read one shared detector with the same path scoping, so they cannot disagree.

Deleting the marker from an owned starter document without replacing its text does not clear the check. Replacing the text and deleting the marker does.

## Programmatic API

The supported API is the `exports` entry, `src/api/index.mjs`. Anything not re-exported from that module is internal, including every path under `src/core/` and `src/commands/` imported directly.

`setupProject()` returns an array of write results. Named properties are attached to that array (`pointers`, `skillInstalls`, `failures`, `profile`); the array form is preserved for existing callers.

`validateWorksheetFile(path, options)` returns the resolved worksheet path, detected kind, overall status, finding statuses, validation errors, and a `pass` boolean. It does not modify the worksheet.

## Installed skill version

A `skill install` writes `.agent-docs-skill.json` into the installed skill, recording the CLI version that produced the copy. `next` and `audit documentation` report a copy that does not match the running CLI and name the command that refreshes it.

A mismatch is reported, never failed. Upgrading the CLI does not break an existing pipeline.

## Deprecation

A feature is deprecated in a minor release, with a warning naming the replacement, and is removed no earlier than the next major release.

## Not covered

- The HTML, CSS, and JavaScript of the website.
- The internal layout of the bundled skill's reference files.
- Exact wording of console output, other than the documented strings asserted by tests.
- Timing, ordering, or formatting of log lines.
