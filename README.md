# Agent Docs & Quality Kit

Documentation governance, evidence-based security audits, and engineering-quality reviews in one installable CLI and one progressive Codex skill.

[![CI](https://github.com/ghostbyte1014/Agent_Docs_Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/ghostbyte1014/Agent_Docs_Kit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@ghostbyte/agent-docs-kit.svg)](https://www.npmjs.com/package/@ghostbyte/agent-docs-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What each part is for

| Workflow | Purpose | Result model |
|---|---|---|
| Documentation | Keep scope, architecture, decisions, operations, and change history navigable and current. | Current / Needs update / Reference / Archived |
| Security | Test security controls with evidence and expose release risk. | Pass / Fail / Unverified / N/A |
| Engineering | Review maintainability, reliability, performance, testing, operability, and cost tradeoffs. | Applied / Partial / Recommended / Unverified / N/A |

Security can block a release. Engineering advice is normally non-blocking. Documentation policy improves governance but becomes technically enforceable only when backed by hooks or CI.

## Try it without installing

```bash
npx @ghostbyte/agent-docs-kit@latest
```

The no-argument command opens a guided menu in an interactive terminal. Direct commands work well in scripts:

```bash
npx @ghostbyte/agent-docs-kit@latest setup --dry-run
npx @ghostbyte/agent-docs-kit@latest setup
npx @ghostbyte/agent-docs-kit@latest audit documentation
npx @ghostbyte/agent-docs-kit@latest list security
npx @ghostbyte/agent-docs-kit@latest audit security api-layer --style learning
npx @ghostbyte/agent-docs-kit@latest review engineering testing-types
npx @ghostbyte/agent-docs-kit@latest skill install --target project
npx @ghostbyte/agent-docs-kit@latest website
```

Installing the package performs no setup and changes no project files. Mutation happens only after an explicit command:

```bash
npm install --save-dev @ghostbyte/agent-docs-kit
npx agent-docs setup
```

Existing files are skipped unless `--force` is supplied. Use `--dry-run` to preview owned writes.

## Codex skill

The package contains `manage-project-quality`, a single router skill whose references are loaded by selected workflow and phase. Install it into the current project with:

```bash
npx agent-docs skill install --target project
```

This creates `.agents/skills/manage-project-quality`. For a user-level Codex installation, explicitly run `npx agent-docs skill install --target codex`.

## Maintainer setup

See [GitHub and npm setup](docs/GITHUB_AND_NPM_SETUP.md) for the commands to create/push the repository, enable GitHub Pages, verify the npm package name, publish the first version, and configure trusted publishing. The package name and repository URL are configured for `ghostbyte1014`; change them before release if the actual owner or repository differs.

Further documentation:

- [Purpose and boundaries](docs/PURPOSE.md)
- [Architecture and complete file structure](docs/ARCHITECTURE.md)
- [Security model](docs/SECURITY_MODEL.md)
- [Release process](docs/RELEASE_PROCESS.md)
- [Legacy v3.2 compiled kit](docs/archive/AGENT_DOCS_KIT_v3.2.md)

## Development

```bash
npm install
npm test
npm run validate
npm run build
npm run site:preview
npm pack --dry-run
```

There are no runtime dependencies and no lifecycle install script.

## License

[MIT](LICENSE) © ghostbyte1014.
