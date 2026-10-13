export const helpText = `Agent Docs & Quality Kit

Run without installing:
  npx @ghostbyte/agent-docs-kit@latest [command] [options]

After installing in a project:
  npx agent-docs [command] [options]

Commands:
  (no command)                       Open the guided menu (TTY only)
  setup [--dry-run]                  Install the documentation workspace
  audit documentation                Check documentation health
  audit security [phase]             Create an evidence-based security worksheet
  review engineering [topic]         Create an engineering review worksheet
  list [security|engineering]        List available phases or topics
  skill install [--target project|codex] [--dry-run]
                                     Install the unified quality skill
  validate                           Validate the package catalog and skill
  doctor                             Check local prerequisites
  website                            Open the documentation website
  --version                          Show the package version

Examples:
  npx @ghostbyte/agent-docs-kit@latest setup --dry-run
  npx @ghostbyte/agent-docs-kit@latest audit documentation
  npx @ghostbyte/agent-docs-kit@latest audit security api-layer
  npx @ghostbyte/agent-docs-kit@latest review engineering testing-types
  npx @ghostbyte/agent-docs-kit@latest skill install --target project
  npx @ghostbyte/agent-docs-kit@latest website

Options:
  --cwd <path>             Target project (default: current directory)
  --style standard|learning
  --dry-run                Preview writes without changing files
  --force                  Replace files that this command owns
  --report                 Write documentation audit results
  --help                   Show this help

Installing the npm package performs no project setup. Run a command explicitly.`;
