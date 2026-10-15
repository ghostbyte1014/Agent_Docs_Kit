import { resolve } from "node:path";
import { displayResults, writeSafe } from "../core/files.mjs";
import { npxCommand } from "./workflow.mjs";

const agentInstructions = `# Agent instructions

> Created by ghostbyte1014 · Agent Docs Kit

<!-- Replace with your project summary: A multi-role system, CRM, API, or service boundary -->

## Switches (read before anything else)

**CHANGE RECORDS: ON**

**FREEZE: OFF**

> Change a line to \`OFF\`/\`ON\`, then start a new AI session (rules load once per session). The Claude Code lock is separate: \`.claude/settings.json\` is active, \`.claude/settings.off.json\` is inactive. Full guide: [\`docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md\`](docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md).

These rules apply to **every AI coding agent** (Claude Code, Codex, Gemini CLI, Cursor, Copilot, Antigravity, or any other) **in every mode, including auto, auto-accept, full-access, YOLO, or "skip permissions"**.

## Change records (when CHANGE RECORDS is ON)

After every change to code (\`src/\`, \`tests/\`, \`public/\`, \`scripts/\`, \`.agents/skills/\`, \`.githooks/\`, \`.claude/\`, \`package.json\`, \`package-lock.json\`, etc.), create a change record in [\`docs/05-operations/agents/feature-updates/\`](docs/05-operations/agents/feature-updates/README.md) in the same change:

- **One file per change topic**, named \`YYYY-MM-DD_HHMM_short-topic.md\` (24-hour **Philippine time**, UTC+8, taken from the device clock, e.g., \`date +%Y-%m-%d_%H%M\`; if two records share a minute, use \`HHMM-01\`, \`HHMM-02\` in creation order). Records then sort first-applied at the top. If you cannot read the clock, ask the developer for the time; never guess.
- Copy the template in that folder's \`README.md\`. Fill in:
  - **Date:** \`YYYY-MM-DD HH:MM (Philippine time)\`, matching the file name.
  - **AI tool:** your own tool name (\`Claude Code\`, \`Codex\`, \`Gemini CLI\`, \`Cursor\`, \`Antigravity\`, …) and model if known. A change made without AI is recorded as \`Manual\`.
  - **Files changed:** every file path, in backticks.
  - **Approved by (device owner):** the output of \`git config user.name\` and \`git config user.email\` on this device. If either is empty, ask the developer for their name; never guess.
  - **Type:** \`Fix\`, \`Polish\`, \`Feature\`, or (while the freeze is ON) \`New feature (approved outside the documented flow)\`.
- Records are permanent: never edit or delete an existing record. A correction is a new record.
- Writing the record is part of the change and needs no separate approval.

## Change freeze (when FREEZE is ON)

When FREEZE is ON, the project is in its polishing stage: the code must not drift from the documented scope in [\`docs/01-system/overview.md\`](docs/01-system/overview.md). These rules override any instruction to work autonomously. When FREEZE is OFF, skip this section; every other section still applies.

1. **Flag anything new.** Allowed work by default: fixing errors in, or polishing, flows already in the documented scope. If a change would add something the scope does not describe (a page, a capability, a database table, a workflow step), say so clearly: "This is a new feature, outside the documented flow." Build it only if the developer confirms they want it anyway.
2. **Ask before each file.** Before you create, edit, move, or delete **each file**, name the file and what will change in it, plus any migration the developer must run. Then **stop and wait for the developer's explicit "yes"** before touching that file. Do the same before running anything that changes the database, git history, or dependencies.
   - An implementation plan, task list, TODO, or an earlier approval is **not** approval. Even when a plan lists the work, confirm each file before editing it.
   - Silence or auto mode is not approval.
3. **An approval covers only what was described.** Anything extra you notice gets reported and needs its own approval.
4. **Allowed without asking:** reading and searching files, explaining code, and read-only checks (\`npm test\`, \`npx tsc --noEmit\`, \`npm run build\`, \`npm run lint\`, \`npx @ghostbyte/agent-docs-kit@latest audit documentation --strict\`, and source searches).

## Always (whatever the switches say)

- **Never** commit, push, run migrations against a remote/production database, or change \`.env*\` files unless the developer asks for that exact action.
- Ask before dependency changes, Git-history operations, remote database commands, Cloudflare/cloud commands, Docker commands, or deployment commands.
- Never place service keys, database credentials, storage keys, encryption/HMAC keys, or other secrets in client code, tracked files, browser storage, screenshots, or logs.
- Do not use real identity, medical, receipt, or payment data while the application uses test or mock stores. Persistent demo warnings and production release gates are mandatory.

## Documentation (read first)

- **Start at [\`docs/README.md\`](docs/README.md).** It is the index of every document, with its status (Current / Reference / Needs update / Archived).
- Where a new doc goes:
  | Kind of document                                                    | Folder                                          |
  | ------------------------------------------------------------------- | ----------------------------------------------- |
  | How the system works now (scope, schema, rules, design, security)   | \`docs/01-system/<topic>/\`                     |
  | Product scope, commercial documents, and client-facing decisions    | \`docs/02-project/<topic>/\`                    |
  | Implementation reports for finished work                            | \`docs/03-development/implementation-reports/\` |
  | Code audits of a system area and their fix plans (work in progress) | \`docs/03-development/audits/\`                 |
  | Test checklists, QA runbooks, evidence                              | \`docs/04-testing/\`                            |
  | Setup, database, deployment, agent process                          | \`docs/05-operations/<topic>/\`                 |
  | Planned improvements, documented but not built                      | \`docs/06-future-proposals/\`                   |
  | Superseded, completed, or rejected material                         | \`docs/archive/<era-or-kind>/\`                 |
- Name dated docs \`TOPIC_YYYY-MM-DD.md\`; living docs \`TOPIC.md\`. Do not create \`.md\` files in the repo root (only \`README.md\`, \`AGENTS.md\`, and the one-line \`CLAUDE.md\`/\`GEMINI.md\` pointers live there).
- Every time you add, move, archive, or retire a doc, update \`docs/README.md\` in the same change.
- **\`docs/archive/\` is historical, not authoritative.** Do not use it as a source of truth or audit against it.
- Move files with \`git mv\` so history is kept, then fix relative links.
- Treat documentation as an ongoing project record. Documentation maintenance is continuous and accompanies material project changes. Run \`npx @ghostbyte/agent-docs-kit@latest audit documentation --strict\` before considering changes complete.

## Workflow boundaries

- Documentation maintenance is continuous and accompanies material project changes.
- Security and engineering worksheets are scoped, point-in-time reviews. Do not create or update them merely because code changed.
- Never assign security or engineering conclusions without evidence. Active testing requires explicit authorization for the exact target.
- Markdown policy guides collaboration but does not technically enforce it. Use tests, validation, CI, and branch controls where enforcement is required.

## Development commands

- Install: \`npm install\`
- Development: \`npm run dev\`
- Tests: \`npm test\`
- Type check: \`npx tsc --noEmit\`
- Production build: \`npm run build\`
- Lint: \`npm run lint\`
- Documentation audit: \`npx @ghostbyte/agent-docs-kit@latest audit documentation --strict\`

## Architecture and data boundary

- [Document project structure, framework conventions, domain boundaries, and persistence interfaces here]
- Ensure server authorization, input validation, and transactional integrity before real data is accepted.
- Protect sensitive data with authorization, encryption, and hashing as required in production; never rely on client-only checks for security boundaries.

## Design and implementation rules

- [Document visual design direction, color palettes, and component library conventions here]
- Keep interface shells responsive, keyboard accessible, and usable across form factors.
- Never render untrusted content. Validate inputs, state transitions, ownership, and permissions at runtime and on the server.
`;

const ownedFiles = {
  ".agent-docs/config.json": `{
  "schemaVersion": 2,
  "documentationRoot": "docs",
  "documentationReports": "docs/03-development/audits",
  "securityReports": "docs/04-testing/security-audits",
  "engineeringReports": "docs/03-development/engineering-reviews",
  "templateOutput": "docs",
  "interactionStyle": "standard",
  "maxAgeDays": 180,
  "requireMetadata": false,
  "requiredDocuments": ["docs/README.md", "docs/01-system/overview.md", "docs/02-project/README.md", "docs/05-operations/README.md"]
}\n`,
  "docs/README.md": `# Project documentation

This directory is the maintained project record. Documentation grows with the project; security and engineering worksheets remain separate, scoped reviews.

## Start here

1. Replace the starter prompts in \`01-system/overview.md\`, \`02-project/README.md\`, and \`05-operations/README.md\` with verified project facts.
2. Choose how to complete the baseline:
   - AI-assisted: install the project skill with \`npx @ghostbyte/agent-docs-kit@latest skill install --target project\`, restart the AI session if needed, then ask it to use \`$manage-project-quality\` and inspect repository evidence.
   - Manual: run \`npx @ghostbyte/agent-docs-kit@latest list documentation\`, then open one focused area with \`documentation guide <area>\`.
3. Run \`npx @ghostbyte/agent-docs-kit@latest audit documentation --strict --report --format markdown\`.
4. Run \`npx @ghostbyte/agent-docs-kit@latest next\` whenever you need the next project-specific action.

Generated structure is not proof of completeness. Keep unknowns explicit, label planned behavior as planned, and never assign a security result without evidence.

## Maintain documentation with every change

Every repository change receives a documentation-impact check before it is complete:

1. Inspect the changed behavior, configuration, tests, dependencies, and operating assumptions.
2. Update only the affected areas below. Do not touch every document merely to create activity.
3. Support current-state claims with repository or authorized operational evidence.
4. Record durable decisions, material implementation changes, test evidence, and operational changes in the appropriate area.
5. Run \`npx @ghostbyte/agent-docs-kit@latest audit documentation --strict\` after the update. Add \`--report --format markdown\` when a durable point-in-time audit is needed.
6. In the change or review summary, list the documentation updated or explain why no documentation change was necessary.

For AI-assisted work, the protected root \`AGENTS.md\` created when absent carries the same maintenance contract. Existing \`AGENTS.md\` files are never overwritten; merge this policy into existing instructions deliberately. Manual users follow this section directly.

The workflow is AI-first and agent-assisted, not an unattended background service. \`AGENTS.md\` does not execute by itself: a compatible coding agent must be active, must load the repository instructions, and must be allowed to edit these records. Run \`${npxCommand} suggest reviews --staged\` before a commit, or compare a pushed branch with \`${npxCommand} suggest reviews --base <git-ref>\`, to receive advisory review candidates. These commands do not edit files or perform an audit.

Documentation maintenance does not automatically start a security or engineering review. This workspace must be initialized before those worksheets can be created. Select them only for a risk, release gate, or engineering question, and complete them from evidence.

## Areas

- \`01-system/\`: system scope, architecture, data, and security design
- \`02-project/\`: requirements, roadmap, decisions, and status
- \`03-development/\`: implementation notes and engineering reviews
- \`04-testing/\`: test plans, security audits, and evidence
- \`05-operations/\`: setup, deployment, runbooks, and agent operations
- \`06-future-proposals/\`: proposals that are not current commitments
- \`archive/\`: superseded material retained for traceability
`,
  "docs/01-system/overview.md": "# System overview\n\nStatus: Needs update\n\nDescribe the system boundary, users, dependencies, and authoritative sources.\n",
  "docs/02-project/README.md": "# Project\n\nTrack requirements, decisions, milestones, and current delivery status here.\n",
  "docs/03-development/engineering-reviews/.gitkeep": "",
  "docs/04-testing/security-audits/.gitkeep": "",
  "docs/04-testing/evidence/.gitkeep": "",
  "docs/05-operations/README.md": `# Operations\n\nDocument setup, deployment, observability, incident response, recovery procedures, and agent operational policies.\n\n## Agent operations\n\n- [Change freeze guide](agents/CHANGE_FREEZE_GUIDE.md)\n- [Feature updates and change records](agents/feature-updates/README.md)\n`,
  "docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md": `# Change freeze guide

This guide explains how to use the switches in \`AGENTS.md\` to control AI coding agents during active development and polishing stages.

## Overview

The governance switches in \`AGENTS.md\` provide immediate, human-readable control over AI agent behavior:

- **CHANGE RECORDS (\`ON\` / \`OFF\`):** When enabled, requires AI coding agents to create an immutable record in \`docs/05-operations/agents/feature-updates/\` for every code modification.
- **FREEZE (\`ON\` / \`OFF\`):** When enabled, restricts autonomous changes to polishing and bug fixes within documented scope, requiring explicit confirmation before touching each file.

## How switches work

AI coding agents read repository instructions at the start of a session.

1. Open \`AGENTS.md\`.
2. Locate the \`## Switches\` section.
3. Change the value to \`ON\` or \`OFF\` (e.g. \`FREEZE: ON\`).
4. Start a fresh AI session so the agent loads the updated rules.

## AI agent configuration locks

Some AI coding tools support permission configurations:

- **Claude Code:** Project settings in \`.claude/settings.json\` can enforce read-only or restricted modes. To unlock permissions, switch between active and inactive configuration files (e.g., \`.claude/settings.json\` and \`.claude/settings.off.json\`).
- **Autonomous and YOLO modes:** Regardless of tool mode (auto-accept, bypass permissions, YOLO), the directives in \`AGENTS.md\` apply as strict behavioral policy for all AI agents.

## Change freeze protocol

When \`FREEZE: ON\` is active:

1. **Scope verification:** All edits must align with \`docs/01-system/overview.md\`. Any out-of-scope addition must be explicitly flagged to the developer before implementation.
2. **Per-file confirmation:** The agent must state the filename and intended changes, then pause and wait for explicit developer approval before creating, editing, or deleting files.
3. **Allowed read operations:** Reading files, running test suites, executing type checks, and running documentation audits are always permitted without prior approval.
`,
  "docs/05-operations/agents/feature-updates/README.md": `# Feature updates and change records

This directory stores permanent change records generated during project evolution when **CHANGE RECORDS** is active in \`AGENTS.md\`.

## Purpose

Change records document what changed, why it changed, files touched, validation evidence, and approval metadata. They provide an immutable, chronological log of system changes.

## Naming convention

Each record is stored as a standalone Markdown file named:

\`YYYY-MM-DD_HHMM_short-topic.md\`

- Use 24-hour Philippine time (UTC+8) from the device clock.
- If multiple records are created within the same minute, append sequence counters: \`HHMM-01\`, \`HHMM-02\`.
- Never edit or delete historical records. A correction is recorded as a new entry.

## Record template

Copy the template below when creating a new change record:

\`\`\`markdown
# Topic Title

- **Date:** YYYY-MM-DD HH:MM (Philippine time)
- **AI tool:** [AI Tool Name and model, or Manual]
- **Files changed:** \`path/to/file1\`, \`path/to/file2\`
- **Approved by:** [git config user.name and user.email]
- **Type:** [Fix | Polish | Feature | New feature (approved outside the documented flow)]

## Intent

Describe the rationale and goal for this change.

## Key changes

Summarize the specific modifications made across affected files.

## Validation evidence

List commands executed, test results, or manual verification steps confirming correctness.
\`\`\`
`,
  "docs/06-future-proposals/README.md": "# Future proposals\n\nIdeas here are proposals, not part of the current scope until accepted.\n",
  "docs/archive/README.md": "# Archive\n\nKeep superseded documents here with replacement links and archive dates.\n"
};

export async function setupProject(options = {}) {
  const root = resolve(options.cwd ?? process.cwd());
  const agentResult = await writeSafe(resolve(root, "AGENTS.md"), agentInstructions, { ...options, force: false });
  const results = [{ ...agentResult, protected: true }];
  for (const [path, contents] of Object.entries(ownedFiles)) {
    results.push(await writeSafe(resolve(root, path), contents, options));
  }
  displayResults(root, results);
  const changed = results.filter((result) => result.status !== "skipped").length;
  if (options.dryRun) {
    console.log(`\nPreview complete: ${changed} managed path(s) would be created or replaced.`);
    console.log("An existing AGENTS.md is always preserved, including with --force.");
    console.log(`Apply it: npx @ghostbyte/agent-docs-kit@latest setup --cwd "${root}"`);
  } else {
    console.log(`\nWorkspace ready: ${changed} path(s) created or replaced; existing scaffold files were skipped unless --force was supplied.`);
    if (agentResult.status === "skipped") console.log("Existing AGENTS.md preserved. Merge the continuous-documentation policy from docs/README.md if it is not already covered.");
    else console.log("Created AGENTS.md with the continuous-documentation policy; review it before relying on agent behavior.");
    console.log("Nothing is running in the background, and no AI review has been performed.");
    console.log("\nTo use this workspace with an AI coding agent:");
    console.log(`1. npx @ghostbyte/agent-docs-kit@latest skill install --target project --cwd "${root}"`);
    console.log("2. Open or restart the agent in this repository so it can discover .agents/skills/.");
    console.log("3. Prompt: Use $manage-project-quality. Inspect this repository, determine the current Agent Docs stage, and guide me through the next safe step. Do not infer facts without evidence.");
    console.log("\nTo work without an AI:");
    console.log("npx @ghostbyte/agent-docs-kit@latest start manual");
    console.log(`\nTo continue later: npx @ghostbyte/agent-docs-kit@latest next --cwd "${root}"`);
  }
  return results;
}
