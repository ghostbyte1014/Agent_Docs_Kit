# Purpose and boundaries

Agent Docs & Quality Kit is a library and command-line interface for establishing repeatable project-quality practices. It unifies three related activities without pretending they have the same consequences.

## Documentation

The documentation workflow preserves project memory. It creates a predictable place for system facts, current scope, decisions, development records, test evidence, operations, future proposals, and superseded material. Its audit detects gaps and drift.

Documentation is not a security boundary. A statement such as “change freeze is on” is a collaboration policy until a hook, branch rule, or CI check enforces it.

## Security

The security workflow assesses controls that protect confidentiality, integrity, availability, and privacy. It requires evidence for every verdict and distinguishes a real pass from an unverified condition. Critical and High failures are release blockers by default.

Passive repository review is safe to start. Active testing of a running service, cloud account, network, credential, or production environment requires explicit authorization for the exact target.

## Engineering

The engineering workflow reviews practices that influence maintainability, reliability, performance, testability, operability, and cost. Its recommendations are contextual and normally non-blocking. A finding that is actually a vulnerability, correctness defect, or data-loss risk is reported separately with the appropriate urgency.

## Interaction styles

`standard` produces concise findings and actions. `learning` adds why a control matters and a practical example. Both modes use the same evidence rules and verdicts.
