import test from "node:test";
import assert from "node:assert/strict";
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
