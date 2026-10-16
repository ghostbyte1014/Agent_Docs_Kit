# Project documentation

This directory is the maintained project record. Keep decisions and system facts separate from generated audit evidence.

## Start here

1. Replace the starter prompts in `01-system/overview.md`, `02-project/README.md`, and `05-operations/README.md` with verified project facts.
2. Choose how to complete the baseline:
   - AI-assisted: install the project skill with `npx @ghostbyte/agent-docs-kit@latest skill install --target project`, restart the AI session if needed, then ask it to use `$manage-project-quality` and inspect repository evidence.
   - Manual: run `npx @ghostbyte/agent-docs-kit@latest list documentation`, then open one focused area with `documentation guide <area>`.
3. Run `npx @ghostbyte/agent-docs-kit@latest audit documentation --strict --report --format markdown`.
4. Run `npx @ghostbyte/agent-docs-kit@latest next` whenever you need the next project-specific action.

Generated structure is not proof of completeness. Keep unknowns explicit, label planned behavior as planned, and never assign a security result without evidence.

- `01-system/`: system scope, architecture, data, and security design
- `02-project/`: requirements, roadmap, decisions, and status
- `03-development/`: implementation notes and engineering reviews
- `04-testing/`: test plans, security audits, and evidence
- `05-operations/`: setup, deployment, runbooks, and agent operations
- `06-future-proposals/`: proposals that are not current commitments
- `archive/`: superseded material retained for traceability
