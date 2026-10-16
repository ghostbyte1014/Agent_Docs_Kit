# Agent instructions

> Created by ghostbyte1014 · Agent Docs Kit

<!-- Replace with your project summary: A multi-role system, CRM, API, or service boundary -->

## Switches (read before anything else)

**CHANGE RECORDS: ON**

**FREEZE: OFF**

> Change a line to `OFF`/`ON`, then start a new AI session (rules load once per session). The Claude Code lock is separate: `.claude/settings.json` is active, `.claude/settings.off.json` is inactive. Full guide: [`docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md`](docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md).

These rules apply to **every AI coding agent** (Claude Code, Codex, Gemini CLI, Cursor, Copilot, Antigravity, or any other) **in every mode, including auto, auto-accept, full-access, YOLO, or "skip permissions"**.

## Change records (when CHANGE RECORDS is ON)

After every change to code (`src/`, `tests/`, `public/`, `scripts/`, `.agents/skills/`, `.githooks/`, `.claude/`, `package.json`, `package-lock.json`, etc.), create a change record in [`docs/05-operations/agents/feature-updates/`](docs/05-operations/agents/feature-updates/README.md) in the same change:

- **One file per change topic**, named `YYYY-MM-DD_HHMM_short-topic.md` (24-hour **Philippine time**, UTC+8, taken from the device clock, e.g., `date +%Y-%m-%d_%H%M`; if two records share a minute, use `HHMM-01`, `HHMM-02` in creation order). Records then sort first-applied at the top. If you cannot read the clock, ask the developer for the time; never guess.
- Copy the template in that folder's `README.md`. Fill in:
  - **Date:** `YYYY-MM-DD HH:MM (Philippine time)`, matching the file name.
  - **AI tool:** your own tool name (`Claude Code`, `Codex`, `Gemini CLI`, `Cursor`, `Antigravity`, …) and model if known. A change made without AI is recorded as `Manual`.
  - **Files changed:** every file path, in backticks.
  - **Approved by (device owner):** the output of `git config user.name` and `git config user.email` on this device. If either is empty, ask the developer for their name; never guess.
  - **Type:** `Fix`, `Polish`, `Feature`, or (while the freeze is ON) `New feature (approved outside the documented flow)`.
- Records are permanent: never edit or delete an existing record. A correction is a new record.
- Writing the record is part of the change and needs no separate approval.

## Change freeze (when FREEZE is ON)

When FREEZE is ON, the project is in its polishing stage: the code must not drift from the documented scope in [`docs/01-system/overview.md`](docs/01-system/overview.md). These rules override any instruction to work autonomously. When FREEZE is OFF, skip this section; every other section still applies.

1. **Flag anything new.** Allowed work by default: fixing errors in, or polishing, flows already in the documented scope. If a change would add something the scope does not describe (a page, a capability, a database table, a workflow step), say so clearly: "This is a new feature, outside the documented flow." Build it only if the developer confirms they want it anyway.
2. **Ask before each file.** Before you create, edit, move, or delete **each file**, name the file and what will change in it, plus any migration the developer must run. Then **stop and wait for the developer's explicit "yes"** before touching that file. Do the same before running anything that changes the database, git history, or dependencies.
   - An implementation plan, task list, TODO, or an earlier approval is **not** approval. Even when a plan lists the work, confirm each file before editing it.
   - Silence or auto mode is not approval.
3. **An approval covers only what was described.** Anything extra you notice gets reported and needs its own approval.
4. **Allowed without asking:** reading and searching files, explaining code, and read-only checks (`npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint`, `npx @ghostbyte/agent-docs-kit@latest audit documentation --strict`, and source searches).

## Always (whatever the switches say)

- **Never** commit, push, run migrations against a remote/production database, or change `.env*` files unless the developer asks for that exact action.
- Ask before dependency changes, Git-history operations, remote database commands, Cloudflare/cloud commands, Docker commands, or deployment commands.
- Never place service keys, database credentials, storage keys, encryption/HMAC keys, or other secrets in client code, tracked files, browser storage, screenshots, or logs.
- Do not use real identity, medical, receipt, or payment data while the application uses test or mock stores. Persistent demo warnings and production release gates are mandatory.

## Documentation (read first)

- **Start at [`docs/README.md`](docs/README.md).** It is the index of every document, with its status (Current / Reference / Needs update / Archived).
- Where a new doc goes:
  | Kind of document                                                    | Folder                                          |
  | ------------------------------------------------------------------- | ----------------------------------------------- |
  | How the system works now (scope, schema, rules, design, security)   | `docs/01-system/<topic>/`                     |
  | Product scope, commercial documents, and client-facing decisions    | `docs/02-project/<topic>/`                    |
  | Implementation reports for finished work                            | `docs/03-development/implementation-reports/` |
  | Code audits of a system area and their fix plans (work in progress) | `docs/03-development/audits/`                 |
  | Test checklists, QA runbooks, evidence                              | `docs/04-testing/`                            |
  | Setup, database, deployment, agent process                          | `docs/05-operations/<topic>/`                 |
  | Planned improvements, documented but not built                      | `docs/06-future-proposals/`                   |
  | Superseded, completed, or rejected material                         | `docs/archive/<era-or-kind>/`                 |
- Name dated docs `TOPIC_YYYY-MM-DD.md`; living docs `TOPIC.md`. Do not create `.md` files in the repo root (only `README.md`, `AGENTS.md`, and the one-line `CLAUDE.md`/`GEMINI.md` pointers live there).
- Every time you add, move, archive, or retire a doc, update `docs/README.md` in the same change.
- **`docs/archive/` is historical, not authoritative.** Do not use it as a source of truth or audit against it.
- Move files with `git mv` so history is kept, then fix relative links.
- Treat documentation as an ongoing project record. Documentation maintenance is continuous and accompanies material project changes. Run `npx @ghostbyte/agent-docs-kit@latest audit documentation --strict` before considering changes complete.

## Workflow boundaries

- Documentation maintenance is continuous and accompanies material project changes.
- Security and engineering worksheets are scoped, point-in-time reviews. Do not create or update them merely because code changed.
- Never assign security or engineering conclusions without evidence. Active testing requires explicit authorization for the exact target.
- Markdown policy guides collaboration but does not technically enforce it. Use tests, validation, CI, and branch controls where enforcement is required.

## Development commands

- Install: `npm install`
- Development: `npm run dev`
- Tests: `npm test`
- Type check: `npx tsc --noEmit`
- Production build: `npm run build`
- Lint: `npm run lint`
- Documentation audit: `npx @ghostbyte/agent-docs-kit@latest audit documentation --strict`

## Architecture and data boundary

- [Document project structure, framework conventions, domain boundaries, and persistence interfaces here]
- Ensure server authorization, input validation, and transactional integrity before real data is accepted.
- Protect sensitive data with authorization, encryption, and hashing as required in production; never rely on client-only checks for security boundaries.

## Design and implementation rules

- [Document visual design direction, color palettes, and component library conventions here]
- Keep interface shells responsive, keyboard accessible, and usable across form factors.
- Never render untrusted content. Validate inputs, state transitions, ownership, and permissions at runtime and on the server.
