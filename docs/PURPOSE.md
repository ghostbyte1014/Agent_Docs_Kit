# Purpose and boundaries

Agent Docs & Quality Kit is an AI-first, agent-assisted, evidence-first library and command-line interface for structured project documentation and guided quality reviews. It remains usable manually and unifies three related activities without pretending they have the same consequences.

## Agentic coding

The kit provides durable project context and review instructions for humans and compatible coding agents. `agent-docs setup` creates a protected root `AGENTS.md` when absent so a compatible agent can apply the continuous-documentation contract during later work. The file is policy, not an executable: the kit does not include an AI model, start a background process, or perform a review merely because the npm package was installed.

The CLI creates and checks the project workspace. The optional repository skill under `.agents/skills/manage-project-quality/` teaches a supported agent how to select focused references, inspect evidence, preserve safety boundaries, and write maintainable results. The user still starts the agent session, ensures it loads the repository instructions, supplies the goal, permits file updates, and authorizes any active testing.

An empty directory and an existing project use the same non-destructive setup primitive. The user selects `start new` or `start existing` because project maturity cannot be inferred reliably. Setup creates `AGENTS.md` only when absent; an existing instruction file is preserved exactly and the generated documentation index supplies the policy for deliberate merging. Existing unrelated repository skills are outside the project-skill install target and remain untouched.

Projects that do not use a skill-aware agent can follow the same process manually through `start`, `next`, focused guides, and generated worksheets.

All execution paths initialize documentation before creating security or engineering worksheets. Direct worksheet commands fail with setup guidance when `.agent-docs/config.json` or the configured documentation root is absent. The gate requires initialization, not a passing documentation audit, so an urgent scoped review can proceed without inventing documentation completeness.

## Documentation

The documentation workflow preserves project memory. It creates a predictable place for system facts, current scope, decisions, development records, test evidence, operations, future proposals, and superseded material. Each material change receives a documentation-impact decision; only affected records should change. Its audit detects structural gaps and drift.

`agent-docs suggest reviews` can trace staged paths or compare a branch with a chosen Git base. It prints a documentation reminder and path-based security or engineering review candidates. The heuristic does not create reports, perform reviews, prove safety, install hooks, or change Git configuration.

Documentation is not a security boundary. A statement such as “change freeze is on” is a collaboration policy until a hook, branch rule, or CI check enforces it.

## Security

The security workflow guides review of controls that protect confidentiality, integrity, availability, and privacy. It requires evidence for every verdict and distinguishes a real pass from an unverified condition. A project policy can treat Critical or High failures as release blockers; actual enforcement requires an explicit CI or release control.

Passive repository review is safe to start. Active testing of a running service, cloud account, network, credential, or production environment requires explicit authorization for the exact target.

## Engineering

The engineering workflow reviews practices that influence maintainability, reliability, performance, testability, operability, and cost. Its recommendations are contextual and normally non-blocking. A finding that is actually a vulnerability, correctness defect, or data-loss risk is reported separately with the appropriate urgency.

## Interaction styles

`standard` produces concise findings and actions. `learning` adds why a control matters and a practical example. Both modes use the same evidence rules and verdicts.
