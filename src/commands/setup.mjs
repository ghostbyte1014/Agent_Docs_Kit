import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { displayResults, exists, writeSafe } from "../core/files.mjs";
import { agentDefinition, agentIds, canonicalInstructions, detectAgents, importLine, importsCanonicalInstructions, parseAgentSelection, pointerFileContents } from "../core/agents.mjs";
import { starterMarker } from "../core/starter-text.mjs";
import { defaultTimezone, describeTimezone, timezoneClockCommand } from "../core/timezone.mjs";
import { npxCommand } from "./workflow.mjs";
import { installSkill, projectSkillTargets } from "./skill.mjs";
import { assertAttribution } from "../core/config.mjs";

const pointerFileList = agentIds.map((id) => agentDefinition(id).instructionFile).join(", ");

function agentInstructions({ timezone = defaultTimezone, attribution = "" } = {}) {
  const zone = describeTimezone(timezone);
  const clock = timezoneClockCommand(timezone);
  const credit = attribution ? `\n> Created by ${attribution}\n` : "";
  return `# Agent instructions
${credit}
<!-- Replace with your project summary: A multi-role system, CRM, API, or service boundary -->

## Switches (read before anything else)

**CHANGE RECORDS: ON**

**FREEZE: OFF**

> Change a line to \`OFF\`/\`ON\`, then start a new AI session (rules load once per session). The Claude Code lock is separate: \`.claude/settings.json\` is active, \`.claude/settings.off.json\` is inactive. Full guide: [\`docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md\`](docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md).

These rules apply to **every AI coding agent** (Claude Code, Codex, Gemini CLI, Cursor, Copilot, Antigravity, or any other) **in every mode, including auto, auto-accept, full-access, YOLO, or "skip permissions"**.

## Change records (when CHANGE RECORDS is ON)

After every material change to source, tests, configuration, build, or automation, create a change record in [\`docs/05-operations/agents/feature-updates/\`](docs/05-operations/agents/feature-updates/README.md) in the same change:

- **One file per change topic**, named \`YYYY-MM-DD_HHMM_short-topic.md\` (24-hour time in ${zone}, taken from the device clock, e.g., \`${clock}\`; if two records share a minute, use \`HHMM-01\`, \`HHMM-02\` in creation order). Records then sort first-applied at the top. If you cannot read the clock, ask the developer for the time; never guess.
- Copy the template in that folder's \`README.md\`. Fill in:
  - **Date:** \`YYYY-MM-DD HH:MM (${zone})\`, matching the file name.
  - **AI tool:** your own tool name (\`Claude Code\`, \`Codex\`, \`Gemini CLI\`, \`Cursor\`, \`Antigravity\`, …) and model if known. A change made without AI is recorded as \`Manual\`.
  - **Files changed:** every file path, in backticks.
  - **Authorization:** the explicit request, issue, pull request, or decision that authorized the change. Do not infer approval or identity from local Git configuration.
  - **Type:** \`Fix\`, \`Polish\`, \`Feature\`, or (while the freeze is ON) \`New feature (approved outside the documented flow)\`.
- Records are permanent: never edit or delete an existing record. A correction is a new record.
- Writing the record is part of the change and needs no separate approval.
- The time zone above comes from \`timezone\` in \`.agent-docs/config.json\`. Change it there, not here.

## Change freeze (when FREEZE is ON)

When FREEZE is ON, the project is in its polishing stage: the code must not drift from the documented scope in [\`docs/01-system/overview.md\`](docs/01-system/overview.md). These rules override any instruction to work autonomously. When FREEZE is OFF, skip this section; every other section still applies.

1. **Flag anything new.** Allowed work by default: fixing errors in, or polishing, flows already in the documented scope. If a change would add something the scope does not describe (a page, a capability, a database table, a workflow step), say so clearly: "This is a new feature, outside the documented flow." Build it only if the developer confirms they want it anyway.
2. **Ask before each file.** Before you create, edit, move, or delete **each file**, name the file and what will change in it, plus any migration the developer must run. Then **stop and wait for the developer's explicit "yes"** before touching that file. Do the same before running anything that changes the database, git history, or dependencies.
   - An implementation plan, task list, TODO, or an earlier approval is **not** approval. Even when a plan lists the work, confirm each file before editing it.
   - Silence or auto mode is not approval.
3. **An approval covers only what was described.** Anything extra you notice gets reported and needs its own approval.
4. **Validation commands:** Before running tests, type checks, builds, or documentation audits, inspect the repository-defined command for side effects. Run it without additional approval only when the repository documents it as local and non-destructive; otherwise ask first. Do not assume a language, package manager, or framework. Documentation audit: \`npx @ghostbyte/agent-docs-kit@latest audit documentation --strict\`.

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
- Name dated docs \`TOPIC_YYYY-MM-DD.md\`; living docs \`TOPIC.md\`. Keep generated project records under \`docs/\`; preserve existing root documentation and repository conventions. \`${canonicalInstructions}\` and optional coding-agent pointers remain at the root.
- Every time you add, move, archive, or retire a doc, update \`docs/README.md\` in the same change.
- **\`docs/archive/\` is historical, not authoritative.** Do not use it as a source of truth or audit against it.
- Move files with \`git mv\` so history is kept, then fix relative links.
- Treat documentation as an ongoing project record. Documentation maintenance is continuous and accompanies material project changes. Run \`npx @ghostbyte/agent-docs-kit@latest audit documentation --strict\` before considering changes complete.
- A starter document still carrying its \`agent-docs:starter\` marker is unfinished. Replace its text with verified project facts and delete the marker line in the same change; the strict audit fails while any marker remains.

## Workflow boundaries

- Documentation maintenance is always active and accompanies every material project change. It is independent of whether another review is selected.
- Before a commit, run \`${npxCommand} suggest reviews --staged\`; for a branch or pushed comparison, use \`${npxCommand} suggest reviews --base <git-ref>\`. Treat its path matches as advisory evidence, not proof of safety.
- When changed behavior, data exposure, dependencies, authentication, release controls, architecture, reliability, testing, or operational risk warrants deeper review, recommend the narrowest relevant security or engineering topic to the developer. State why it applies, what evidence would be needed, and the exact worksheet command.
- Security and engineering worksheets are scoped, point-in-time reviews. Do not create one merely because code changed or claim a review was completed until its evidence has been examined.
- Never assign security or engineering conclusions without evidence. Active testing requires explicit authorization for the exact target.
- Markdown policy guides collaboration but does not technically enforce it. Use tests, validation, CI, and branch controls where enforcement is required.

## Development commands

- Discover the actual install, development, test, type-check, build, and lint commands from tracked manifests, contributor guidance, and CI. Record verified commands here; mark unavailable checks as unavailable rather than inventing them.
- Documentation audit: \`npx @ghostbyte/agent-docs-kit@latest audit documentation --strict\`

## Architecture and data boundary

- [Document project structure, framework conventions, domain boundaries, and persistence interfaces here]
- For projects with server or data boundaries, document authorization, validation, transaction, encryption, and retention requirements. Mark non-applicable areas explicitly.

## Design and implementation rules

- [Document visual design direction, color palettes, and component library conventions here]
- For projects with user interfaces, document responsiveness, keyboard accessibility, content trust, and supported form factors. Mark non-applicable areas explicitly.
- Enforce validation, ownership, permissions, and state transitions at the system boundary that actually provides security; do not assume a client or server architecture that the repository does not use.
`;
}

function projectConfigContents({ timezone = defaultTimezone, attribution = "", agents = [] } = {}) {
  return `{
  "schemaVersion": 2,
  "documentationRoot": "docs",
  "documentationReports": "docs/03-development/audits",
  "securityReports": "docs/04-testing/security-audits",
  "engineeringReports": "docs/03-development/engineering-reviews",
  "templateOutput": "docs",
  "interactionStyle": "standard",
  "maxAgeDays": 180,
  "requireMetadata": false,
  "timezone": ${JSON.stringify(timezone)},
  "attribution": ${JSON.stringify(attribution)},
  "agents": ${JSON.stringify(agents)},
  "requiredDocuments": ["docs/README.md", "docs/01-system/overview.md", "docs/02-project/README.md", "docs/05-operations/README.md"]
}
`;
}

function ownedFiles(profile) {
  const zone = describeTimezone(profile.timezone);
  const clock = timezoneClockCommand(profile.timezone);
  return {
    ".agent-docs/config.json": projectConfigContents(profile),
    "docs/README.md": `# Project documentation

This directory is the maintained project record. Documentation grows with the project; security and engineering worksheets remain separate, scoped reviews.

## Start here

1. Replace the starter prompts in \`01-system/overview.md\`, \`02-project/README.md\`, and \`05-operations/README.md\` with verified project facts, then delete each \`agent-docs:starter\` marker comment in the same edit. \`audit documentation --strict\` fails while a marker or its untouched starter text remains, so a passing strict audit means every starter document has been reviewed.
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

For AI-assisted work, the protected root \`${canonicalInstructions}\` created when absent carries the same maintenance contract. Existing \`${canonicalInstructions}\` files are never overwritten; merge this policy into existing instructions deliberately. Optional coding-agent pointer files import \`${canonicalInstructions}\` instead of copying it, so the policy keeps one source. Manual users follow this section directly.

The workflow is AI-first and agent-assisted, not an unattended background service. \`${canonicalInstructions}\` does not execute by itself: a compatible coding agent must be active, must load the repository instructions, and must be allowed to edit these records. Run \`${npxCommand} suggest reviews --staged\` before a commit, or compare a pushed branch with \`${npxCommand} suggest reviews --base <git-ref>\`, to receive advisory review candidates. These commands do not edit files or perform an audit.

Documentation maintenance does not automatically start a security or engineering review. This workspace must be initialized before those worksheets can be created. Keep documentation active for every material change, then recommend the narrowest relevant review when the change introduces a security risk, release concern, design tradeoff, reliability question, or testing gap. Explain the reason and evidence needed; create and complete a worksheet only when that review is actually selected.

## Areas

- \`01-system/\`: system scope, architecture, data, and security design
- \`02-project/\`: requirements, roadmap, decisions, and status
- \`03-development/\`: implementation notes and engineering reviews
- \`04-testing/\`: test plans, security audits, and evidence
- \`05-operations/\`: setup, deployment, runbooks, and agent operations
- \`06-future-proposals/\`: proposals that are not current commitments
- \`archive/\`: superseded material retained for traceability
`,
    "docs/01-system/overview.md": `# System overview

Status: Needs update

Describe the system boundary, users, dependencies, and authoritative sources.

${starterMarker("Record the real system boundary, its users, its dependencies, and the authoritative source for each claim.")}
`,
    "docs/02-project/README.md": `# Project

Track requirements, decisions, milestones, and current delivery status here.

${starterMarker("Record the real requirements, decisions, milestones, and delivery status.")}
`,
    "docs/03-development/engineering-reviews/.gitkeep": "",
    "docs/04-testing/security-audits/.gitkeep": "",
    "docs/04-testing/evidence/.gitkeep": "",
    "docs/05-operations/README.md": `# Operations

Document setup, deployment, observability, incident response, recovery procedures, and agent operational policies.

## Agent operations

- [Change freeze guide](agents/CHANGE_FREEZE_GUIDE.md)
- [Feature updates and change records](agents/feature-updates/README.md)

${starterMarker("Record the real setup, deployment, observability, incident-response, and recovery procedures.")}
`,
    "docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md": `# Change freeze guide

This guide explains how to use the switches in \`${canonicalInstructions}\` to control AI coding agents during active development and polishing stages.

## Overview

The governance switches in \`${canonicalInstructions}\` provide immediate, human-readable control over AI agent behavior:

- **CHANGE RECORDS (\`ON\` / \`OFF\`):** When enabled, requires AI coding agents to create an immutable record in \`docs/05-operations/agents/feature-updates/\` for every code modification.
- **FREEZE (\`ON\` / \`OFF\`):** When enabled, restricts autonomous changes to polishing and bug fixes within documented scope, requiring explicit confirmation before touching each file.

## How switches work

AI coding agents read repository instructions at the start of a session.

1. Open \`${canonicalInstructions}\`.
2. Locate the \`## Switches\` section.
3. Change the value to \`ON\` or \`OFF\` (e.g. \`FREEZE: ON\`).
4. Start a fresh AI session so the agent loads the updated rules.

Coding-agent pointer files import \`${canonicalInstructions}\` with a \`${importLine}\` line, so the switches above are not copied between files.

## AI agent configuration locks

Some AI coding tools support permission configurations:

- **Claude Code:** Project settings in \`.claude/settings.json\` can enforce read-only or restricted modes. To unlock permissions, switch between active and inactive configuration files (e.g., \`.claude/settings.json\` and \`.claude/settings.off.json\`).
- **Autonomous and YOLO modes:** Regardless of tool mode (auto-accept, bypass permissions, YOLO), the directives in \`${canonicalInstructions}\` apply as strict behavioral policy for all AI agents.

## Change freeze protocol

When \`FREEZE: ON\` is active:

1. **Scope verification:** All edits must align with \`docs/01-system/overview.md\`. Any out-of-scope addition must be explicitly flagged to the developer before implementation.
2. **Per-file confirmation:** The agent must state the filename and intended changes, then pause and wait for explicit developer approval before creating, editing, or deleting files.
3. **Validation commands:** Before running tests, type checks, builds, or documentation audits, inspect the repository-defined command for side effects. Run it without additional approval only when the repository documents it as local and non-destructive; otherwise ask first.
`,
    "docs/05-operations/agents/feature-updates/README.md": `# Feature updates and change records

This directory stores permanent change records generated during project evolution when **CHANGE RECORDS** is active in \`${canonicalInstructions}\`.

## Purpose

Change records document what changed, why it changed, files touched, validation evidence, and approval metadata. They provide an immutable, chronological log of system changes.

## Naming convention

Each record is stored as a standalone Markdown file named:

\`YYYY-MM-DD_HHMM_short-topic.md\`

- Use 24-hour time in ${zone}, read from the device clock with \`${clock}\`.
- The time zone comes from \`timezone\` in \`.agent-docs/config.json\`. Change it there; this file is regenerated from it.
- If multiple records are created within the same minute, append sequence counters: \`HHMM-01\`, \`HHMM-02\`.
- Never edit or delete historical records. A correction is recorded as a new entry.

## Record template

Copy the template below when creating a new change record:

\`\`\`markdown
# Topic Title

- **Date:** YYYY-MM-DD HH:MM (${zone})
- **AI tool:** [AI Tool Name and model, or Manual]
- **Files changed:** \`path/to/file1\`, \`path/to/file2\`
- **Authorization:** [explicit request, issue, pull request, or decision]
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
}

// Reads an existing config without validating it, so a rerun inherits the
// profile a previous setup wrote even when other keys were hand-edited.
async function existingProfile(root) {
  try {
    const raw = await readFile(resolve(root, ".agent-docs", "config.json"), "utf8");
    const parsed = JSON.parse(raw.replace(/^﻿/, ""));
    return {
      timezone: typeof parsed.timezone === "string" ? parsed.timezone : undefined,
      attribution: typeof parsed.attribution === "string" ? parsed.attribution : undefined,
      agents: Array.isArray(parsed.agents) ? parsed.agents.filter((id) => typeof id === "string") : []
    };
  } catch {
    return { agents: [] };
  }
}

// An explicit --agents value states the desired set, so it replaces the stored
// list rather than adding to it. Merging made '--agents none' a silent no-op
// and left no way to stop tracking an agent short of editing config.json.
// 'auto' still adds detected tools to the stored list, and an absent flag
// keeps whatever is already configured.
async function resolveAgentIds(root, options, inherited) {
  const selection = parseAgentSelection(options.agents);
  const requested = options.ai && selection.mode === "unset" ? { mode: "explicit", ids: [...agentIds] } : selection;
  if (requested.mode === "explicit") {
    return { mode: "explicit", chosen: requested.ids, ids: requested.ids, removed: inherited.filter((id) => !requested.ids.includes(id)) };
  }
  const chosen = requested.mode === "auto" ? await detectAgents(root) : [];
  return { mode: requested.mode, chosen, ids: [...new Set([...inherited, ...chosen])], removed: [] };
}

export async function setupProject(options = {}) {
  const root = resolve(options.cwd ?? process.cwd());
  const inherited = await existingProfile(root);
  const agents = await resolveAgentIds(root, options, inherited.agents);
  const profile = {
    timezone: options.timezone ?? inherited.timezone ?? defaultTimezone,
    attribution: options.attribution ?? inherited.attribution ?? "",
    agents: agents.ids
  };
  assertAttribution(profile.attribution);

  const agentResult = await writeSafe(resolve(root, canonicalInstructions), agentInstructions(profile), { ...options, force: false });
  const results = [{ ...agentResult, protected: true }];
  for (const [path, contents] of Object.entries(ownedFiles(profile))) {
    results.push(await writeSafe(resolve(root, path), contents, options));
  }

  // Pointer files are never replaced, even with --force, exactly like AGENTS.md.
  const pointers = [];
  for (const id of agents.ids) {
    const definition = agentDefinition(id);
    const path = resolve(root, definition.instructionFile);
    const preexisting = await exists(path);
    const result = await writeSafe(path, pointerFileContents(id), { ...options, force: false });
    const imports = preexisting && !options.dryRun ? importsCanonicalInstructions(await readFile(path, "utf8")) : true;
    pointers.push({ ...result, protected: true, agent: id, label: definition.label, preexisting, imports });
    results.push({ ...result, protected: true });
  }

  // .agent-docs/config.json is a protected scaffold file, so a rerun skips it.
  // That left --agents, --timezone, and --attribution as silent no-ops on any
  // initialized project: the only way to persist them was --force, which also
  // rewrites every starter document. Merge just the requested keys instead,
  // preserving every other key, including hand-edits.
  const configResult = results.find((item) => item.path === resolve(root, ".agent-docs", "config.json"));
  const profileRequested = options.agents !== undefined || options.timezone !== undefined || options.attribution !== undefined;
  let configUpdate;
  if (profileRequested && configResult?.status === "skipped") {
    configUpdate = await mergeProfileIntoConfig(root, profile, options);
  }

  const failures = [];
  const skillInstalls = [];
  if (options.ai) {
    for (const target of projectSkillTargets(agents.ids)) {
      try {
        skillInstalls.push(await installSkill(target, { ...options, quiet: true }));
      } catch (error) {
        failures.push({ step: `skill install --target ${target}`, message: error.message });
      }
    }
  }

  displayResults(root, results);
  reportSetup({ root, options, agents, pointers, profile, skillInstalls, failures, agentResult, configUpdate });

  results.pointers = pointers;
  results.skillInstalls = skillInstalls;
  results.failures = failures;
  results.profile = profile;
  results.configUpdate = configUpdate;
  return results;
}

// Rewrites only timezone, attribution, and agents in an existing configuration.
async function mergeProfileIntoConfig(root, profile, options) {
  const path = resolve(root, ".agent-docs", "config.json");
  let current;
  try {
    current = JSON.parse((await readFile(path, "utf8")).replace(/^﻿/, ""));
  } catch (error) {
    return { status: "unchanged", reason: `could not be read (${error.message})` };
  }
  if (!current || typeof current !== "object" || Array.isArray(current)) return { status: "unchanged", reason: "does not contain a JSON object" };

  const changed = [];
  if (options.timezone !== undefined && current.timezone !== profile.timezone) changed.push("timezone");
  if (options.attribution !== undefined && current.attribution !== profile.attribution) changed.push("attribution");
  const currentAgents = Array.isArray(current.agents) ? current.agents : [];
  if (options.agents !== undefined && (currentAgents.length !== profile.agents.length || currentAgents.some((id, index) => id !== profile.agents[index]))) changed.push("agents");
  if (!changed.length) return { status: "unchanged", reason: "already matches the requested values" };

  const next = { ...current };
  if (options.timezone !== undefined) next.timezone = profile.timezone;
  if (options.attribution !== undefined) next.attribution = profile.attribution;
  if (options.agents !== undefined) next.agents = profile.agents;
  if (!options.dryRun) await writeSafe(path, `${JSON.stringify(next, null, 2)}\n`, { force: true });
  return { status: options.dryRun ? "planned" : "updated", changed };
}

function reportSetup({ root, options, agents, pointers, profile, skillInstalls, failures, agentResult, configUpdate }) {
  if (options.dryRun) {
    console.log(`\nPreview complete: nothing was written. Every planned path is listed above.`);
    console.log(`An existing ${canonicalInstructions} is always preserved, including with --force. The same applies to every agent pointer file.`);
    if (agents.ids.length) console.log(`Planned agent pointer files: ${agents.ids.map((id) => agentDefinition(id).instructionFile).join(", ")}.`);
    if (options.ai) {
      console.log(`Planned project skill targets: ${projectSkillTargets(agents.ids).join(", ")}.`);
      console.log("The skill is copied into this repository. Nothing is written outside it.");
    }
    console.log(`Apply it: npx @ghostbyte/agent-docs-kit@latest setup${options.ai ? " --ai" : ""} --cwd "${root}"`);
    return;
  }

  console.log("\nWorkspace ready: existing scaffold files were skipped unless --force was supplied.");
  if (agentResult.status === "skipped") console.log(`Existing ${canonicalInstructions} preserved. Merge the continuous-documentation policy from docs/README.md if it is not already covered.`);
  else console.log(`Created ${canonicalInstructions} with the continuous-documentation policy; review it before relying on agent behavior.`);
  console.log(`Change-record time zone: ${describeTimezone(profile.timezone)} (set "timezone" in .agent-docs/config.json to change it).`);
  if (configUpdate?.status === "updated") console.log(`Updated .agent-docs/config.json: ${configUpdate.changed.join(", ")}. Every other key was left as it was.`);
  else if (configUpdate?.status === "unchanged") console.log(`.agent-docs/config.json was not changed: it ${configUpdate.reason}.`);

  for (const pointer of pointers) {
    const name = relative(root, pointer.path);
    if (!pointer.preexisting) console.log(`${pointer.label}: created ${name}, which imports ${canonicalInstructions}.`);
    else if (!pointer.imports) {
      console.log(`${pointer.label}: existing ${name} preserved, and it does not import ${canonicalInstructions}.`);
      console.log(`  Add this single line near the top of ${name}:  ${importLine}`);
    } else console.log(`${pointer.label}: existing ${name} preserved; it already imports ${canonicalInstructions}.`);
  }
  for (const id of agents.removed ?? []) {
    const definition = agentDefinition(id);
    console.log(`${definition.label}: no longer tracked. ${definition.instructionFile} was kept exactly as it is and is no longer checked by the documentation audit.`);
  }
  if (agents.mode === "unset" && !options.ai) {
    console.log(`\nNo agent pointer files were requested. Add them with: npx @ghostbyte/agent-docs-kit@latest setup --agents all --cwd "${root}"`);
    console.log(`Supported pointers: ${pointerFileList}.`);
    console.log("Use --agents auto to create them only for tools this repository already shows signs of using.");
  }
  if (skillInstalls.length) {
    console.log(`\nProject skill installed into: ${skillInstalls.map((item) => relative(root, item.path)).join(", ")}.`);
    console.log("The skill is a copy committed to this repository. Teams usually commit it so everyone shares the same instructions.");
    console.log("Sending repository content to an AI provider is governed by that provider's terms. Installing the skill is not approval to share private code.");
  }
  if (failures.length) {
    console.log("\nIncomplete:");
    for (const failure of failures) console.log(`- ${failure.step} failed: ${failure.message}`);
    console.log("Documentation was written. Rerun the same command to finish; setup skips files that already exist.");
    return;
  }
  console.log("Nothing is running in the background, and no AI review has been performed.");
  // Without this, a user's first result is a red FAIL that reads like a defect.
  console.log("\nExpect the first 'audit documentation --strict' to fail: the starter documents are");
  console.log("placeholders, not documentation. That is deliberate, so a passing check cannot mean");
  console.log("empty records. Replace their text with verified facts and delete each starter marker.");
  console.log("\nTo use this workspace with an AI coding agent:");
  if (options.ai) console.log("1. The documentation, agent instructions, and project skill are in place.");
  else console.log(`1. npx @ghostbyte/agent-docs-kit@latest setup --ai --cwd "${root}"   (or: skill install --target project)`);
  console.log("2. Open or restart the agent in this repository so it can discover the agent instruction files and skills.");
  console.log("3. Prompt: Use $manage-project-quality. Inspect this repository, determine the current Agent Docs stage, and guide me through the next safe step. Do not infer facts without evidence.");
  console.log("\nTo work without an AI:");
  console.log("npx @ghostbyte/agent-docs-kit@latest start manual");
  console.log(`\nTo continue later: npx @ghostbyte/agent-docs-kit@latest next --cwd "${root}"`);
}
