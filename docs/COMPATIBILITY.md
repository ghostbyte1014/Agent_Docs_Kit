# Compatibility and public contract

This document states what users and automation may rely on, and what may change without warning. It applies from version 6.2.0 onward.

Anything not listed here is internal. Internal behavior can change in any release.

## Versioning

The package follows semantic versioning.

- **Patch:** backward-compatible fixes.
- **Minor:** backward-compatible features, and corrections to checks that were not enforcing what they documented. A minor release may make a check stricter; such a change is listed in the changelog under an explicit "Behavior change" heading.
- **Major:** breaking changes to anything in this document.

## CLI surface

The supported CLI surface is the set of commands and options printed by `agent-docs --help`.

The version 4 aliases `audit security <phase>` and `review engineering <topic>` remain supported and documented as aliases of `security worksheet <phase>` and `engineering worksheet <topic>`.

## Exit codes

| Exit | When |
|---|---|
| `0` | The command completed. |
| `1` | An unknown subcommand or an unknown option. |
| `1` | A worksheet command run before `setup` has initialized documentation. |
| `1` | A configuration path that escapes the project, an invalid configuration value, or an unreadable configuration file. |
| `1` | `audit documentation --strict` when any check fails. |
| `1` | `doctor` when a prerequisite check fails. |
| `1` | `setup --ai` when the documentation was written but a later step failed. The message names the failed step, and rerunning the command is safe. |

`audit documentation` **without** `--strict` exits `0` even when checks fail. This is deliberate: the plain command reports status, and `--strict` is the gate. Use `--strict` in CI. This behavior is asserted by a test and will not change within version 6.

## Report formats

`audit documentation --report` writes text, Markdown, or JSON, selected with `--format`.

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
- `CLAUDE.md`, `GEMINI.md`, and any other agent pointer file
- every file the commands did not generate, including unrelated skills under `.agents/skills/`

`setup`, `setup --ai`, and every project-level `skill install` target write only inside the target project. `skill install --target codex` is the one command that writes to the user's home directory, and it must be requested explicitly.

## Generated text

Generated files change what AI agents do, so their content is part of the contract, not an implementation detail. Every change to the text of `AGENTS.md`, the starter documents, the agent pointer files, or the bundled skill is recorded in the changelog.

Existing projects are unaffected by such a change unless someone reruns `setup --force`, because setup skips files that already exist.

## Starter-text detection

A document is unfinished while it carries an `agent-docs:starter` marker comment. The marker is authoritative anywhere, including in a document copied from a template.

In addition, the untouched starter prose that `setup` generated counts as unfinished, but **only in the documents `setup` owns**: `docs/01-system/overview.md`, `docs/02-project/README.md`, and `docs/05-operations/README.md`. The prose is not matched elsewhere, because several of those phrases are legitimate in real content. `Status: Needs update` is one of the statuses the generated `docs/README.md` instructs users to apply, and archived material keeps superseded wording that the generated policy says not to edit and not to audit against.

`audit documentation --strict` fails on both signals, and `next` reports the same documents. Both read one shared detector with the same path scoping, so they cannot disagree.

Deleting the marker from an owned starter document without replacing its text does not clear the check. Replacing the text and deleting the marker does.

## Programmatic API

The supported API is the `exports` entry, `src/api/index.mjs`. Anything not re-exported from that module is internal, including every path under `src/core/` and `src/commands/` imported directly.

`setupProject()` returns an array of write results. Named properties are attached to that array (`pointers`, `skillInstalls`, `failures`, `profile`); the array form is preserved for existing callers.

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
