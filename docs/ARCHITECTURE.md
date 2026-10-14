# Architecture and file structure

The package has four layers: CLI/API behavior in `src/`, canonical review content in `content/`, the generated progressive skill in `skills/`, and the static documentation site in `site/`.

```text
Agent_Docs_Kit/
├─ .agent-docs/config.json         # this repository's audit policy
├─ .github/
│  ├─ dependabot.yml               # monthly npm/action update proposals
│  └─ workflows/
│     ├─ ci.yml                    # Node 22/24/26 cross-platform release gate
│     ├─ monthly-health.yml        # scheduled health and review-date check
│     ├─ pages.yml                 # GitHub Pages deployment
│     └─ publish-npm.yml           # npm trusted publishing
├─ bin/agent-docs.mjs              # executable entry point
├─ src/
│  ├─ api/index.mjs                # programmatic exports
│  ├─ cli/                         # parsing, help, and routing
│  ├─ commands/                    # onboarding, state detection, setup, audits, templates, skill
│  └─ core/                        # catalog, config, filesystem, and package paths
├─ content/
│  ├─ catalog.json                 # versioned selectors and review dates
│  ├─ documentation/               # 7 focused areas plus an index
│  ├─ security/                    # 12 focused phases plus an index
│  └─ engineering/                 # 14 focused topics plus an index
├─ templates/                      # ADR, runbook, change, incident, and evidence records
├─ skills/manage-project-quality/
│  ├─ SKILL.md                     # progressive workflow router
│  ├─ agents/openai.yaml           # skill UI metadata
│  ├─ assets/                      # report templates
│  ├─ references/                  # generated focused reference library
│  └─ scripts/check-report.mjs     # report status/evidence validation
├─ scripts/                        # build, validation, preview, and package smoke tests
├─ site/                           # accessible static source
├─ tests/                          # CLI, content, and safety regressions
├─ docs/                           # maintainer and product documentation
├─ CHANGELOG.md
├─ SECURITY.md
├─ LICENSE
├─ README.md
└─ package.json
```

`content/` is the single canonical library for all three workflows. `agent-docs setup` creates `.agent-docs/config.json` and a project documentation tree. Reports are written beneath configured directories; the reference library stays in the npm package and installed skill rather than being duplicated into each project.

`agent-docs start` is a read-only onboarding router for new, existing, AI-assisted, and manual use. `agent-docs next` is a read-only state detector: it derives the current stage from configuration, required documents, starter prompts, saved audits, and open worksheets. It intentionally does not maintain a hidden progress file, so terminal sessions, humans, and coding agents see the same repository-backed state.

Generated outputs under `build/`, package archives, dependencies, and the maintainer’s local monthly AI prompt are ignored by Git. Local consumer-style documentation under the configured `docs/` workspace is also ignored in this repository.

Git ignore rules are not treated as a publishing boundary. `package.json` explicitly lists the six public maintainer guides, `docs/.npmignore` excludes local workspace records, and the packed-installation smoke test rejects every unexpected `docs/` path and every missing declared entry point.
