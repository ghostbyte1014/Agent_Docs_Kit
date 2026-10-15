# Architecture and file structure

The package has four layers: CLI/API behavior in `src/`, canonical review content in `content/`, the generated progressive skill in `skills/`, and the static documentation site in `site/`.

```text
Agent_Docs_Kit/
├─ AGENTS.md                         # repository-wide continuous-documentation policy
├─ .agent-docs/config.json         # this repository's audit policy
├─ .github/
│  ├─ dependabot.yml               # monthly npm/action update proposals
│  └─ workflows/
│     ├─ ci.yml                    # Node 22/24/26 cross-platform release gate
│     ├─ monthly-health.yml        # scheduled health and review-date check
│     ├─ pages.yml                 # GitHub Pages mirror deployment
│     └─ publish-npm.yml           # npm trusted publishing
├─ bin/agent-docs.mjs              # executable entry point
├─ src/
│  ├─ api/index.mjs                # programmatic exports
│  ├─ cli/                         # parsing, help, and routing
│  ├─ commands/                    # onboarding, setup, audits, suggestions, templates, skill
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

`content/` is the single canonical library for all three workflows. `agent-docs setup` creates `.agent-docs/config.json`, a project documentation tree, and a root `AGENTS.md` only when one is absent. The protected instruction file is never replaced by setup, including with `--force`. Reports are written beneath configured directories; the reference library stays in the npm package and installed skill rather than being duplicated into each project.

The canonical static website is served from Cloudflare Workers using `wrangler.jsonc`. The GitHub Pages workflow is retained to publish the same built artifact as an optional mirror when Pages is enabled, and generated canonical metadata points to the Cloudflare URL.

`agent-docs start` is a read-only onboarding router for new, existing, AI-assisted, and manual use. `agent-docs next` is a read-only state detector: it derives the current stage from configuration, required documents, starter prompts, the latest applicable audit result, and open or invalid worksheets. Documentation reports are parsed by format and reconciled with the current required-document configuration; failing, malformed, unrelated, incomplete, or ambiguous evidence fails closed. It intentionally does not maintain a hidden progress file, so terminal sessions, humans, and coding agents see the same repository-backed state.

`agent-docs suggest reviews` is a read-only Git-path classifier. Its default mode combines staged, unstaged, and untracked non-ignored paths; `--staged` limits the input to the index, and `--base <git-ref>` compares that ref with `HEAD`. It maps high-signal path patterns to catalog entries, prints the matched paths and reason, and creates no worksheet. It does not analyze code semantics, install Git hooks, modify Git configuration, or treat an absent match as evidence that no review is needed.

Security and engineering worksheet creation calls the shared documentation-initialization check first. The check requires `.agent-docs/config.json` and the configured documentation root. It intentionally does not require an audit pass: initialization establishes the project record and destinations, while evidence collection and documentation completion can continue independently.

The AI-first maintenance path has three distinct parts: setup supplies the durable repository policy, optional skill installation supplies focused workflow instructions, and the user's compatible coding agent executes the work with granted repository access. None of those files launches an agent or creates a background process.

New and existing projects share the same non-destructive setup implementation. The explicit `start new` and `start existing` paths change guidance, not write semantics. Setup checks whether root `AGENTS.md` exists; absence permits creation, while presence always produces a skip even under `--force`. The skill installer operates only on its named destination, so sibling skills are not part of its replacement boundary.

Generated outputs under `build/`, package archives, dependencies, and the maintainer’s local monthly AI prompt are ignored by Git. Local consumer-style documentation under the configured `docs/` workspace is also ignored in this repository.

Git ignore rules are not treated as a publishing boundary. `package.json` explicitly lists the public guides, `docs/.npmignore` excludes local workspace records, and the packed-installation smoke test rejects every unexpected `docs/` path and every missing declared entry point.
