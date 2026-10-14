import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupProject } from "../src/commands/setup.mjs";
import { auditSecurity, reviewEngineering } from "../src/commands/audit.mjs";
import { browserCommand, openWebsite, websiteUrl } from "../src/commands/website.mjs";
import { helpText } from "../src/cli/help.mjs";
import { parseArguments, optionsFromFlags } from "../src/cli/arguments.mjs";
import { auditDocumentation } from "../src/commands/audit.mjs";
import { createTemplate } from "../src/commands/template.mjs";
import { validateReport } from "../skills/manage-project-quality/scripts/check-report.mjs";
import { showDocumentationGuide } from "../src/commands/guide.mjs";
import { installSkill } from "../src/commands/skill.mjs";
import { main } from "../src/cli/main.mjs";
import { nextWorkflow, startWorkflow } from "../src/commands/workflow.mjs";

test("setup is explicit, non-destructive, and repeatable", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    const preview = await setupProject({ cwd: root, dryRun: true });
    assert.ok(preview.every((item) => item.status === "planned"));
    const created = await setupProject({ cwd: root });
    assert.ok(created.every((item) => item.status === "created"));
    const repeated = await setupProject({ cwd: root });
    assert.ok(repeated.every((item) => item.status === "skipped"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("guided starts explain all human and agent onboarding paths", () => {
  const overview = startWorkflow();
  assert.deepEqual(overview.paths, ["new", "existing", "agent", "manual"]);
  const agent = startWorkflow("agent");
  assert.match(agent.text, /skill install --target project/);
  assert.match(agent.text, /Do not infer facts without evidence/);
  assert.throws(() => startWorkflow("unknown"), /Use new, existing, agent, or manual/);
});

test("next derives progress from project state without writing a progress file", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    const empty = await nextWorkflow({ cwd: root });
    assert.equal(empty.stage, 1);
    assert.match(empty.text, /setup --cwd/);
    await setupProject({ cwd: root });
    const baseline = await nextWorkflow({ cwd: root });
    assert.equal(baseline.stage, 3);
    assert.match(baseline.text, /AI-assisted path/);
    await assert.rejects(access(join(root, ".agent-docs", "state.json")));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("next recognizes documentation reports in every supported output format", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await setupProject({ cwd: root });
    await writeFile(join(root, "docs", "01-system", "overview.md"), "# System overview\n\nVerified system facts.\n");
    await writeFile(join(root, "docs", "02-project", "README.md"), "# Project\n\nVerified project status.\n");
    await writeFile(join(root, "docs", "05-operations", "README.md"), "# Operations\n\nVerified operating procedure.\n");
    await auditDocumentation({ cwd: root, report: true, format: "json" });
    const result = await nextWorkflow({ cwd: root });
    assert.equal(result.stage, 5);
    assert.match(result.text, /Saved documentation audits: 1/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("next covers the complete repository-backed workflow lifecycle", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    const stages = [];
    stages.push((await nextWorkflow({ cwd: root })).stage);
    await setupProject({ cwd: root });
    await rm(join(root, "docs", "01-system", "overview.md"));
    stages.push((await nextWorkflow({ cwd: root })).stage);
    await setupProject({ cwd: root });
    stages.push((await nextWorkflow({ cwd: root })).stage);
    await writeFile(join(root, "docs", "01-system", "overview.md"), "# System overview\n\nVerified system facts.\n");
    await writeFile(join(root, "docs", "02-project", "README.md"), "# Project\n\nVerified project status.\n");
    await writeFile(join(root, "docs", "05-operations", "README.md"), "# Operations\n\nVerified operating procedures.\n");
    stages.push((await nextWorkflow({ cwd: root })).stage);
    await auditDocumentation({ cwd: root, report: true, format: "markdown" });
    stages.push((await nextWorkflow({ cwd: root })).stage);
    const report = await auditSecurity("api-layer", { cwd: root });
    stages.push((await nextWorkflow({ cwd: root })).stage);
    await writeFile(report.path, (await readFile(report.path, "utf8")).replaceAll("Unverified", "Pass"));
    stages.push((await nextWorkflow({ cwd: root })).stage);
    assert.deepEqual(stages, [1, 2, 3, 4, 5, 5, 6]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("forced setup atomically replaces owned files without leaving staging artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await setupProject({ cwd: root });
    const overview = join(root, "docs", "01-system", "overview.md");
    await writeFile(overview, "temporary contents\n");
    const replaced = await setupProject({ cwd: root, force: true });
    assert.ok(replaced.every((item) => item.status === "created"));
    assert.match(await readFile(overview, "utf8"), /^# System overview/);
    const names = await readdir(join(root, "docs", "01-system"));
    assert.ok(names.every((name) => !name.includes(".agent-docs-stage-") && !name.includes(".agent-docs-backup-")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("security and engineering reports use distinct semantics", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    const security = await auditSecurity("04", { cwd: root });
    const engineering = await reviewEngineering("08", { cwd: root });
    assert.match(await readFile(security.path, "utf8"), /Security worksheet: API Layer/);
    assert.match(await readFile(security.path, "utf8"), /Scope and authorization/);
    assert.deepEqual(validateReport(await readFile(security.path, "utf8")), []);
    const engineeringText = await readFile(engineering.path, "utf8");
    assert.match(engineeringText, /Engineering worksheet: Testing Types/);
    assert.match(engineeringText, /Review context/);
    assert.doesNotMatch(engineeringText, /Authorization: _Required/);
    assert.deepEqual(validateReport(engineeringText), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("CLI reports inherit the configured interaction style when no flag is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await mkdir(join(root, ".agent-docs"), { recursive: true });
    await writeFile(join(root, ".agent-docs", "config.json"), JSON.stringify({ schemaVersion: 2, documentationRoot: "docs", documentationReports: "docs/audits", securityReports: "docs/security", engineeringReports: "docs/engineering", templateOutput: "docs", interactionStyle: "learning", maxAgeDays: 30, requireMetadata: false, requiredDocuments: [] }));
    const result = await main(["security", "worksheet", "04", "--cwd", root]);
    assert.match(await readFile(result.path, "utf8"), /- Style: learning/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("arguments reject unknown options, styles, and installation targets", () => {
  assert.throws(() => parseArguments(["setup", "--mystery"]), /Unknown option/);
  assert.throws(() => optionsFromFlags({ style: "verbose" }), /Invalid style/);
  assert.throws(() => optionsFromFlags({ target: "elsewhere" }), /Invalid target/);
  assert.deepEqual(parseArguments(["audit", "documentation", "--strict"]).positionals, ["audit", "documentation"]);
});

test("documentation audit consumes config and detects broken local links", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await mkdir(join(root, ".agent-docs"), { recursive: true });
    await mkdir(join(root, "knowledge"), { recursive: true });
    await writeFile(join(root, ".agent-docs", "config.json"), JSON.stringify({ schemaVersion: 2, documentationRoot: "knowledge", documentationReports: "reports", securityReports: "reports/security", engineeringReports: "reports/engineering", templateOutput: "knowledge", maxAgeDays: 30, requireMetadata: false, requiredDocuments: ["knowledge/index.md"] }));
    await writeFile(join(root, "knowledge", "index.md"), "# Index\n\n[Missing](missing.md)\n");
    const result = await auditDocumentation({ cwd: root, format: "json" });
    assert.equal(result.pass, false);
    assert.ok(result.checks.some((row) => row.rule === "broken-link"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("templates are explicit and protect existing files", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    const first = await createTemplate("adr", { cwd: root });
    const second = await createTemplate("adr", { cwd: root });
    const named = await createTemplate("adr", { cwd: root, name: "cache-policy" });
    assert.equal(first.status, "created");
    assert.equal(second.status, "created");
    assert.match(second.path, /-adr-2\.md$/);
    assert.match(named.path, /-adr-cache-policy\.md$/);
    assert.match(await readFile(first.path, "utf8"), /# Architecture decision record/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("documentation guidance is discoverable from the canonical catalog", async () => {
  const result = await showDocumentationGuide("system");
  assert.equal(result.entry.id, "01");
  assert.match(result.contents, /DOC-01-01/);
  assert.match(result.contents, /# System Documentation/);
});

test("report validation rejects unknown statuses and unsupported claims", () => {
  assert.ok(validateReport("| Check | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| A | Definitely fine | proof | Sam | retest |").length > 0);
  assert.ok(validateReport("| Check | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| A | Pass | | Unassigned | Not verified |").length >= 3);
  assert.deepEqual(validateReport("| Check | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| A | Pass | test output | Sam | rerun test |") , []);
  assert.deepEqual(validateReport("| Check | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| A | Pass | command \\| output | Sam | rerun test |") , []);
  assert.ok(validateReport("| Control ID | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| SEC-01-01 | Applied | proof | Sam | retest |").some((error) => /invalid status/.test(error)));
  assert.ok(validateReport("| Practice ID | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| ENG-01-01 | Pass | proof | Sam | retest |").some((error) => /invalid status/.test(error)));
});

test("documentation audit enforces metadata, same-document anchors, and exact report formats", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await mkdir(join(root, ".agent-docs"), { recursive: true });
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, ".agent-docs", "config.json"), JSON.stringify({ schemaVersion: 2, documentationRoot: "docs", documentationReports: "reports", securityReports: "reports/security", engineeringReports: "reports/engineering", templateOutput: "docs", interactionStyle: "standard", maxAgeDays: 30, requireMetadata: true, requiredDocuments: ["docs/index.md"] }));
    await writeFile(join(root, "docs", "index.md"), "---\nowner: Docs\nstatus: current\nlastReviewed: 2026-99-99\n---\n# Index\n\n[Missing](#missing)\n\n```text\nTODO\n# Not a heading\n```\n");
    const result = await auditDocumentation({ cwd: root, report: true, format: "text" });
    assert.equal(result.pass, false);
    assert.match(result.reportPath, /\.txt$/);
    assert.ok(result.checks.some((row) => row.rule === "metadata" && /reviewDue/.test(row.detail)));
    assert.ok(result.checks.some((row) => row.rule === "metadata-date"));
    assert.ok(result.checks.some((row) => row.rule === "broken-anchor"));
    assert.ok(!result.checks.some((row) => row.rule === "placeholder"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("dry runs select the same collision-safe report path as a real write", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await auditSecurity("04", { cwd: root });
    const preview = await auditSecurity("04", { cwd: root, dryRun: true });
    const created = await auditSecurity("04", { cwd: root });
    assert.equal(preview.status, "planned");
    assert.equal(preview.path, created.path);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("concurrent report creation is collision safe", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    const reports = await Promise.all(Array.from({ length: 8 }, () => auditSecurity("04", { cwd: root })));
    assert.equal(new Set(reports.map((report) => report.path)).size, reports.length);
    assert.ok(reports.every((report) => report.status === "created"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("malformed link encoding becomes an audit finding instead of a runtime error", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await mkdir(join(root, ".agent-docs"), { recursive: true });
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, ".agent-docs", "config.json"), JSON.stringify({ schemaVersion: 2, documentationRoot: "docs", documentationReports: "reports", securityReports: "reports/security", engineeringReports: "reports/engineering", templateOutput: "docs", interactionStyle: "standard", maxAgeDays: 30, requireMetadata: false, requiredDocuments: ["docs/index.md"] }));
    await writeFile(join(root, "docs", "index.md"), "# Index\n\n[Malformed](bad%ZZ.md)\n");
    const result = await auditDocumentation({ cwd: root });
    assert.ok(result.checks.some((row) => row.rule === "invalid-link"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("forced skill installation removes stale owned files", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await installSkill("project", { cwd: root });
    const stale = join(root, ".agents", "skills", "manage-project-quality", "references", "stale.md");
    await writeFile(stale, "stale");
    await installSkill("project", { cwd: root, force: true });
    await assert.rejects(access(stale));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("CLI rejects extra positional arguments and command-inapplicable options", async () => {
  await assert.rejects(main(["doctor", "unexpected"]), /Invalid arguments/);
  await assert.rejects(main(["website", "--report"]), /not valid here/);
  await assert.rejects(main(["audit", "worksheet", "04"]), /Unknown command/);
  await assert.rejects(main(["engineering", "engineering", "08"]), /Unknown command/);
  assert.throws(() => optionsFromFlags({ name: "Not valid" }), /Invalid name/);
});

test("website command opens the documented URL without a shell dependency", () => {
  let invocation;
  const child = { once() {}, unref() {} };
  const returned = openWebsite({
    platform: "darwin",
    spawnProcess(executable, arguments_, options) {
      invocation = { executable, arguments_, options };
      return child;
    }
  });
  assert.equal(returned, websiteUrl);
  assert.equal(invocation.executable, "open");
  assert.deepEqual(invocation.arguments_, [websiteUrl]);
  assert.equal(invocation.options.detached, true);
  assert.equal(browserCommand("win32").executable, "cmd.exe");
  assert.equal(browserCommand("linux").executable, "xdg-open");
});

test("help distinguishes no-install, local, and global command forms", () => {
  assert.match(helpText, /npx @ghostbyte\/agent-docs-kit@latest \[command\]/);
  assert.match(helpText, /npx agent-docs \[command\]/);
  assert.match(helpText, /agent-docs \[command\]/);
  assert.match(helpText, /agent-docs --version/);
  assert.match(helpText, /npm view @ghostbyte\/agent-docs-kit version/);
  assert.match(helpText, /npm install --global @ghostbyte\/agent-docs-kit@latest/);
  assert.match(helpText, /start \[new\|existing\|agent\|manual\]/);
  assert.match(helpText, /next\s+Detect project state/);
});

test("website provides a complete installation guide without a GitHub header button", async () => {
  const site = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  assert.match(site, /Installation guide/);
  assert.match(site, /node --version/);
  assert.match(site, /Run without installing/);
  assert.match(site, /Install the global command/);
  assert.match(site, /<dt>33<\/dt><dd>Review areas<\/dd>/);
  assert.match(site, /documentation guide/);
  assert.match(site, /role="tab" aria-selected="true" aria-controls="code-panel-setup"/);
  assert.match(site, /If <code>agent-docs<\/code> is not recognized/);
  assert.match(site, /Choose a path, then let the kit show what comes next/);
  assert.match(site, /start \[new\|existing\|agent\|manual\]/);
  assert.match(site, /The package is context, not automatic authority/);
  assert.match(site, /The kit supplies project memory and review rules/);
  assert.match(site, /does not bundle an AI model or start a background service/);
  assert.match(site, /This can reduce unnecessary context and token usage/);
  assert.match(site, /Actual token use still depends on the agent, repository, and requested scope/);
  assert.doesNotMatch(site, /View on GitHub/);
  assert.doesNotMatch(site, /git clone https:\/\/github\.com\/ghostbyte1014\/Agent_Docs_Kit\.git/);
  assert.doesNotMatch(site, /Run the repository source/);

  const commandOverview = site.indexOf('id="commands"');
  const installationGuide = site.indexOf('id="quick-start"');
  const packageContents = site.indexOf('id="contents"');
  const cliReference = site.indexOf('id="command-reference"');
  assert.ok(commandOverview < installationGuide, "installation should follow the command-mode overview");
  assert.ok(installationGuide < packageContents, "package details should follow installation");
  assert.ok(packageContents < cliReference, "the complete CLI reference should be the final main section");
});

test("site preview builds first and the artifact exposes only public documentation", async () => {
  const projectRoot = join(import.meta.dirname, "..");
  const metadata = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  assert.match(metadata.scripts["site:preview"], /^npm run build && /);
  execFileSync(process.execPath, ["scripts/build-site.mjs"], { cwd: projectRoot, stdio: "pipe" });
  const builtDocs = (await readdir(join(projectRoot, "build", "site", "docs"))).sort();
  assert.deepEqual(builtDocs, [
    "ARCHITECTURE.md",
    "CONTENT_MAINTENANCE.md",
    "GITHUB_AND_NPM_SETUP.md",
    "PURPOSE.md",
    "RELEASE_PROCESS.md",
    "SECURITY_MODEL.md"
  ]);
  await assert.rejects(access(join(projectRoot, "build", "site", "docs", "README.md")));
});
