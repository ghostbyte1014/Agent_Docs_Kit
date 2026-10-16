import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { loadCatalog, selectEntry } from "../core/catalog.mjs";
import { documentationInitializationState, loadProjectConfig } from "../core/config.mjs";
import { exists, writeUnique } from "../core/files.mjs";
import { resolveFromPackage } from "../core/paths.mjs";
import { normalizeReportPath, starterTextSignal, withoutFencedCode } from "../core/starter-text.mjs";
import { agentDefinition, canonicalInstructions, importLine, importsCanonicalInstructions } from "../core/agents.mjs";
import { installedSkillVersion, kitVersion, skillVersionFile } from "../core/version.mjs";
import { skillDestination, skillTargets } from "./skill.mjs";

export function localDate(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function reportFor(kind, selector, options = {}) {
  const initialization = await documentationInitializationState(options.cwd);
  if (!initialization.initialized) {
    const missing = [
      ...(!initialization.configPresent ? [".agent-docs/config.json"] : []),
      ...(!initialization.documentationRootPresent ? [initialization.config.documentationRoot] : [])
    ];
    const article = kind === "engineering" ? "an" : "a";
    throw new Error(`Initialize documentation before creating ${article} ${kind} worksheet. Missing: ${missing.join(", ")}. Run 'npx @ghostbyte/agent-docs-kit@latest setup --dry-run', then 'npx @ghostbyte/agent-docs-kit@latest setup'.`);
  }
  const catalog = await loadCatalog();
  const entry = selectEntry(catalog[kind], selector);
  if (!entry) throw new Error(`Unknown ${kind} selection '${selector ?? ""}'. Run 'agent-docs list ${kind}'.`);
  const { root, config } = initialization;
  const source = await readFile(resolveFromPackage(entry.source), "utf8");
  const reference = source.replace(/^#\s+(.+)$/m, "### $1");
  const isSecurity = kind === "security";
  const heading = isSecurity ? "Security worksheet" : "Engineering worksheet";
  const destinationRoot = isSecurity ? config.securityReports : config.engineeringReports;
  const output = resolve(root, destinationRoot, `${localDate()}-${entry.slug}.md`);
  const context = isSecurity
    ? `## Scope and authorization\n\n- Target: _Describe the code, configuration, or authorized test environment_\n- Authorization: _Required before active testing_\n- Exclusions: _List exclusions_\n- Test safety: _Record rate limits, test data, and stop conditions_`
    : `## Review context\n\n- System or change: _Describe the reviewed scope_\n- Goal: _State the desired engineering outcome_\n- Constraints: _List material technical or delivery constraints_`;
  const columns = isSecurity
    ? "| Control ID | Priority | Status | Evidence | Remediation | Owner | Verification |\n|---|---|---|---|---|---|---|\n| Add each applicable control | Medium | Unverified | File/line, command output, or approved observation | Required follow-up | Unassigned | Not verified |"
    : "| Practice ID | Status | Evidence | Impact | Recommendation | Owner | Verification |\n|---|---|---|---|---|---|---|\n| Add each applicable practice | Unverified | File/line, metric, trace, or test output | State the measurable impact | Recommended follow-up | Unassigned | Not verified |";
  const body = `# ${heading}: ${entry.title}\n\n- Date: ${localDate()}\n- Style: ${options.style ?? config.interactionStyle}\n- Overall status: Unverified\n- Reviewer: _Unassigned_\n\n${context}\n\n## Findings\n\n${columns}\n\n## Reference checklist\n\n${reference.trim()}\n`;
  const result = await writeUnique(output, body, options);
  console.log(`${result.status} ${result.path}`);
  if (options.dryRun) {
    console.log("Preview only: no worksheet was created.");
  } else {
    console.log("\nNext steps:");
    console.log(`1. Open ${relative(root, result.path)}. Every finding starts as Unverified.`);
    console.log("2. Collect evidence, then record status, remediation, owner, and verification. Do not treat worksheet creation as a completed review.");
    console.log("3. For AI assistance, install the project skill and ask $manage-project-quality to review only this scope.");
    console.log(`4. Continue: npx @ghostbyte/agent-docs-kit@latest next --cwd "${root}"`);
  }
  return result;
}

export const auditSecurity = (selector, options) => reportFor("security", selector, options);
export const reviewEngineering = (selector, options) => reportFor("engineering", selector, options);

async function markdownFiles(directory) {
  if (!(await exists(directory))) return [];
  const found = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) found.push(...await markdownFiles(path));
    else if (item.isFile() && extname(item.name).toLowerCase() === ".md") found.push(path);
  }
  return found;
}

function anchors(markdown) {
  return new Set([...markdown.matchAll(/^#{1,6}\s+(.+)$/gm)].map(([, heading]) => heading.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-")));
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function frontMatterValues(block) {
  return Object.fromEntries([...block.matchAll(/^([A-Za-z][\w-]*):\s*(.*?)\s*$/gm)].map((match) => [match[1], match[2].replace(/^['"]|['"]$/g, "")]));
}

async function inspectMarkdown(file, root, config, cache) {
  const readCached = async (path) => {
    if (!cache.has(path)) cache.set(path, await readFile(path, "utf8"));
    return cache.get(path);
  };
  const value = await readCached(file);
  const inspectable = withoutFencedCode(value);
  const reportPath = normalizeReportPath(relative(root, file));
  const issues = [];
  const frontMatter = value.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const h1Count = (inspectable.match(/^#\s+/gm) ?? []).length;
  if (h1Count !== 1) issues.push({ rule: "single-h1", path: reportPath, detail: `Expected one H1; found ${h1Count}.` });
  const headingCounts = new Map();
  for (const [, heading] of inspectable.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const key = heading.toLowerCase().trim();
    headingCounts.set(key, (headingCounts.get(key) ?? 0) + 1);
  }
  for (const [heading, count] of headingCounts) {
    if (count > 1) issues.push({ rule: "duplicate-heading", path: reportPath, detail: `Heading '${heading}' appears ${count} times.` });
  }
  if (/\b(?:TODO|TBD|FIXME)\b/i.test(inspectable)) issues.push({ rule: "placeholder", path: reportPath, detail: "Contains TODO, TBD, or FIXME outside a fenced code block." });
  const starter = starterTextSignal(inspectable, { stripFences: false, path: reportPath });
  if (starter) issues.push({ rule: "starter-text", path: reportPath, detail: starter.detail });
  if (config.requireMetadata && !frontMatter) issues.push({ rule: "metadata", path: reportPath, detail: "Required front matter is missing." });
  if (frontMatter) {
    const metadata = frontMatterValues(frontMatter[1]);
    if (config.requireMetadata) {
      for (const key of ["owner", "status", "lastReviewed", "reviewDue"]) {
        if (!metadata[key]) issues.push({ rule: "metadata", path: reportPath, detail: `Required front matter field '${key}' is missing.` });
      }
    }
    for (const key of ["lastReviewed", "reviewDue"]) {
      if (metadata[key] && !validDate(metadata[key])) issues.push({ rule: "metadata-date", path: reportPath, detail: `Front matter field '${key}' is not a valid YYYY-MM-DD date.` });
    }
    const { lastReviewed, reviewDue } = metadata;
    if (validDate(reviewDue) && reviewDue < localDate()) issues.push({ rule: "review-overdue", path: reportPath, detail: `Review was due ${reviewDue}.` });
    if (validDate(lastReviewed)) {
      const ageDays = Math.floor((Date.now() - new Date(`${lastReviewed}T00:00:00`).getTime()) / 86400000);
      if (ageDays > config.maxAgeDays) issues.push({ rule: "stale-document", path: reportPath, detail: `Last reviewed ${ageDays} days ago; limit is ${config.maxAgeDays}.` });
    }
  }
  for (const match of inspectable.matchAll(/\[[^\]]+\]\((<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\)/g)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (!rawTarget || /^(?:https?:|mailto:)/i.test(rawTarget)) continue;
    const [target, fragment] = rawTarget.split("#", 2);
    let decodedTarget;
    let decodedFragment;
    try {
      decodedTarget = target ? decodeURIComponent(target) : "";
      decodedFragment = fragment ? decodeURIComponent(fragment).toLowerCase() : "";
    } catch {
      issues.push({ rule: "invalid-link", path: reportPath, detail: `Invalid URL encoding: ${rawTarget}` });
      continue;
    }
    const linked = decodedTarget ? resolve(dirname(file), decodedTarget) : file;
    if (!(await exists(linked))) issues.push({ rule: "broken-link", path: reportPath, detail: `Missing target: ${rawTarget}` });
    else if (fragment && extname(linked).toLowerCase() === ".md") {
      const targetValue = await readCached(linked);
      if (!anchors(targetValue).has(decodedFragment)) issues.push({ rule: "broken-anchor", path: reportPath, detail: `Missing anchor: ${rawTarget}` });
    }
  }
  return issues;
}

function renderAudit(result, format) {
  if (format === "json") return JSON.stringify(result, null, 2);
  if (format === "markdown") {
    const rows = result.checks.map((row) => `| ${row.pass ? "PASS" : "FAIL"} | ${row.rule} | ${row.path} | ${row.detail} |`).join("\n");
    return `# Documentation audit\n\n- Checked: ${result.checkedAt}\n- Result: ${result.pass ? "PASS" : "FAIL"}\n\n| Status | Rule | Path | Detail |\n|---|---|---|---|\n${rows}\n`;
  }
  const rows = result.checks.map((row) => `${row.pass ? "PASS" : "FAIL"} ${row.rule} ${row.path}${row.detail ? ` — ${row.detail}` : ""}`).join("\n");
  return `Checked: ${result.checkedAt}\nResult: ${result.pass ? "PASS" : "FAIL"}\n${rows}`;
}

export async function auditDocumentation(options = {}) {
  const { root, config, configPath } = await loadProjectConfig(options.cwd);
  const checks = [];
  checks.push({ rule: "configuration", path: normalizeReportPath(relative(root, configPath)), pass: await exists(configPath), detail: "Project audit configuration" });
  for (const path of config.requiredDocuments) {
    let pass = false;
    try { pass = (await stat(resolve(root, path))).isFile(); } catch {}
    checks.push({ rule: "required-document", path, pass, detail: "Required file from configuration" });
  }
  const cache = new Map();
  for (const file of await markdownFiles(resolve(root, config.documentationRoot))) {
    for (const issue of await inspectMarkdown(file, root, config, cache)) checks.push({ ...issue, pass: false });
  }
  for (const check of await agentPointerChecks(root, config)) checks.push(check);
  const result = { checkedAt: new Date().toISOString(), pass: checks.every((row) => row.pass), checks };
  result.skill = await skillVersionState(root);
  console.log(renderAudit(result, options.format));
  if (options.report) {
    const extension = options.format === "json" ? "json" : options.format === "markdown" ? "md" : "txt";
    const output = resolve(root, config.documentationReports, `${localDate()}-documentation.${extension}`);
    const body = `${renderAudit(result, options.format)}\n`;
    const written = await writeUnique(output, body, options);
    console.log(`${written.status} ${written.path}`);
    result.reportPath = written.path;
  }
  if (options.format === "text") {
    for (const line of skillVersionWarnings(root, result.skill)) console.log(line);
    console.log("\nThis is a structural documentation check; it does not prove that every statement is factually complete or current.");
    console.log(`Continue: npx @ghostbyte/agent-docs-kit@latest next --cwd "${root}"`);
  }
  return result;
}

// Each agent recorded in config.agents must keep a pointer file that imports
// the canonical policy, so a tool-specific file can never silently drift.
async function agentPointerChecks(root, config) {
  const checks = [];
  for (const id of config.agents ?? []) {
    const definition = agentDefinition(id);
    const path = resolve(root, definition.instructionFile);
    if (!(await exists(path))) {
      checks.push({ rule: "agent-pointer", path: definition.instructionFile, pass: false, detail: `Configured for ${definition.label} but the file is missing. Run 'setup --agents ${id}', or remove '${id}' from config.agents.` });
      continue;
    }
    const imports = importsCanonicalInstructions(await readFile(path, "utf8"));
    checks.push({
      rule: "agent-pointer",
      path: definition.instructionFile,
      pass: imports,
      detail: imports
        ? `Imports ${canonicalInstructions} for ${definition.label}.`
        : `Does not import ${canonicalInstructions}. Add the single line '${importLine}' near the top of ${definition.instructionFile}.`
    });
  }
  return checks;
}

// Informational only: a vendored skill older than the running CLI is reported,
// never failed, so upgrading the CLI cannot break an existing pipeline.
async function skillVersionState(root) {
  const running = await kitVersion();
  const installed = [];
  for (const target of skillTargets) {
    if (target === "codex") continue;
    const directory = skillDestination(target, root);
    if (!(await exists(resolve(directory, "SKILL.md")))) continue;
    const version = await installedSkillVersion(resolve(directory, skillVersionFile));
    installed.push({ target, path: normalizeReportPath(relative(root, directory)), version, matches: version === running });
  }
  return { running, installed, stale: installed.filter((item) => !item.matches).map((item) => item.target) };
}

export function skillVersionWarnings(root, skill) {
  if (!skill) return [];
  const lines = [];
  for (const item of skill.installed) {
    if (item.matches) continue;
    lines.push(`
Installed skill ${item.path} records ${item.version ? `version ${item.version}` : "no version"}; this CLI is ${skill.running}.`);
    lines.push(`Refresh it: npx @ghostbyte/agent-docs-kit@latest skill install --target ${item.target} --force --cwd "${root}"`);
  }
  return lines;
}
