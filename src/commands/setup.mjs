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
  return results;
}
