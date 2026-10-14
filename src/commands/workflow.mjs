import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { loadProjectConfig } from "../core/config.mjs";
import { exists } from "../core/files.mjs";

export const npxCommand = "npx @ghostbyte/agent-docs-kit@latest";

const startModes = Object.freeze({
  new: {
    title: "New or empty project",
    summary: "Create the documentation structure first, then record plans without presenting them as implemented facts.",
    steps: [
      `${npxCommand} doctor`,
      `${npxCommand} setup --dry-run`,
      `${npxCommand} setup`,
      "Describe the intended users, scope, architecture, and operating assumptions in docs/.",
      `${npxCommand} audit documentation --strict --report --format markdown`,
      `${npxCommand} next`
    ],
    note: "For a new project, label unimplemented behavior as planned or proposed. Do not create security Pass results without evidence."
  },
  existing: {
    title: "Existing project",
    summary: "Add the scaffold without overwriting existing files, then reconcile it with code, configuration, tests, and deployment evidence.",
    steps: [
      `${npxCommand} doctor`,
      `${npxCommand} setup --dry-run`,
      `${npxCommand} setup`,
      "Choose AI-assisted or manual completion below.",
      `${npxCommand} audit documentation --strict --report --format markdown`,
      `${npxCommand} next`
    ],
    note: "Setup skips existing files by default. Review every generated placeholder before treating the documentation as current."
  },
  agent: {
    title: "AI-assisted workflow",
    summary: "Install the repository-scoped skill, start a fresh AI session if necessary, and give the agent an evidence-bounded request.",
    steps: [
      `${npxCommand} setup --dry-run`,
      `${npxCommand} setup`,
      `${npxCommand} skill install --target project`,
      "Open or restart your AI coding session so it can discover .agents/skills/.",
      "Prompt: Use $manage-project-quality. Inspect this repository, determine the current Agent Docs stage, and guide me through the next safe step. Do not infer facts without evidence.",
      `${npxCommand} next`
    ],
    note: "Giving an AI only the npm package name does not grant authority or perform an audit. The agent should inspect the repository, explain proposed writes, and request authorization before active security testing."
  },
  manual: {
    title: "Manual workflow",
    summary: "Use the CLI as a reference and record generator; complete and verify every document or worksheet yourself.",
    steps: [
      `${npxCommand} setup --dry-run`,
      `${npxCommand} setup`,
      `${npxCommand} list documentation`,
      `${npxCommand} documentation guide system-documentation`,
      "Replace scaffold prompts with verified project facts and cite the source of each important claim.",
      `${npxCommand} audit documentation --strict --report`,
      `${npxCommand} next`
    ],
    note: "For security and engineering work, list the available scopes first, create one worksheet, then replace Unverified only when evidence supports the result."
  }
});

function renderStart(path) {
  return `\n${path.title}\n${"=".repeat(path.title.length)}\n${path.summary}\n\nWorking path\n${path.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\nImportant\n${path.note}\n\nCommands above use npx. After a global install, replace '${npxCommand}' with 'agent-docs'.`;
}

export function startWorkflow(mode) {
  const normalized = mode === "ai" ? "agent" : mode;
  if (normalized) {
    const path = startModes[normalized];
    if (!path) throw new Error(`Unknown start path '${mode}'. Use new, existing, agent, or manual.`);
    const text = renderStart(path);
    console.log(text);
    return { mode: normalized, ...path, text };
  }

  const text = `\nChoose your starting path\n=========================\n1. New project      ${npxCommand} start new\n2. Existing project ${npxCommand} start existing\n3. Use an AI agent  ${npxCommand} start agent\n4. Work manually    ${npxCommand} start manual\n\nNot sure? Run '${npxCommand} next' to inspect the current project and receive one recommended next step.\n\nInstallation alone changes nothing. Setup creates only the owned scaffold, and existing files are skipped unless --force is explicit.`;
  console.log(text);
  return { mode: undefined, paths: Object.keys(startModes), text };
}

async function markdownFiles(directory) {
  if (!(await exists(directory))) return [];
  const found = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) found.push(...await markdownFiles(path));
    else if (item.isFile() && item.name.toLowerCase().endsWith(".md")) found.push(path);
  }
  return found;
}

async function regularFiles(directory) {
  if (!(await exists(directory))) return [];
  const found = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) found.push(...await regularFiles(path));
    else if (item.isFile() && item.name !== ".gitkeep") found.push(path);
  }
  return found;
}

async function filesContaining(paths, pattern) {
  const matching = [];
  for (const path of paths) {
    const value = await readFile(path, "utf8");
    if (pattern.test(value)) matching.push(path);
  }
  return matching;
}

function renderNext(result) {
  const lines = [
    `\nStage ${result.stage}: ${result.title}`,
    "=".repeat(`Stage ${result.stage}: ${result.title}`.length),
    result.summary,
    "",
    "Detected"
  ];
  lines.push(...result.detected.map((item) => `- ${item}`), "", "Next actions");
  lines.push(...result.actions.map((item, index) => `${index + 1}. ${item}`));
  if (result.note) lines.push("", "Why this stage", result.note);
  lines.push("", `Re-run '${npxCommand} next' after completing these actions.`);
  return lines.join("\n");
}

function nextResult(stage, title, summary, detected, actions, note) {
  const result = { stage, title, summary, detected, actions, note };
  result.text = renderNext(result);
  console.log(result.text);
  return result;
}

export async function nextWorkflow(options = {}) {
  const root = resolve(options.cwd ?? process.cwd());
  const configPath = resolve(root, ".agent-docs", "config.json");
  if (!(await exists(configPath))) {
    return nextResult(1, "Initialize safely", "No Agent Docs workspace was found in this project.", [
      `Target: ${root}`,
      "Configuration: not found"
    ], [
      `${npxCommand} setup --cwd "${root}" --dry-run`,
      `${npxCommand} setup --cwd "${root}"`,
      `Choose a completion path with '${npxCommand} start agent' or '${npxCommand} start manual'.`
    ], "The preview shows every planned file. The real setup skips existing files by default.");
  }

  const { config } = await loadProjectConfig(root);
  const missing = [];
  for (const path of config.requiredDocuments) if (!(await exists(resolve(root, path)))) missing.push(path);
  if (missing.length) {
    return nextResult(2, "Complete the scaffold", "The workspace is configured, but one or more required documents are missing.", [
      "Configuration: found",
      `Missing required documents: ${missing.join(", ")}`
    ], [
      `${npxCommand} setup --cwd "${root}" --dry-run`,
      `${npxCommand} setup --cwd "${root}"`
    ], "Setup restores only missing owned files unless --force is explicitly supplied.");
  }

  const documentationFiles = await markdownFiles(resolve(root, config.documentationRoot));
  const placeholders = await filesContaining(documentationFiles, /Status:\s*Needs update|Describe the system boundary|Track requirements|Document setup, deployment/i);
  const skillInstalled = await exists(resolve(root, ".agents", "skills", "manage-project-quality", "SKILL.md"));
  if (placeholders.length) {
    const relativePlaceholders = placeholders.slice(0, 4).map((path) => relative(root, path));
    return nextResult(3, "Build the documentation baseline", "The scaffold exists, but starter prompts still need verified project information.", [
      `Starter documents needing work: ${relativePlaceholders.join(", ")}${placeholders.length > 4 ? ` (+${placeholders.length - 4} more)` : ""}`,
      `Project AI skill: ${skillInstalled ? "installed" : "not installed"}`
    ], [
      skillInstalled
        ? "Ask your AI: Use $manage-project-quality to inspect this repository and update the documentation baseline from repository evidence. Keep unknowns explicit."
        : `AI-assisted path: ${npxCommand} skill install --target project --cwd "${root}"`,
      `Manual path: ${npxCommand} list documentation`,
      `${npxCommand} documentation guide system-documentation`,
      "Replace generated prompts with evidence-backed facts; label planned behavior as planned."
    ], "Setup creates a structure, not complete documentation. A structural audit can pass while the content is still incomplete.");
  }

  const documentationReports = await regularFiles(resolve(root, config.documentationReports));
  if (!documentationReports.length) {
    return nextResult(4, "Verify documentation", "The baseline no longer contains starter prompts. Run the structural checks and save the result.", [
      `Documentation files: ${documentationFiles.length}`,
      "Saved documentation audit: not found"
    ], [
      `${npxCommand} audit documentation --cwd "${root}" --strict --report --format markdown`,
      "Review every failure and rerun the audit until the result matches the intended release standard."
    ], "This audit checks structure, metadata, placeholders, and local links. It does not prove that every statement is factually correct.");
  }

  const securityReports = await markdownFiles(resolve(root, config.securityReports));
  const engineeringReports = await markdownFiles(resolve(root, config.engineeringReports));
  const openReports = await filesContaining([...securityReports, ...engineeringReports], /Overall status:\s*Unverified|\|\s*Unverified\s*\|/i);
  if (openReports.length) {
    return nextResult(5, "Complete the open review", "A generated worksheet still contains Unverified results and needs evidence or an explicit N/A rationale.", [
      ...openReports.slice(0, 5).map((path) => `Open: ${relative(root, path)}`)
    ], [
      "Inspect the named report and collect code, configuration, test, metric, or authorized environment evidence.",
      "Assign only the allowed status values; record remediation, owner, and verification for actionable findings.",
      skillInstalled ? "Ask your AI to use $manage-project-quality for the report's single selected scope." : `${npxCommand} skill install --target project --cwd "${root}" (optional AI assistance)`
    ], "Creating a worksheet does not perform a review. All findings intentionally begin as Unverified.");
  }

  if (!securityReports.length && !engineeringReports.length) {
    return nextResult(5, "Choose a focused quality review", "Documentation is initialized and audited. Security and engineering reviews are optional and should be selected by current risk or project need.", [
      `Saved documentation audits: ${documentationReports.length}`,
      "Security worksheets: none",
      "Engineering worksheets: none"
    ], [
      `${npxCommand} list security`,
      `${npxCommand} security worksheet <phase>`,
      `${npxCommand} list engineering`,
      `${npxCommand} engineering worksheet <topic>`
    ], "Select one narrow scope. Active security testing requires explicit authorization for the exact target.");
  }

  return nextResult(6, "Maintain the project record", "The workspace has documentation evidence and no open generated worksheet was detected.", [
    `Documentation audits: ${documentationReports.length}`,
    `Security worksheets: ${securityReports.length}`,
    `Engineering worksheets: ${engineeringReports.length}`,
    `Project AI skill: ${skillInstalled ? "installed" : "not installed"}`
  ], [
    `${npxCommand} audit documentation --cwd "${root}" --strict`,
    "Create ADRs, change records, test evidence, runbooks, or incident reviews when the project changes.",
    "Revisit focused security and engineering scopes before material releases."
  ], "Keep the records aligned with code and operations; a previous audit is evidence from a point in time, not a permanent guarantee.");
}
