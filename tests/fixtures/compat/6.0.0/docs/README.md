# Project documentation

This directory is the maintained project record. Documentation grows with the project; security and engineering worksheets remain separate, scoped reviews.

## Start here

1. Replace the starter prompts in `01-system/overview.md`, `02-project/README.md`, and `05-operations/README.md` with verified project facts.
2. Choose how to complete the baseline:
   - AI-assisted: install the project skill with `npx @ghostbyte/agent-docs-kit@latest skill install --target project`, restart the AI session if needed, then ask it to use `$manage-project-quality` and inspect repository evidence.
   - Manual: run `npx @ghostbyte/agent-docs-kit@latest list documentation`, then open one focused area with `documentation guide <area>`.
3. Run `npx @ghostbyte/agent-docs-kit@latest audit documentation --strict --report --format markdown`.
4. Run `npx @ghostbyte/agent-docs-kit@latest next` whenever you need the next project-specific action.

Generated structure is not proof of completeness. Keep unknowns explicit, label planned behavior as planned, and never assign a security result without evidence.

## Maintain documentation with every change

Every repository change receives a documentation-impact check before it is complete:

1. Inspect the changed behavior, configuration, tests, dependencies, and operating assumptions.
2. Update only the affected areas below. Do not touch every document merely to create activity.
3. Support current-state claims with repository or authorized operational evidence.
4. Record durable decisions, material implementation changes, test evidence, and operational changes in the appropriate area.
5. Run `npx @ghostbyte/agent-docs-kit@latest audit documentation --strict` after the update. Add `--report --format markdown` when a durable point-in-time audit is needed.
6. In the change or review summary, list the documentation updated or explain why no documentation change was necessary.

For AI-assisted work, the protected root `AGENTS.md` created when absent carries the same maintenance contract. Existing `AGENTS.md` files are never overwritten; merge this policy into existing instructions deliberately. Manual users follow this section directly.

The workflow is AI-first and agent-assisted, not an unattended background service. `AGENTS.md` does not execute by itself: a compatible coding agent must be active, must load the repository instructions, and must be allowed to edit these records. Run `npx @ghostbyte/agent-docs-kit@latest suggest reviews --staged` before a commit, or compare a pushed branch with `npx @ghostbyte/agent-docs-kit@latest suggest reviews --base <git-ref>`, to receive advisory review candidates. These commands do not edit files or perform an audit.

Documentation maintenance does not automatically start a security or engineering review. This workspace must be initialized before those worksheets can be created. Select them only for a risk, release gate, or engineering question, and complete them from evidence.

## Areas

- `01-system/`: system scope, architecture, data, and security design
- `02-project/`: requirements, roadmap, decisions, and status
- `03-development/`: implementation notes and engineering reviews
- `04-testing/`: test plans, security audits, and evidence
- `05-operations/`: setup, deployment, runbooks, and agent operations
- `06-future-proposals/`: proposals that are not current commitments
- `archive/`: superseded material retained for traceability
