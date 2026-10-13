# Architecture and file structure

The repository separates executable behavior, canonical reference content, the installable skill, project templates, maintainer automation, tests, and the static website.

```text
Agent_Docs_Kit/
├─ .github/
│  └─ workflows/
│     ├─ ci.yml                    # tests, validation, package smoke check
│     ├─ pages.yml                 # GitHub Pages build and deployment
│     └─ publish-npm.yml           # npm trusted-publishing release
├─ bin/
│  └─ agent-docs.mjs               # npm executable entry point
├─ src/
│  ├─ api/
│  │  └─ index.mjs                 # programmatic public exports
│  ├─ cli/
│  │  ├─ arguments.mjs             # option and positional parsing
│  │  ├─ help.mjs                  # command reference
│  │  └─ main.mjs                  # direct-command and menu router
│  ├─ commands/
│  │  ├─ audit.mjs                 # docs/security report creation
│  │  ├─ doctor.mjs                # prerequisite checks
│  │  ├─ list.mjs                  # phase/topic discovery
│  │  ├─ setup.mjs                 # project docs scaffold
│  │  ├─ skill.mjs                 # explicit skill installation
│  │  └─ validate.mjs              # package integrity checks
│  └─ core/
│     ├─ catalog.mjs               # canonical catalog loader
│     ├─ files.mjs                 # safe write/copy primitives
│     └─ paths.mjs                 # package-relative resolution
├─ content/
│  ├─ catalog.json                 # phase/topic IDs, slugs, sources
│  ├─ security/
│  │  ├─ 01-design-architecture.md
│  │  ├─ ...                       # phases 02–11
│  │  ├─ 12-ongoing-operations.md
│  │  └─ full-reference.md         # deep lookup; not loaded by default
│  └─ engineering/
│     ├─ 01-query-performance.md
│     ├─ ...                       # topics 02–08
│     ├─ 09-message-queues.md
│     └─ full-reference.md
├─ skills/
│  └─ manage-project-quality/
│     ├─ agents/
│     │  └─ openai.yaml            # skill UI metadata
│     ├─ assets/
│     │  ├─ documentation-report.md
│     │  ├─ engineering-report.md
│     │  └─ security-report.md
│     ├─ references/
│     │  ├─ documentation-governance.md
│     │  ├─ engineering-protocol.md
│     │  ├─ evidence-and-reporting.md
│     │  ├─ security-protocol.md
│     │  ├─ security-01-....md      # 12 progressive phase files
│     │  └─ engineering-01-....md   # 9 progressive topic files
│     ├─ scripts/
│     │  └─ check-report.mjs
│     └─ SKILL.md                   # concise routing instructions
├─ scripts/
│  ├─ build-site.mjs
│  ├─ build-skill.mjs
│  └─ validate-content.mjs
├─ site/
│  ├─ index.html
│  └─ styles.css
├─ tests/
│  ├─ cli.test.mjs
│  └─ content.test.mjs
├─ build/                           # generated, ignored
│  └─ site/
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ GITHUB_AND_NPM_SETUP.md
│  ├─ PURPOSE.md
│  ├─ RELEASE_PROCESS.md
│  └─ SECURITY_MODEL.md
├─ docs/archive/
│  └─ AGENT_DOCS_KIT_v3.2.md        # retained legacy compiled edition
├─ LICENSE
├─ README.md
└─ package.json
```

## Installed project structure

`agent-docs setup` creates only the starting documents needed to establish ownership and navigation:

```text
.agent-docs/config.json
docs/
├─ README.md
├─ 01-system/overview.md
├─ 02-project/README.md
├─ 03-development/
│  └─ engineering-reviews/
├─ 04-testing/
│  ├─ security-audits/
│  └─ evidence/
├─ 05-operations/README.md
├─ 06-future-enhancements/README.md
└─ archive/README.md
```

The CLI creates audit reports beneath this tree. It does not copy the entire reference library into each consumer project.
