import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { evaluateDocumentationReports } from "../core/audit-reports.mjs";
import { loadProjectConfig } from "../core/config.mjs";
import { exists } from "../core/files.mjs";
import { worksheetReportState } from "../core/report-validation.mjs";
import { containsStarterText, isStarterDocument, normalizeReportPath, starterDocumentPaths } from "../core/starter-text.mjs";
import { installedSkillVersion, kitVersion, skillVersionFile } from "../core/version.mjs";
import { skillDestination, skillTargets } from "./skill.mjs";

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
      "Use the generated documentation-maintenance policy for every later project change.",
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
      "For every later change, update the affected documentation or record why no documentation update is needed.",
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
      "Review the generated AGENTS.md, or merge docs/README.md's continuous-documentation policy into an existing AGENTS.md.",
      `${npxCommand} skill install --target project`,
      "Open or restart your AI coding session so it can discover .agents/skills/.",
      "Prompt: Use $manage-project-quality. Inspect this repository, determine the current Agent Docs stage, and guide me through the next safe step. Do not infer facts without evidence.",
      `${npxCommand} next`
    ],
    note: "The agent should maintain affected documentation with every material change. Security and engineering remain separate, scoped reviews; package or skill installation does not grant authority for active testing."
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
      "For each later project change, follow docs/README.md's documentation-impact loop.",
      `${npxCommand} audit documentation --strict --report`,
      `${npxCommand} next`
    ],
    note: "Documentation maintenance is continuous. Security and engineering are separate point-in-time reviews: list a scope, create one worksheet, and replace Unverified only when evidence supports the result."
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

  const text = `\nChoose your starting path\n=========================\n1. New project      ${npxCommand} start new\n2. Existing project ${npxCommand} start existing\n3. Use an AI agent  ${npxCommand} start agent\n4. Work manually    ${npxCommand} start manual\n\nNot sure? Run '${npxCommand} next' to inspect the current project and receive one recommended next step.\n\nEvery path initializes documentation before security or engineering worksheets can be created. Installation alone changes nothing. Setup creates the owned scaffold and a protected AGENTS.md when absent. Existing files are skipped unless --force is explicit, and an existing AGENTS.md is never overwritten.`;
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

async function filesWithStarterText(paths, root) {
  const matching = [];
  for (const path of paths) {
    const reportPath = normalizeReportPath(relative(root, path));
    if (containsStarterText(await readFile(path, "utf8"), { path: reportPath })) matching.push(path);
  }
  return matching;
}

// Reports a vendored skill that a newer CLI has outgrown.
async function staleSkillInstalls(root) {
  const running = await kitVersion();
  const stale = [];
  for (const target of skillTargets) {
    if (target === "codex") continue;
    const directory = skillDestination(target, root);
    if (!(await exists(resolve(directory, "SKILL.md")))) continue;
    const version = await installedSkillVersion(resolve(directory, skillVersionFile));
    if (version !== running) stale.push({ target, path: normalizeReportPath(relative(root, directory)), version, running });
  }
  return stale;
}

function staleSkillLines(root, stale) {
  return stale.flatMap((item) => [
    `Installed skill ${item.path} records ${item.version ? `version ${item.version}` : "no version"}; this CLI is ${item.running}.`,
    `Refresh the skill: ${npxCommand} skill install --target ${item.target} --force --cwd "${root}"`
  ]);
}

function resemblesWorksheet(text, kind) {
  const heading = kind === "security" ? /^# Security (?:worksheet|audit):/mi : /^# Engineering (?:worksheet|review):/mi;
  const table = kind === "security" ? /^\|\s*Control ID\s*\|.*\bStatus\b/m : /^\|\s*Practice ID\s*\|.*\bStatus\b/m;
  return heading.test(text) || table.test(text);
}

async function worksheetFiles(paths, kind) {
  const reports = [];
  for (const path of paths) {
    const text = await readFile(path, "utf8");
    if (resemblesWorksheet(text, kind)) reports.push({ path, kind, state: worksheetReportState(text) });
  }
  return reports;
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
  if (result.notices?.length) lines.push("", "Maintenance", ...result.notices.map((item) => `- ${item}`));
  if (result.note) lines.push("", "Why this stage", result.note);
  lines.push("", `Re-run '${npxCommand} next' after completing these actions.`);
  return lines.join("\n");
}

function nextResult(stage, title, summary, detected, actions, note, notices = []) {
  const result = { stage, title, summary, detected, actions, note, notices };
  result.text = renderNext(result);
  console.log(result.text);
  return result;
}

export async function nextWorkflow(options = {}) {
  const root = resolve(options.cwd ?? process.cwd());
  const notices = staleSkillLines(root, await staleSkillInstalls(root));
  const stageResult = (stage, title, summary, detected, actions, note) => nextResult(stage, title, summary, detected, actions, note, notices);
  const configPath = resolve(root, ".agent-docs", "config.json");
  if (!(await exists(configPath))) {
    return stageResult(1, "Initialize safely", "No Agent Docs workspace was found in this project.", [
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
    return stageResult(2, "Complete the scaffold", "The workspace is configured, but one or more required documents are missing.", [
      "Configuration: found",
      `Missing required documents: ${missing.join(", ")}`
    ], [
      `${npxCommand} setup --cwd "${root}" --dry-run`,
      `${npxCommand} setup --cwd "${root}"`
    ], "Setup restores only missing owned files unless --force is explicitly supplied.");
  }

  const documentationFiles = await markdownFiles(resolve(root, config.documentationRoot));
  const placeholders = await filesWithStarterText(documentationFiles, root);
  const skillInstalled = await exists(resolve(root, ".agents", "skills", "manage-project-quality", "SKILL.md"));
  if (placeholders.length) {
    // Forward slashes everywhere, matching the audit's report paths so the two
    // commands never spell the same file differently.
    const relativePlaceholders = placeholders.slice(0, 4).map((path) => normalizeReportPath(relative(root, path)));
    // Starter documents are the ones `setup` owns, so progress is measured
    // against that fixed set rather than every Markdown file in the project.
    const starterTotal = starterDocumentPaths.length;
    const remaining = placeholders.filter((path) => isStarterDocument(normalizeReportPath(relative(root, path)))).length;
    const completed = Math.max(starterTotal - remaining, 0);
    return stageResult(3, "Build the documentation baseline", "The scaffold exists, but starter prompts still need verified project information.", [
      `Starter documents completed: ${completed} of ${starterTotal}`,
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

  const documentationAudit = await evaluateDocumentationReports(resolve(root, config.documentationReports), {
    root,
    requiredDocuments: config.requiredDocuments
  });
  if (documentationAudit.status !== "pass") {
    const reportDescription = documentationAudit.relativePath
      ? `${documentationAudit.status.toUpperCase()}: ${documentationAudit.relativePath}`
      : documentationAudit.status === "missing" ? "not found" : "not recognized";
    return stageResult(4, "Verify documentation", documentationAudit.status === "fail"
      ? "The latest documentation audit failed. Resolve its findings and save a new passing result."
      : "No trustworthy passing documentation audit was found. Run the structural checks and save the result.", [
      `Documentation files: ${documentationFiles.length}`,
      `Latest documentation audit: ${reportDescription}`,
      documentationAudit.detail
    ], [
      `${npxCommand} audit documentation --cwd "${root}" --strict --report --format markdown`,
      "Review every failure and rerun the audit until the result matches the intended release standard."
    ], "Only a recognized, applicable passing report advances this stage. The audit checks structure, metadata, placeholders, and local links; it does not prove that every statement is factually correct.");
  }

  const securityReports = await worksheetFiles(await markdownFiles(resolve(root, config.securityReports)), "security");
  const engineeringReports = await worksheetFiles(await markdownFiles(resolve(root, config.engineeringReports)), "engineering");
  const outstandingReports = [];
  for (const report of [...securityReports, ...engineeringReports]) {
    if (report.state.kind && report.state.kind !== report.kind) outstandingReports.push({ path: report.path, label: "Invalid", detail: `Expected a ${report.kind} worksheet but found ${report.state.kind} status rules.` });
    else if (report.state.errors.length) outstandingReports.push({ path: report.path, label: "Invalid", detail: report.state.errors[0] });
    else if (report.state.open) outstandingReports.push({ path: report.path, label: "Open", detail: "Unverified findings or overall status remain." });
  }
  if (outstandingReports.length) {
    return stageResult(5, "Complete the open review", "A worksheet is open or structurally invalid and needs evidence or an explicit N/A rationale.", [
      ...outstandingReports.slice(0, 5).map((item) => `${item.label}: ${normalizeReportPath(relative(root, item.path))} — ${item.detail}`),
      ...(outstandingReports.length > 5 ? [`Additional open or invalid worksheets: ${outstandingReports.length - 5}`] : [])
    ], [
      "Inspect the named report and collect code, configuration, test, metric, or authorized environment evidence.",
      "Assign only the allowed status values; record remediation, owner, and verification for actionable findings.",
      skillInstalled ? "Ask your AI to use $manage-project-quality for the report's single selected scope." : `${npxCommand} skill install --target project --cwd "${root}" (optional AI assistance)`
    ], "Creating a worksheet does not perform a review. Stage 6 means the record is structurally complete; it does not mean every control passed or recommendation was applied.");
  }

  if (!securityReports.length && !engineeringReports.length) {
    return stageResult(5, "Maintain documentation or choose a focused review", "Documentation is initialized and audited. Keep it aligned with every material project change. Security and engineering reviews are optional and should be selected by current risk or project need.", [
      `Latest documentation audit: PASS (${documentationAudit.relativePath})`,
      "Security worksheets: none",
      "Engineering worksheets: none"
    ], [
      `${npxCommand} audit documentation --cwd "${root}" --strict`,
      `${npxCommand} list security`,
      `${npxCommand} security worksheet <phase>`,
      `${npxCommand} list engineering`,
      `${npxCommand} engineering worksheet <topic>`
    ], "Documentation maintenance continues independently. Select one narrow scope only when a security or engineering review is useful. Active security testing requires explicit authorization for the exact target.");
  }

  return stageResult(6, "Maintain the project record", "The latest documentation audit passed and no open or invalid generated worksheet was detected.", [
    `Latest documentation audit: PASS (${documentationAudit.relativePath})`,
    `Security worksheets: ${securityReports.length}`,
    `Engineering worksheets: ${engineeringReports.length}`,
    `Project AI skill: ${skillInstalled ? "installed" : "not installed"}`
  ], [
    `${npxCommand} audit documentation --cwd "${root}" --strict`,
    "For every material change, update the affected documentation or record why no documentation update is needed.",
    "Create ADRs, change records, test evidence, runbooks, or incident reviews when the project changes.",
    "Revisit focused security and engineering scopes before material releases."
  ], "This stage means the record is structurally complete; it does not mean every control passed or recommendation was applied. Keep records aligned with code and operations because an audit is point-in-time evidence, not a permanent guarantee.");
}
