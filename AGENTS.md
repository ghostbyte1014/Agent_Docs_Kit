# Agent instructions

These instructions apply to the entire repository.

## Continuous documentation

Treat documentation as an ongoing project record. Before considering any repository change complete:

1. Inspect the change and `.agent-docs/config.json`.
2. Decide which documentation areas are affected.
3. Update only the affected records with facts supported by code, configuration, tests, or authorized operational evidence.
4. Keep current behavior separate from future proposals and archived material.
5. Record validation evidence and run `node bin/agent-docs.mjs audit documentation --strict`.
6. Summarize the documentation impact. If no document changed, state why the change has no documentation impact.

Before a commit, `node bin/agent-docs.mjs suggest reviews --staged` can provide an advisory documentation confirmation and focused review candidates. Before a push or in CI, use `--base <git-ref>` with an explicit known base. Suggestions do not constitute completed reviews.

Use `docs/README.md` as the local documentation index. Preserve dated evidence and audits instead of rewriting historical results.

## Repository sources of truth

- `src/` owns CLI and programmatic behavior.
- `content/` owns the canonical documentation, security, and engineering guidance.
- `templates/` owns durable record templates.
- `site/` owns the static website source.
- `skills/manage-project-quality/` and `build/` are generated or distributed views; update their canonical inputs and rebuild them.
- Public product and maintainer guidance lives in the tracked Markdown files at the root of `docs/`. The ignored documentation workspace records current local project state and evidence.

## Workflow boundaries

- Documentation maintenance is continuous and accompanies material project changes.
- Security and engineering worksheets are scoped, point-in-time reviews. Do not create or update them merely because code changed.
- Never assign security or engineering conclusions without evidence. Active testing requires explicit authorization for the exact target.
- Markdown policy guides collaboration but does not technically enforce it. Use tests, validation, CI, and branch controls where enforcement is required.

## Validation

Use the narrowest relevant checks while working. Before release, run the complete documented release gate. Never publish the npm package or deploy the website unless the user explicitly authorizes that external action.
