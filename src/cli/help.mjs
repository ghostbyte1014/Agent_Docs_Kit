import { npxCommand } from "../commands/workflow.mjs";

export const helpText = `Agent Docs & Quality Kit

Evidence-first project documentation and guided quality reviews.
Documentation checks are automated, and its maintained record should evolve with
project changes. Security and engineering worksheets are separate point-in-time
reviews that require evidence and human judgment. The CLI does not run vulnerability scans.
Initialize documentation with 'setup' before creating a security or engineering worksheet.

Run without installing:
  npx @ghostbyte/agent-docs-kit@latest [command] [options]

After installing in a project:
  npx agent-docs [command] [options]

After installing globally:
  agent-docs [command] [options]

Commands:
  (no command)                       Open the guided menu (TTY only)
  start [new|existing|agent|manual]  Show a complete onboarding path
  next                               Detect project state and show the next step
  setup [--dry-run] [--ai]           Create the workspace and protected agent policy
  setup --agents <list>              Add CLAUDE.md / GEMINI.md pointers to AGENTS.md
  suggest reviews [--staged|--base <ref>]
                                     Suggest focused reviews from changed Git paths
  audit documentation [--strict]     Check documentation health
  documentation guide <area>         Print one documentation guidance area
  security worksheet <phase>         Create a scoped security worksheet
  engineering worksheet <topic>      Create a scoped engineering worksheet
  audit security <phase>              Legacy alias for security worksheet
  review engineering <topic>          Legacy alias for engineering worksheet
  list [documentation|security|engineering]
                                     List available areas, phases, or topics
  template list                      List reusable documentation templates
  template create <type> [--name <slug>]
                                     Create a uniquely named documentation record
  skill install --target project|claude|codex
                                     Install the unified quality skill
  validate                           Validate the distributed library
  doctor                             Check prerequisites and report version drift
  website                            Open the documentation website
  --version                          Show the package version

Examples:
  npx @ghostbyte/agent-docs-kit@latest start existing
  npx @ghostbyte/agent-docs-kit@latest next
  npx @ghostbyte/agent-docs-kit@latest setup --dry-run
  npx @ghostbyte/agent-docs-kit@latest setup --dry-run --ai
  npx @ghostbyte/agent-docs-kit@latest setup --ai
  npx @ghostbyte/agent-docs-kit@latest setup --agents claude,gemini
  ${npxCommand} suggest reviews --staged
  ${npxCommand} suggest reviews --base origin/main
  npx @ghostbyte/agent-docs-kit@latest audit documentation --strict --format text
  npx @ghostbyte/agent-docs-kit@latest documentation guide system-documentation
  npx @ghostbyte/agent-docs-kit@latest security worksheet api-layer
  npx @ghostbyte/agent-docs-kit@latest engineering worksheet testing-types
  npx @ghostbyte/agent-docs-kit@latest template create adr --name cache-policy
  npx @ghostbyte/agent-docs-kit@latest skill install --target project
  npx @ghostbyte/agent-docs-kit@latest website

Check or update a global installation:
  agent-docs --version
  npm view @ghostbyte/agent-docs-kit version
  npm install --global @ghostbyte/agent-docs-kit@latest

Options:
  --cwd <path>                Target project (default: current directory)
  --ai                        Set up docs, agent files, and the project skill together
  --agents <list>             claude, gemini, all, auto, or none (setup only)
  --timezone <zone>           UTC (default), local, or an IANA zone for change records
  --attribution <text>        Opt in to a "Created by" line in the generated AGENTS.md
  --style standard|learning   Select concise or teaching-oriented output
  --format text|markdown|json Select documentation-audit output
  --name <slug>               Give a template a lowercase hyphenated name
  --dry-run                   Preview writes without changing files
  --force                     Replace files owned by the command
  --report                    Persist documentation audit results
  --strict                    Fail when documentation checks fail
  --staged                    Inspect staged changes only for review suggestions
  --base <git-ref>            Compare <git-ref>...HEAD for review suggestions
  --help                      Show this help

Recommended first run:
  npx @ghostbyte/agent-docs-kit@latest start

AGENTS.md is the single canonical policy. Pointer files import it with one '@AGENTS.md'
line, so the policy is never copied between tools. An existing AGENTS.md, CLAUDE.md, or
GEMINI.md is never overwritten, including with --force.

Installing the npm package performs no project setup. Run 'start' for a guided path
or 'next' to continue an initialized project.`;
