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
│  ├─ commands/                    # setup, audit, worksheet, template, skill, validation
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

Generated outputs under `build/`, package archives, dependencies, and the maintainer’s local monthly AI prompt are ignored by Git.
