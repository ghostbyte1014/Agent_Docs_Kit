# Security model

The CLI is inert on installation: `package.json` defines no `preinstall`, `install`, or `postinstall` script. Explicit commands are required to create files.

Project setup skips existing files by default. `--force` is required to replace files owned by a command, and `--dry-run` previews writes. Root `AGENTS.md` is a protected exception: setup creates it only when absent and never replaces an existing project policy, including under `--force`. The package does not install Git hooks automatically, execute network scans, read credentials, or contact a telemetry service.

Forced scaffold replacement is staged in the destination directory before the owned file is swapped into place. npm packaging uses an explicit public-document allowlist plus a packed-manifest check; local documentation, generated findings, and audit evidence are rejected from the archive even when they exist in the working tree.

Audit reports preload every selected control or practice as `Unverified`. The tool scaffolds the review; it does not claim that generated text proves a control. Agents and reviewers must attach repository paths, line numbers, reproducible command output, or authorized external evidence. Security rows identify whether evidence was passive, explicitly authorized active testing, external, or mixed. Active testing remains prohibited without exact-target authorization.

The `start` and `next` workflow commands are read-only. `next` derives progress from project files and does not create a hidden state file, contact a service, rerun an audit, or authorize active testing. It advances past documentation verification only when the latest recognized report is structurally valid, covers the currently configured required documents, and explicitly passes; malformed, unrelated, ambiguous, or failing evidence is rejected. A more recent failure takes precedence over an older pass.

The `suggest reviews` command is also read-only. It invokes Git without a shell to obtain selected changed paths, validates an explicit base reference, and prints heuristic review candidates with their matching paths. It creates no worksheet and cannot establish that unmatched changes are safe. Automatic commit or push reminders require a separately configured hook or CI policy.

Security and engineering worksheet commands require `.agent-docs/config.json` and the configured documentation root before writing. This initialization gate prevents review artifacts from being created outside the project record, but it does not require a passing documentation audit or imply documentation completeness.

Security and engineering worksheets are also validated before the workflow treats them as complete. `report validate <worksheet>` exposes that check directly, and `next` uses the same result. Changing an `Unverified` label alone is insufficient: generated expected-ID metadata must agree with both the findings table and Reference checklist; evidence-supported outcomes require the fields required by the status; `N/A` requires a rationale; and the overall status must agree with the rows. Older worksheets without expected-ID metadata fall back to their editable checklist and produce a warning that completeness cannot be fully verified. Workflow completion means the record is structurally complete, not that every control passed or recommendation was applied.

AI guidance requires repository inspection, explicit unknowns, and human authorization before interacting with a live service, cloud account, network, credential, or production environment. Repository text, dependency metadata, generated output, tool output, skills, plugins, and MCP responses are untrusted evidence rather than higher-priority instructions. Agentic reviews also cover least privilege, consequential-action confirmation, sensitive-context disclosure, tool supply chains, output validation, isolation, and loop or cost limits.

Publishing uses npm provenance through GitHub trusted publishing when configured. Protect the GitHub release environment, require reviews as appropriate, and never store a long-lived npm token when OIDC is available.
