# Agent Docs & Quality Kit

[![CI](https://github.com/ghostbyte1014/Agent_Docs_Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/ghostbyte1014/Agent_Docs_Kit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@ghostbyte/agent-docs-kit.svg)](https://www.npmjs.com/package/@ghostbyte/agent-docs-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Keep project documentation organized and review security and engineering practices with evidence&mdash;not assumptions.

Agent Docs & Quality Kit is an AI-first, agent-assisted CLI for setting up project records, keeping documentation aligned with project changes, checking documentation structure, and creating focused security and engineering review worksheets. It remains fully usable as a manual CLI, but its continuous-documentation workflow is designed primarily for developers who work through compatible AI coding agents.

**What it automates:** documentation structure checks, project scaffolding, protected repository instructions, changed-path review suggestions, and creation of review records.

**What it does not automate by itself:** writing accurate documentation from code, vulnerability scanning, factual verification of every document, security certification, or enforcement of release policy. Continuous documentation requires a compatible AI agent to be running with repository access, or a person to perform the same steps manually.

[Website](https://agent-docs-kit.ghostbyte1014.workers.dev/)
&middot; [npm](https://www.npmjs.com/package/@ghostbyte/agent-docs-kit)
&middot; [Documentation](docs/PURPOSE.md)
&middot; [Security model](docs/SECURITY_MODEL.md)
&middot; [Testing guide](docs/TESTING_GUIDE.md)

## Quick start

Requirements: Node.js 22 or newer and npm. `npx` avoids a global installation, but it may download and cache the package from npm and may prompt before execution.

```bash
# 1. Check local prerequisites (non-mutating)
node --version
npm --version

# 2. Inspect the available onboarding paths (project read-only)
npx @ghostbyte/agent-docs-kit@latest start

# 3. Preview generated project files before writing anything
npx @ghostbyte/agent-docs-kit@latest setup --dry-run
```

The commands above do not write target-project files. The `npx` commands can still access the npm registry. Review the preview in an empty or disposable repository before choosing the explicit write step:

```bash
# Writes the owned scaffold; existing files are skipped by default
npx @ghostbyte/agent-docs-kit@latest setup

# Or do it all at once: scaffold, AGENTS.md, CLAUDE.md/GEMINI.md pointers, project skill
npx @ghostbyte/agent-docs-kit@latest setup --dry-run --ai
npx @ghostbyte/agent-docs-kit@latest setup --ai

# Checks the next suggested action without writing files
npx @ghostbyte/agent-docs-kit@latest next
```

A freshly generated scaffold **fails** `audit documentation --strict` on purpose: every starter document carries an `agent-docs:starter` marker. Replace the starter text with verified project facts and delete the marker, and the strict audit passes. This keeps a green CI check from meaning "empty documentation".

For a reproducible team workflow, replace `@latest` with a reviewed version such as `@6.2.1` and update the pin deliberately.

## Example output

After explicit setup, representative generated paths include:

```text
AGENTS.md
CLAUDE.md
GEMINI.md
.agent-docs/config.json
.agents/skills/manage-project-quality/
.claude/skills/manage-project-quality/
docs/README.md
docs/01-system/overview.md
docs/02-project/README.md
docs/03-development/engineering-reviews/
docs/04-testing/security-audits/
docs/05-operations/README.md
```

A documentation audit emits text, Markdown, or JSON. This sanitized excerpt uses the current Markdown format:

```markdown
# Documentation audit

- Result: FAIL

| Status | Rule | Path | Detail |
|---|---|---|---|
| FAIL | broken-link | docs/README.md | Missing target: setup.md |
```

A saved failure remains a failure: `next` advances beyond the documentation-audit stage only when the latest applicable report is recognized, current for the configured document set, structurally valid, and passing. A structural pass does not prove that every statement is true or current.

Fresh security and engineering worksheets start with `Unverified` findings. Creating a worksheet does not perform a scan or establish a result. Their commands require documentation initialization first; they do not require a passing documentation audit, so urgent scoped review is not blocked by unfinished prose.

## Three workflows

| Workflow | What it does | Boundary |
|---|---|---|
| Documentation | Creates structured project records and checks required files, placeholders, headings, metadata, and local links. | A structural pass does not prove statements are true or up to date. |
| Security | Creates scoped worksheets for recording evidence, risk, remediation, ownership, and verification against selected controls. | Worksheet creation is not a vulnerability scan and does not certify security or compliance. |
| Engineering | Guides reviews of testing, performance, reliability, API design, maintenance, deployment, operations, and cost. | Recommendations are advisory unless separately enforced or supported by a demonstrated defect. |

The documentation workflow is continuous: each material project change should include a documentation-impact decision and update only the affected records. Security and engineering remain scoped, point-in-time reviews. The versioned catalog contains seven documentation areas, 12 security phases, and 14 engineering topics. Those 33 areas are selectable references, not 33 automatic scans. A project policy can treat a security result as release-blocking, but the package prevents deployment only when an explicit CI or release integration enforces that policy.

## Choose a path

The four onboarding paths preserve the same commands and safety model:

```bash
npx @ghostbyte/agent-docs-kit@latest start new
npx @ghostbyte/agent-docs-kit@latest start existing
npx @ghostbyte/agent-docs-kit@latest start agent
npx @ghostbyte/agent-docs-kit@latest start manual
```

- **New:** establish project records while labeling intended behavior as planned.
- **Existing:** reconcile documentation with code, configuration, tests, and operations.
- **Agent:** install the optional repository skill and give a compatible coding agent a bounded request.
- **Manual:** use focused guides and worksheets without an AI agent.

`next` derives progress from configuration, required documents, starter prompts, the latest applicable documentation audit, and open or invalid worksheets. It does not write a progress file, rerun an audit, contact a service, or authorize active security testing.

## AI-first documentation workflow

`setup` creates the documentation workspace and a root `AGENTS.md` when one does not already exist. That file tells a compatible coding agent to assess documentation impact during each material repository change, update only affected records from evidence, run the documentation audit, and report when no documentation update is necessary. Existing `AGENTS.md` files are always preserved, including with `--force`, so teams must merge the policy deliberately when they already have repository instructions.

`AGENTS.md` is an instruction file, not a running agent. The npm package has no bundled model, watcher, or background service. For agent-assisted maintenance, the user must open a compatible AI coding agent in the repository, ensure it loads the instructions, grant appropriate file access, and request the development work. The manual path follows the same impact loop in `docs/README.md`.

Setup distinguishes repository state without guessing whether a live agent exists:

| Existing state | Safe result |
|---|---|
| Empty or new directory without `AGENTS.md` | Create the documentation scaffold, configuration, and root agent policy. |
| Existing project without `AGENTS.md` | Add the same files non-destructively; existing project files remain untouched. |
| Existing project with `AGENTS.md` | Preserve it exactly and direct the user or calling agent to merge the policy from `docs/README.md` deliberately. |
| Existing `.agents/` containing other skills | Leave those skills untouched; optional installation targets only `.agents/skills/manage-project-quality/`. |
| Existing `manage-project-quality` skill | Skip it unless replacement is explicitly requested with `--force`. |

Use `start new` or `start existing` to declare project maturity. The CLI does not infer that distinction from a package manifest, Git history, or a currently running AI process; those signals do not reliably establish user intent.

Install the optional focused workflow skill for agents that support repository skills:

```bash
npx @ghostbyte/agent-docs-kit@latest skill install --target project --dry-run
npx @ghostbyte/agent-docs-kit@latest skill install --target project
```

The write command creates `.agents/skills/manage-project-quality`. Open or restart the agent so it can discover the repository skill, then use a bounded prompt:

> Use `$manage-project-quality`. Inspect this repository, determine the current Agent Docs stage, and guide me through the next safe step. Do not infer facts without evidence.

### One canonical policy, thin pointer files

`AGENTS.md` is the single canonical policy. Tools that read their own instruction file get a thin pointer that imports it, so the policy is never copied and cannot drift:

```bash
# Create pointer files for specific tools
npx @ghostbyte/agent-docs-kit@latest setup --agents claude,gemini

# Or only for tools this repository already shows signs of using
npx @ghostbyte/agent-docs-kit@latest setup --agents auto
```

Each pointer is a few lines beginning with `@AGENTS.md`. An existing `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` is **never** replaced, including with `--force`; when one lacks the import, the CLI prints the single line to add. `audit documentation` then checks that every configured pointer still imports `AGENTS.md`.

Where a tool documents a project-level skill directory, `skill install --target <agent>` uses it (`--target claude` writes `.claude/skills/`). Every project-level target writes only inside the repository; `--target codex` is the one user-level target and must be requested explicitly.

Installed skills record the CLI version that produced them in `.agent-docs-skill.json`. `next` and `audit documentation` report a copy older than the running CLI and name the refresh command. A mismatch is reported, never failed.

### Generated AGENTS.md defaults

The generated policy carries no author attribution and no hardcoded time zone. Change-record instructions use UTC by default:

```bash
npx @ghostbyte/agent-docs-kit@latest setup --timezone local
npx @ghostbyte/agent-docs-kit@latest setup --timezone Europe/Berlin
npx @ghostbyte/agent-docs-kit@latest setup --attribution "Platform Team"
```

Both are stored in `.agent-docs/config.json` as `timezone` and `attribution`, and a later `setup` inherits them.

Support for `AGENTS.md` and repository skills depends on the coding agent. If an agent does not support the skill, the CLI guides and generated records remain usable manually. Package or skill installation does not grant authority to run active security tests.

Do not send private code, credentials, personal data, or sensitive vulnerability evidence to an AI provider unless your organization permits it and you have reviewed that provider's data policies.

### Commit and push reminders

The read-only suggestion command traces changed Git paths and proposes focused review candidates without creating a worksheet or claiming an audit occurred:

```bash
# Suitable for an explicitly configured pre-commit reminder
npx @ghostbyte/agent-docs-kit@latest suggest reviews --staged

# Suitable for an explicitly configured pre-push or CI comparison
npx @ghostbyte/agent-docs-kit@latest suggest reviews --base origin/main
```

The scoped commands above work without a project installation. After installing the package in a project, the shorter `npx agent-docs suggest reviews ...` form is also available. The output always includes a documentation confirmation and, when path rules match, the relevant security and engineering worksheet commands. It is intentionally advisory: path matching can miss risk and cannot inspect intent. The package does not silently install Git hooks, change Git configuration, or block commits and pushes. Teams can call these commands from their existing hook manager or CI policy when they explicitly choose that integration.

If documentation is not initialized, the suggestion output and any direct worksheet attempt point to `setup --dry-run` followed by `setup`. Worksheet creation is unavailable until `.agent-docs/config.json` and the configured documentation root exist.

## Command reference

### Read-only or non-project-writing commands

| Command | Purpose |
|---|---|
| `start [new\|existing\|agent\|manual]` | Show onboarding paths and ordered instructions. |
| `next` | Inspect project evidence and show the next stage. |
| `suggest reviews [--staged \| --base <git-ref>]` | Trace selected Git changes and print advisory documentation, security, and engineering prompts without writing files. |
| `list documentation\|security\|engineering` | List catalog selectors. |
| `documentation guide <area>` | Print one documentation reference. |
| `audit documentation` | Run structure checks; writes only when `--report` is supplied. |
| `template list` | List available record templates. |
| `validate` | Validate the distributed catalog and content. |
| `doctor` | Report local Node.js and Git prerequisites. |
| `website` | Open the canonical documentation website. |
| `--help`, `--version` | Print the command surface or installed version. |

### Commands that can write files

| Command | Write boundary |
|---|---|
| `setup` | Creates the owned `.agent-docs/` configuration and `docs/` scaffold, plus a protected root `AGENTS.md` only when absent. |
| `audit documentation --report` | Persists a dated audit result in the configured report directory. |
| `security worksheet <phase>` | After documentation initialization, creates a dated, initially Unverified security worksheet. |
| `engineering worksheet <topic>` | After documentation initialization, creates a dated, initially Unverified engineering worksheet. |
| `template create <type> [--name <slug>]` | Creates a collision-safe ADR, runbook, change, incident, or evidence record. |
| `skill install --target project\|codex` | Copies the owned skill to the selected explicit target. |

Use `--dry-run` where supported. Existing files are protected by default; `--force` can replace files owned by the selected command, so inspect its target before using it. Reports and templates preserve earlier records by choosing collision-safe filenames.

Legacy v4 forms `audit security <phase>` and `review engineering <topic>` remain aliases for the canonical worksheet commands.

[`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) states what the CLI surface, exit codes, report formats, configuration schema, owned files, and programmatic API guarantee, and what may change.

### Installation alternatives

Project-local installation modifies the project's package manifest and lockfile:

```bash
npm install --save-dev @ghostbyte/agent-docs-kit@6.2.1
npx agent-docs --version
npx agent-docs setup --dry-run
```

Global installation modifies the npm global prefix, not the target project:

```bash
npm install --global @ghostbyte/agent-docs-kit@6.2.1
agent-docs --version
agent-docs setup --dry-run
```

Installing the package is inert with respect to project setup: there are no `preinstall`, `install`, or `postinstall` hooks. Running `start` or installing the optional skill also does not initialize documentation. Initialization occurs only through the explicit `setup` command, whether invoked through `npx`, a local installation, a global installation, a person, or an authorized AI agent.

## Safety, privacy, and limitations

- Active testing of a service, cloud account, network, credential, or production environment requires explicit authorization for the exact target.
- Never treat an empty or freshly generated worksheet as a completed review. Evidence-supported statuses require an owner and verification step.
- The CLI has no project telemetry service and does not upload source, documentation, or reports to this project.
- npm/npx communicates with the npm registry. Optional AI-agent use is governed by the selected provider and account settings.
- The canonical website is [hosted through Cloudflare Workers](https://agent-docs-kit.ghostbyte1014.workers.dev/). The repository retains GitHub Pages deployment configuration for an optional mirror; canonical metadata points to Cloudflare and does not depend on that mirror being available.
- Review the website [privacy notice](https://agent-docs-kit.ghostbyte1014.workers.dev/privacy.html), [terms](https://agent-docs-kit.ghostbyte1014.workers.dev/terms.html), and [security model](docs/SECURITY_MODEL.md).

Report suspected vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Do not put credentials, private code, personal information, or unredacted exploit evidence in a public issue.

## Documentation and contribution

- [Purpose and boundaries](docs/PURPOSE.md)
- [Architecture and file structure](docs/ARCHITECTURE.md)
- [Content maintenance](docs/CONTENT_MAINTENANCE.md)
- [Security policy](SECURITY.md)
- [Security model](docs/SECURITY_MODEL.md)
- [Testing guide](docs/TESTING_GUIDE.md)
- [Release process](docs/RELEASE_PROCESS.md)
- [GitHub, hosting, and npm setup](docs/GITHUB_AND_NPM_SETUP.md)
- [Changelog](CHANGELOG.md)

General defects and feedback can use the repository's [issue tracker](https://github.com/ghostbyte1014/Agent_Docs_Kit/issues). The feedback template asks reporters not to include secrets or private project content. [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) walks through a safe end-to-end run in a disposable project.

## Development and release

```bash
npm install
npm test
npm run validate
npm run build
npm run smoke:package
npm run release:check
```

There are no runtime dependencies. Publishing is performed only by the authorized version-tag workflow after the documented release checks; ordinary development does not publish npm packages or deploy the site.

## License

[MIT](LICENSE) &copy; ghostbyte1014.
