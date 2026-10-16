# Agent instructions

## Continuous documentation

Treat documentation as an ongoing project record. Before considering any repository change complete:

1. Inspect the change and `.agent-docs/config.json`.
2. Decide which documentation areas are affected.
3. Update only the affected records with facts supported by code, configuration, tests, or authorized operational evidence.
4. Keep current behavior separate from proposals and archived material.
5. Record validation evidence and run `npx @ghostbyte/agent-docs-kit@latest audit documentation --strict`.
6. Summarize the documentation impact. If no document changed, state why the change has no documentation impact.

Use `docs/README.md` as the project documentation index. Preserve existing records and append dated evidence instead of rewriting history.

This file supplies instructions; it does not run an agent. A compatible AI coding agent must be active in this repository, read these instructions, and have permission to update project files.

## Workflow boundaries

- Documentation maintenance is continuous and accompanies material project changes.
- Security and engineering worksheets are scoped, point-in-time reviews. Do not create or update them merely because code changed.
- Never assign security or engineering conclusions without evidence. Active testing requires explicit authorization for the exact target.
- Agent instructions are governance guidance, not technical enforcement. Follow repository CI and review controls where they exist.
