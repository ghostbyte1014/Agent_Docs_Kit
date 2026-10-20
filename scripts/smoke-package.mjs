import { execFileSync, spawnSync } from "node:child_process";
import { access, mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { publicDocs as publicDocNames } from "./public-docs.mjs";

const root = resolve(import.meta.dirname, "..");
const scratch = await mkdtemp(resolve(tmpdir(), "agent-docs-kit-smoke-"));
const npmCli = process.env.npm_execpath;
const runNpm = (arguments_, options = {}) => npmCli
  ? execFileSync(process.execPath, [npmCli, ...arguments_], options)
  : execFileSync("npm", arguments_, options);
try {
  const cache = resolve(scratch, "npm-cache");
  const packed = JSON.parse(runNpm(["pack", "--json", "--cache", cache, "--pack-destination", scratch], { cwd: root, encoding: "utf8" }));
  const archivePaths = new Set(packed[0].files.map((entry) => entry.path.replaceAll("\\", "/")));
  const publicDocs = new Set(publicDocNames.map((name) => `docs/${name}`));
  for (const required of ["scripts/validate-content.mjs", "site/index.html", "tests/cli.test.mjs", "skills/manage-project-quality/references/security-protocol.md", "skills/manage-project-quality/references/engineering-protocol.md", "skills/manage-project-quality/references/documentation-governance.md"]) {
    if (!archivePaths.has(required)) throw new Error(`Packed archive is missing ${required}.`);
  }
  for (const publicDoc of publicDocs) {
    if (!archivePaths.has(publicDoc)) throw new Error(`Packed archive is missing public documentation: ${publicDoc}`);
  }
  for (const path of archivePaths) {
    if (/^(?:\.git|\.agent-docs|\.npm-cache|build|node_modules)(?:\/|$)|MONTHLY_MAINTENANCE_AI\.md$|\.tgz$/i.test(path)) throw new Error(`Private or generated path leaked into package: ${path}`);
    if (path.startsWith("docs/") && !publicDocs.has(path)) throw new Error(`Local documentation leaked into package: ${path}`);
  }
  const packageMetadata = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const declaredTargets = new Set([packageMetadata.main, ...Object.values(packageMetadata.bin ?? {})]);
  const collectExportTargets = (value) => {
    if (typeof value === "string") declaredTargets.add(value);
    else if (Array.isArray(value)) value.forEach(collectExportTargets);
    else if (value && typeof value === "object") Object.values(value).forEach(collectExportTargets);
  };
  collectExportTargets(packageMetadata.exports);
  for (const target of declaredTargets) {
    const normalized = target?.replace(/^\.\//, "").replaceAll("\\", "/");
    if (normalized && !archivePaths.has(normalized)) throw new Error(`Declared package entry point is missing from the archive: ${target}`);
  }
  const tarball = resolve(scratch, packed[0].filename);
  const consumer = resolve(scratch, "consumer");
  await mkdir(consumer);
  runNpm(["init", "--yes", "--cache", cache], { cwd: consumer, stdio: "ignore" });
  runNpm(["install", "--ignore-scripts", "--cache", cache, tarball], { cwd: consumer, stdio: "ignore" });
  const packageRoot = resolve(consumer, "node_modules", "@ghostbyte", "agent-docs-kit");
  const cli = resolve(packageRoot, "bin", "agent-docs.mjs");
  const runCli = (...arguments_) => execFileSync(process.execPath, [cli, ...arguments_], { cwd: consumer, encoding: "utf8" });
  const help = execFileSync(process.execPath, [cli, "--help"], { cwd: consumer, encoding: "utf8" });
  if (!help.includes("start [new|existing|agent|manual]") || !help.includes("Detect project state") || !help.includes("suggest reviews") || !help.includes("documentation guide") || !help.includes("security worksheet") || !help.includes("template create") || !help.includes("--ai") || !help.includes("--agents")) throw new Error("Packed CLI help is incomplete.");
  const agentStart = runCli("start", "agent");
  if (!agentStart.includes("$manage-project-quality") || !agentStart.includes("does not grant authority")) throw new Error("Packed CLI agent onboarding is incomplete.");
  const reviewGuide = runCli("review", "guide");
  if (!reviewGuide.includes("# Security and engineering review guide") || !reviewGuide.includes("`api-layer`")) throw new Error("Packed CLI review guide is incomplete.");
  const emptyNext = runCli("next");
  if (!emptyNext.includes("Stage 1: Initialize safely")) throw new Error("Packed CLI did not detect an uninitialized project.");
  const blockedWorksheet = spawnSync(process.execPath, [cli, "security", "worksheet", "api-layer"], { cwd: consumer, encoding: "utf8" });
  if (blockedWorksheet.status === 0 || !blockedWorksheet.stderr.includes("Initialize documentation before creating a security worksheet")) throw new Error("Packed CLI did not enforce documentation initialization before worksheet creation.");
  runCli("setup", "--dry-run");
  runCli("setup");
  const generatedDocumentation = await readFile(resolve(consumer, "docs", "README.md"), "utf8");
  if (!generatedDocumentation.includes("npx @ghostbyte/agent-docs-kit@latest suggest reviews --staged") || generatedDocumentation.includes("npx agent-docs suggest reviews")) throw new Error("Packed setup emitted an unreliable no-install suggestion command.");
  await access(resolve(consumer, "AGENTS.md"));
  const initializedNext = runCli("next");
  if (!initializedNext.includes("Stage 3: Build the documentation baseline")) throw new Error("Packed CLI did not detect the generated baseline.");
  const untouchedStrict = spawnSync(process.execPath, [cli, "audit", "documentation", "--strict"], { cwd: consumer, encoding: "utf8" });
  if (untouchedStrict.status === 0) throw new Error("A freshly generated scaffold must fail 'audit documentation --strict'.");
  if (!untouchedStrict.stdout.includes("starter-text")) throw new Error("The strict failure must name the starter-text rule.");
  const lenientAudit = spawnSync(process.execPath, [cli, "audit", "documentation"], { cwd: consumer, encoding: "utf8" });
  if (lenientAudit.status !== 0) throw new Error("'audit documentation' without --strict must exit 0 even when checks fail.");
  for (const [relativePath, heading, body] of [
    ["docs/01-system/overview.md", "# System overview", "Verified system boundary, users, and dependencies."],
    ["docs/02-project/README.md", "# Project", "Verified requirements, decisions, and delivery status."],
    ["docs/05-operations/README.md", "# Operations", "Verified setup, deployment, and recovery procedure."]
  ]) await writeFile(resolve(consumer, relativePath), [heading, "", body, ""].join("\n"), "utf8");
  runCli("audit", "documentation", "--strict", "--report", "--format", "json");
  const securityOutput = runCli("security", "worksheet", "api-layer");
  const engineeringOutput = runCli("engineering", "worksheet", "testing-types");
  for (const output of [securityOutput, engineeringOutput]) {
    const report = output.match(/created\s+(.+\.md)\s*$/m)?.[1];
    if (!report) throw new Error(`Unable to locate generated report in output: ${output}`);
    execFileSync(process.execPath, [resolve(packageRoot, "skills/manage-project-quality/scripts/check-report.mjs"), report], { cwd: consumer, stdio: "ignore" });
  }
  for (const type of ["adr", "runbook", "change", "incident", "evidence"]) runCli("template", "create", type, "--name", `smoke-${type}`);
  runCli("documentation", "guide", "system-documentation");
  runCli("skill", "install", "--target", "project");
  const aiProject = resolve(scratch, "ai-consumer");
  await mkdir(aiProject);
  const isolatedHome = resolve(scratch, "isolated-home");
  await mkdir(isolatedHome);
  execFileSync(process.execPath, [cli, "setup", "--ai"], {
    cwd: aiProject,
    encoding: "utf8",
    env: { ...process.env, HOME: isolatedHome, USERPROFILE: isolatedHome }
  });
  for (const required of ["AGENTS.md", "CLAUDE.md", "GEMINI.md", ".agent-docs/config.json", ".agents/skills/manage-project-quality/SKILL.md", ".claude/skills/manage-project-quality/SKILL.md"]) {
    await access(resolve(aiProject, required));
  }
  const pointer = await readFile(resolve(aiProject, "CLAUDE.md"), "utf8");
  if (!pointer.includes("@AGENTS.md")) throw new Error("setup --ai must create a CLAUDE.md that imports AGENTS.md.");
  const generatedPolicy = await readFile(resolve(aiProject, "AGENTS.md"), "utf8");
  if (generatedPolicy.includes("Philippine time") || generatedPolicy.includes("Created by")) throw new Error("Generated AGENTS.md must carry no author-specific defaults.");
  if ((await readdir(isolatedHome)).length) throw new Error("setup --ai wrote outside the project directory.");
  runCli("validate");
  await access(resolve(consumer, ".agents/skills/manage-project-quality/SKILL.md"));
  execFileSync(process.execPath, ["--input-type=module", "--eval", "const api = await import('@ghostbyte/agent-docs-kit'); if (typeof api.auditDocumentation !== 'function' || typeof api.createTemplate !== 'function' || typeof api.startWorkflow !== 'function' || typeof api.nextWorkflow !== 'function' || typeof api.suggestReviews !== 'function' || typeof api.showReviewGuide !== 'function') process.exit(1); const result = await api.suggestReviews({ cwd: process.cwd(), changedFiles: ['site/index.html'] }); if (!result.security.every((entry) => entry.command.startsWith('npx @ghostbyte/agent-docs-kit@latest '))) process.exit(1);"], { cwd: consumer, stdio: "ignore" });
  const invalid = spawnSync(process.execPath, [cli, "doctor", "unexpected"], { cwd: consumer, encoding: "utf8" });
  if (invalid.status === 0 || !invalid.stderr.includes("Invalid arguments")) throw new Error("CLI accepted an unexpected positional argument.");
  runNpm(["run", "validate"], { cwd: packageRoot, stdio: "ignore" });
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const reportBody = await readFile(resolve(consumer, "docs/03-development/audits", `${date}-documentation.json`), "utf8");
  JSON.parse(reportBody);
  console.log(`PASS packed installation (${packed[0].size} bytes, ${packed[0].entryCount} files)`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
