export const helpText = `Agent Docs & Quality Kit

Usage:
  agent-docs                         Open the guided menu (TTY only)
  agent-docs setup [--dry-run]       Install the documentation workspace
  agent-docs audit documentation     Check documentation health
  agent-docs audit security [phase]  Create an evidence-based security worksheet
  agent-docs review engineering [topic]
                                     Create an engineering review worksheet
  agent-docs list [security|engineering]
  agent-docs skill install [--target project|codex] [--dry-run]
  agent-docs validate                Validate this package's catalog and skill
  agent-docs doctor                  Check local prerequisites
  agent-docs --version               Show the package version

Options:
  --cwd <path>             Target project (default: current directory)
  --style standard|learning
  --dry-run                Preview writes without changing files
  --force                  Replace files that this command owns
  --report                 Write documentation audit results
  --help                   Show this help

Installing the npm package performs no project setup. Run a command explicitly.`;
