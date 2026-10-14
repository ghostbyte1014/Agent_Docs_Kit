# Security model

The CLI is inert on installation: `package.json` defines no `preinstall`, `install`, or `postinstall` script. Explicit commands are required to create files.

Project setup skips existing files by default. `--force` is required to replace files owned by a command, and `--dry-run` previews writes. The package does not install Git hooks automatically, execute network scans, read credentials, or contact a telemetry service.

Forced scaffold replacement is staged in the destination directory before the owned file is swapped into place. npm packaging uses an explicit public-document allowlist plus a packed-manifest check; local documentation, generated findings, and audit evidence are rejected from the archive even when they exist in the working tree.

Audit reports begin as `Unverified`. The tool scaffolds the review; it does not claim that generated text proves a control. Agents and reviewers must attach repository paths, line numbers, reproducible command output, or authorized external evidence.

The `start` and `next` workflow commands are read-only. `next` derives progress from project files and does not create a hidden state file, contact a service, or authorize active testing. AI guidance requires repository inspection, explicit unknowns, and human authorization before interacting with a live service, cloud account, network, credential, or production environment.

Publishing uses npm provenance through GitHub trusted publishing when configured. Protect the GitHub release environment, require reviews as appropriate, and never store a long-lived npm token when OIDC is available.
