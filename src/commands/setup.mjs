import { resolve } from "node:path";
import { displayResults, writeSafe } from "../core/files.mjs";

const files = {
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

This directory is the maintained project record. Keep decisions and system facts separate from generated audit evidence.

## Start here

1. Replace the starter prompts in \`01-system/overview.md\`, \`02-project/README.md\`, and \`05-operations/README.md\` with verified project facts.
2. Choose how to complete the baseline:
   - AI-assisted: install the project skill with \`npx @ghostbyte/agent-docs-kit@latest skill install --target project\`, restart the AI session if needed, then ask it to use \`$manage-project-quality\` and inspect repository evidence.
   - Manual: run \`npx @ghostbyte/agent-docs-kit@latest list documentation\`, then open one focused area with \`documentation guide <area>\`.
3. Run \`npx @ghostbyte/agent-docs-kit@latest audit documentation --strict --report --format markdown\`.
4. Run \`npx @ghostbyte/agent-docs-kit@latest next\` whenever you need the next project-specific action.

Generated structure is not proof of completeness. Keep unknowns explicit, label planned behavior as planned, and never assign a security result without evidence.

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
  const results = [];
  for (const [path, contents] of Object.entries(files)) {
    results.push(await writeSafe(resolve(root, path), contents, options));
  }
  displayResults(root, results);
  const changed = results.filter((result) => result.status !== "skipped").length;
  if (options.dryRun) {
    console.log(`\nPreview complete: ${changed} owned path(s) would be created or replaced.`);
    console.log(`Apply it: npx @ghostbyte/agent-docs-kit@latest setup --cwd "${root}"`);
  } else {
    console.log(`\nWorkspace ready: ${changed} path(s) created or replaced; existing files were skipped unless --force was supplied.`);
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
