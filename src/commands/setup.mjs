import { resolve } from "node:path";
import { displayResults, writeSafe } from "../core/files.mjs";
import { npxCommand } from "./workflow.mjs";

const agentInstructions = `# Agent instructions

## Continuous documentation

Treat documentation as an ongoing project record. Before considering any repository change complete:

1. Inspect the change and \`.agent-docs/config.json\`.
2. Decide which documentation areas are affected.
3. Update only the affected records with facts supported by code, configuration, tests, or authorized operational evidence.
4. Keep current behavior separate from proposals and archived material.
5. Record validation evidence and run \`npx @ghostbyte/agent-docs-kit@latest audit documentation --strict\`.
6. Summarize the documentation impact. If no document changed, state why the change has no documentation impact.

Use \`docs/README.md\` as the project documentation index. Preserve existing records and append dated evidence instead of rewriting history.

This file supplies instructions; it does not run an agent. A compatible AI coding agent must be active in this repository, read these instructions, and have permission to update project files.

## Workflow boundaries

- Documentation maintenance is continuous and accompanies material project changes.
- Security and engineering worksheets are scoped, point-in-time reviews. Do not create or update them merely because code changed.
- Never assign security or engineering conclusions without evidence. Active testing requires explicit authorization for the exact target.
- Agent instructions are governance guidance, not technical enforcement. Follow repository CI and review controls where they exist.
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
  "docs/05-operations/README.md": "# Operations\n\nDocument setup, deployment, observability, incident response, and recovery procedures.\n",
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
