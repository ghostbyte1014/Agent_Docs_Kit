# Agent Docs & Quality Kit

Documentation governance, evidence-based security assurance, and engineering-quality reviews in one installable CLI and one progressive Codex skill.

[![CI](https://github.com/ghostbyte1014/Agent_Docs_Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/ghostbyte1014/Agent_Docs_Kit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@ghostbyte/agent-docs-kit.svg)](https://www.npmjs.com/package/@ghostbyte/agent-docs-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

| Workflow | Purpose | Result model |
|---|---|---|
| Documentation | Keep scope, architecture, decisions, operations, and history navigable and current. | Check results plus configurable templates and reports |
| Security | Review security controls against evidence and expose release risk. | Pass / Fail / Unverified / N/A |
| Engineering | Review reliability, maintainability, performance, testing, operability, and cost. | Applied / Partial / Recommended / Unverified / N/A |

Security can block a release. Engineering advice is normally non-blocking. Documentation policy improves governance but is technically enforced only when CI or another control runs it.

## Run without installing

Requires Node.js 22 or newer.

```bash
npx @ghostbyte/agent-docs-kit@latest
npx @ghostbyte/agent-docs-kit@latest setup --dry-run
npx @ghostbyte/agent-docs-kit@latest list documentation
npx @ghostbyte/agent-docs-kit@latest documentation guide system-documentation
npx @ghostbyte/agent-docs-kit@latest audit documentation --strict
npx @ghostbyte/agent-docs-kit@latest list security
npx @ghostbyte/agent-docs-kit@latest security worksheet api-layer
npx @ghostbyte/agent-docs-kit@latest list engineering
npx @ghostbyte/agent-docs-kit@latest engineering worksheet reliability-slos
npx @ghostbyte/agent-docs-kit@latest template create adr --name cache-policy
```

The no-argument command opens a guided menu in an interactive terminal. Installation performs no setup and changes no project files.

The canonical library contains seven documentation areas, 12 security phases, and 14 engineering topics under `content/`. The generated skill loads only the selected reference instead of placing all 33 areas in context.

## Choose a starting path

The kit now separates first-time onboarding from the individual tools:

```bash
# Show all paths without changing files
npx @ghostbyte/agent-docs-kit@latest start

# Show one complete path
npx @ghostbyte/agent-docs-kit@latest start new
npx @ghostbyte/agent-docs-kit@latest start existing
npx @ghostbyte/agent-docs-kit@latest start agent
npx @ghostbyte/agent-docs-kit@latest start manual

# Inspect an initialized project and receive its next action
npx @ghostbyte/agent-docs-kit@latest next
```

`next` derives progress from the repository: configuration, required documents, scaffold prompts, saved documentation audits, and open security or engineering worksheets. It does not depend on terminal-session memory and does not write files.

For AI-assisted work, install the repository-scoped skill, restart the AI session if needed, then prompt:

> Use `$manage-project-quality`. Inspect this repository, determine the current Agent Docs stage, and guide me through the next safe step. Do not infer facts without evidence.

If a user gives only the npm package or skill to an AI, the agent should inspect before acting, explain proposed writes, distinguish planned behavior from implemented behavior, and request authorization before active security testing. Package installation alone does not initialize files, run reviews, or grant authority.

## Install the command

Project-local installation:

```bash
npm install --save-dev @ghostbyte/agent-docs-kit@latest
npx agent-docs --version
npx agent-docs setup --dry-run
```

Global installation:

```bash
npm install --global @ghostbyte/agent-docs-kit@latest
agent-docs --version
agent-docs setup --dry-run
```

Setup files are skipped unless `--force` is explicit. Reports and templates preserve earlier records by selecting a numbered filename; use `--name <slug>` to name a template explicitly. Configure paths and required documents in `.agent-docs/config.json` after setup.

## Install the Codex skill

```bash
npx @ghostbyte/agent-docs-kit@latest skill install --target project
```

This creates `.agents/skills/manage-project-quality`. Use `--target codex` only when you intentionally want a user-level skill available to future projects.

## Documentation

- [Purpose and boundaries](docs/PURPOSE.md)
- [Architecture and file structure](docs/ARCHITECTURE.md)
- [Content maintenance](docs/CONTENT_MAINTENANCE.md)
- [Security policy](SECURITY.md)
- [Security model](docs/SECURITY_MODEL.md)
- [Release process](docs/RELEASE_PROCESS.md)
- [GitHub and npm setup](docs/GITHUB_AND_NPM_SETUP.md)
- [Changelog](CHANGELOG.md)

## Development

```bash
npm install
npm run release:check
npm run site:preview
```

There are no runtime dependencies and no install lifecycle script.

## License

[MIT](LICENSE) © ghostbyte1014.
