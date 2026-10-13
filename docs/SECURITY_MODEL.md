# Security model

The CLI is inert on installation: `package.json` defines no `preinstall`, `install`, or `postinstall` script. Explicit commands are required to create files.

Project setup skips existing files by default. `--force` is required to replace files owned by a command, and `--dry-run` previews writes. The package does not install Git hooks automatically, execute network scans, read credentials, or contact a telemetry service.

Audit reports begin as `Unverified`. The tool scaffolds the review; it does not claim that generated text proves a control. Agents and reviewers must attach repository paths, line numbers, reproducible command output, or authorized external evidence.

Publishing uses npm provenance through GitHub trusted publishing when configured. Protect the GitHub release environment, require reviews as appropriate, and never store a long-lived npm token when OIDC is available.
