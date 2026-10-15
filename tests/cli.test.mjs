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
import { nextWorkflow, npxCommand, startWorkflow } from "../src/commands/workflow.mjs";
import { renderMarkdown } from "../scripts/markdown.mjs";
import { suggestReviews, traceChangedFiles } from "../src/commands/suggest.mjs";

async function completeDocumentationBaseline(root) {
  await setupProject({ cwd: root });
  await writeFile(join(root, "docs", "01-system", "overview.md"), "# System overview\n\nVerified system facts.\n");
  await writeFile(join(root, "docs", "02-project", "README.md"), "# Project\n\nVerified project status.\n");
  await writeFile(join(root, "docs", "05-operations", "README.md"), "# Operations\n\nVerified operating procedure.\n");
}

function documentationAuditChecks(pass = true) {
  return [
    { pass: true, rule: "configuration", path: ".agent-docs/config.json", detail: "Configuration loaded." },
    { pass: true, rule: "required-document", path: "docs/README.md", detail: "Required file exists." },
    { pass: true, rule: "required-document", path: "docs/01-system/overview.md", detail: "Required file exists." },
    { pass: true, rule: "required-document", path: "docs/02-project/README.md", detail: "Required file exists." },
    { pass: true, rule: "required-document", path: "docs/05-operations/README.md", detail: "Required file exists." },
    ...(pass ? [] : [{ pass: false, rule: "broken-link", path: "docs/01-system/overview.md", detail: "Missing target." }])
  ];
}

async function writeDocumentationAudit(root, name, { pass, checkedAt }) {
  const reports = join(root, "docs", "03-development", "audits");
  await mkdir(reports, { recursive: true });
  await writeFile(join(reports, name), JSON.stringify({ checkedAt, pass, checks: documentationAuditChecks(pass) }, null, 2));
}

async function snapshotFiles(directory, prefix = "") {
  const snapshot = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const itemPrefix = prefix ? `${prefix}/${item.name}` : item.name;
    const path = join(directory, item.name);
    if (item.isDirectory()) Object.assign(snapshot, await snapshotFiles(path, itemPrefix));
    else if (item.isFile()) snapshot[itemPrefix] = (await readFile(path)).toString("base64");
  }
  return snapshot;
}

test("setup is explicit, non-destructive, and repeatable", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    const preview = await setupProject({ cwd: root, dryRun: true });
    assert.ok(preview.every((item) => item.status === "planned"));
    const created = await setupProject({ cwd: root });
    assert.ok(created.every((item) => item.status === "created"));
    assert.match(await readFile(join(root, "AGENTS.md"), "utf8"), /Documentation maintenance is continuous/);
    const documentationIndex = await readFile(join(root, "docs", "README.md"), "utf8");
    assert.match(documentationIndex, /Maintain documentation with every change/);
    assert.match(documentationIndex, /does not automatically start a security or engineering review/);
    assert.ok(documentationIndex.includes(`${npxCommand} suggest reviews --staged`));
    assert.doesNotMatch(documentationIndex, /npx agent-docs suggest reviews/);
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
  assert.match(agent.text, /generated AGENTS\.md/);
  assert.match(agent.text, /Security and engineering remain separate, scoped reviews/);
  const manual = startWorkflow("manual");
  assert.match(manual.text, /documentation-impact loop/);
  assert.match(manual.text, /Documentation maintenance is continuous/);
  assert.throws(() => startWorkflow("unknown"), /Use new, existing, agent, or manual/);
});

test("review suggestions are read-only, evidence-labeled path heuristics", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await writeFile(join(root, "unchanged.txt"), "preserve me\n");
    const before = await snapshotFiles(root);
    const result = await suggestReviews({
      cwd: root,
      changedFiles: ["src/api/users.mjs", "site/index.html", "tests/auth.test.mjs"]
    });
    assert.deepEqual(await snapshotFiles(root), before);
    assert.equal(result.documentationInitialized, false);
    assert.ok(result.security.some((entry) => entry.slug === "api-layer"));
    assert.ok(result.security.some((entry) => entry.slug === "frontend-ui"));
    assert.ok(result.security.some((entry) => entry.slug === "application-security-testing"));
    assert.ok(result.engineering.some((entry) => entry.slug === "api-design-compatibility"));
    assert.ok(result.engineering.some((entry) => entry.slug === "testing-types"));
    assert.ok(result.security.every((entry) => entry.matchedFiles.length > 0 && entry.reason));
    assert.ok([...result.security, ...result.engineering].every((entry) => entry.command.startsWith(`${npxCommand} `)));
    const documentationOnly = await suggestReviews({ cwd: root, changedFiles: ["references/security-protocol.md"] });
    assert.ok(!documentationOnly.security.some((entry) => entry.slug === "application-security-testing"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("changed-file tracing distinguishes staged, working-tree, and base comparisons", () => {
  const calls = [];
  const runGit = (_executable, arguments_) => {
    calls.push(arguments_);
    if (arguments_.includes("--cached")) return Buffer.from("staged.mjs\0shared.mjs\0");
    if (arguments_[0] === "ls-files") return Buffer.from("new.mjs\0");
    if (arguments_.some((argument) => argument === "origin/main...HEAD")) return Buffer.from("pushed.mjs\0");
    return Buffer.from("working.mjs\0shared.mjs\0");
  };
  assert.deepEqual(traceChangedFiles({ cwd: ".", staged: true, runGit }), ["shared.mjs", "staged.mjs"]);
  assert.deepEqual(traceChangedFiles({ cwd: ".", runGit }), ["new.mjs", "shared.mjs", "staged.mjs", "working.mjs"]);
  assert.deepEqual(traceChangedFiles({ cwd: ".", base: "origin/main", runGit }), ["pushed.mjs"]);
  assert.ok(calls.every((arguments_) => arguments_.includes("-z")));
  assert.throws(() => traceChangedFiles({ base: "--output=bad", runGit }), /Invalid --base/);
});

test("review suggestion modes are mutually exclusive", async () => {
  await assert.rejects(suggestReviews({ staged: true, base: "origin/main", changedFiles: [] }), /either --staged or --base/);
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
  for (const format of ["json", "markdown", "text"]) {
    const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
    try {
      await completeDocumentationBaseline(root);
      await auditDocumentation({ cwd: root, report: true, format });
      const result = await nextWorkflow({ cwd: root });
      assert.equal(result.stage, 5, `${format} report should advance to Stage 5`);
      assert.match(result.text, /Latest documentation audit: PASS/);
    } finally { await rm(root, { recursive: true, force: true }); }
  }
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
    const completed = (await readFile(report.path, "utf8"))
      .replace("| Add each applicable control | Medium | Pass | File/line, command output, or approved observation | Required follow-up | Unassigned | Not verified |", "| SEC-04-01 | High | Pass | src/api.mjs:10 and authorization test output | None | Sam | Rerun the API authorization test |");
    await writeFile(report.path, completed);
    stages.push((await nextWorkflow({ cwd: root })).stage);
    assert.deepEqual(stages, [1, 2, 3, 4, 5, 5, 5, 6]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("next requires the latest applicable documentation audit to pass", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await completeDocumentationBaseline(root);
    await writeDocumentationAudit(root, "2026-10-14-documentation.json", { pass: true, checkedAt: "2026-10-14T10:00:00.000Z" });
    await writeDocumentationAudit(root, "2026-10-15-documentation.json", { pass: false, checkedAt: "2026-10-15T10:00:00.000Z" });
    const before = await snapshotFiles(root);
    const failed = await nextWorkflow({ cwd: root });
    assert.deepEqual(await snapshotFiles(root), before, "next must leave every fixture byte unchanged");
    assert.equal(failed.stage, 4);
    assert.match(failed.text, /Latest documentation audit: FAIL/);

    await writeDocumentationAudit(root, "2026-10-16-documentation.json", { pass: true, checkedAt: "2026-10-16T10:00:00.000Z" });
    const passed = await nextWorkflow({ cwd: root });
    assert.equal(passed.stage, 5);
    assert.match(passed.text, /Latest documentation audit: PASS/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("next ignores unrelated files and fails closed on malformed or inapplicable audits", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await completeDocumentationBaseline(root);
    const reports = join(root, "docs", "03-development", "audits");
    await mkdir(reports, { recursive: true });
    await writeFile(join(reports, "notes.txt"), "PASS");
    assert.equal((await nextWorkflow({ cwd: root })).stage, 4);

    await writeFile(join(reports, "2026-10-15-documentation.json"), "");
    assert.equal((await nextWorkflow({ cwd: root })).stage, 4);

    await writeFile(join(reports, "2026-10-15-documentation.json"), "{}");
    const malformed = await nextWorkflow({ cwd: root });
    assert.equal(malformed.stage, 4);
    assert.match(malformed.text, /INVALID/);

    await writeFile(join(reports, "2026-10-15-documentation.json"), JSON.stringify({
      checkedAt: "2026-10-15T10:00:00.000Z",
      pass: true,
      checks: documentationAuditChecks(true).filter((row) => row.path !== "docs/05-operations/README.md")
    }));
    const incomplete = await nextWorkflow({ cwd: root });
    assert.equal(incomplete.stage, 4);
    assert.match(incomplete.text, /does not cover configured required document/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("next accepts a valid legacy text audit without trusting arbitrary text", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await completeDocumentationBaseline(root);
    const reports = join(root, "docs", "03-development", "audits");
    await mkdir(reports, { recursive: true });
    await writeFile(join(reports, "2026-10-15-documentation.txt"), documentationAuditChecks(true)
      .map((row) => `PASS ${row.rule} ${row.path} — ${row.detail}`)
      .join("\n"));
    assert.equal((await nextWorkflow({ cwd: root })).stage, 5);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("next ignores unrelated Markdown in configured worksheet directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await completeDocumentationBaseline(root);
    await auditDocumentation({ cwd: root, report: true, format: "json" });
    const securityDirectory = join(root, "docs", "04-testing", "security-audits");
    await writeFile(join(securityDirectory, "README.md"), "# Team notes\n\nThis is not a worksheet.\n");
    const result = await nextWorkflow({ cwd: root });
    assert.equal(result.stage, 5);
    assert.match(result.text, /Security worksheets: none/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("next treats an evidence-backed failure as a completed record, not a passing control", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await completeDocumentationBaseline(root);
    await auditDocumentation({ cwd: root, report: true, format: "json" });
    const report = await auditSecurity("api-layer", { cwd: root });
    const completedFailure = (await readFile(report.path, "utf8"))
      .replace("- Overall status: Unverified", "- Overall status: Fail")
      .replace("| Add each applicable control | Medium | Unverified | File/line, command output, or approved observation | Required follow-up | Unassigned | Not verified |", "| SEC-04-01 | High | Fail | tests/api-rate-limit.test.mjs:42 failed | Add rate limiting | Sam | Rerun the rate-limit test |");
    await writeFile(report.path, completedFailure);
    const result = await nextWorkflow({ cwd: root });
    assert.equal(result.stage, 6);
    assert.match(result.text, /does not mean every control passed/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("forced setup atomically replaces owned files without leaving staging artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await setupProject({ cwd: root });
    const overview = join(root, "docs", "01-system", "overview.md");
    await writeFile(overview, "temporary contents\n");
    const agentInstructions = join(root, "AGENTS.md");
    await writeFile(agentInstructions, "# Project-specific agent policy\n");
    const replaced = await setupProject({ cwd: root, force: true });
    const protectedAgentFile = replaced.find((item) => item.path === agentInstructions);
    assert.equal(protectedAgentFile?.status, "skipped");
    assert.ok(replaced.filter((item) => item.path !== agentInstructions).every((item) => item.status === "created"));
    assert.match(await readFile(overview, "utf8"), /^# System overview/);
    assert.equal(await readFile(agentInstructions, "utf8"), "# Project-specific agent policy\n");
    const names = await readdir(join(root, "docs", "01-system"));
    assert.ok(names.every((name) => !name.includes(".agent-docs-stage-") && !name.includes(".agent-docs-backup-")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("existing agent instructions and unrelated repository skills remain untouched", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await mkdir(join(root, ".agents", "skills", "existing-skill"), { recursive: true });
    await writeFile(join(root, "AGENTS.md"), "# Existing project policy\n");
    await writeFile(join(root, ".agents", "skills", "existing-skill", "SKILL.md"), "# Existing skill\n");
    await setupProject({ cwd: root });
    await installSkill("project", { cwd: root });
    assert.equal(await readFile(join(root, "AGENTS.md"), "utf8"), "# Existing project policy\n");
    assert.equal(await readFile(join(root, ".agents", "skills", "existing-skill", "SKILL.md"), "utf8"), "# Existing skill\n");
    await access(join(root, ".agents", "skills", "manage-project-quality", "SKILL.md"));
    await access(join(root, "docs", "README.md"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("security and engineering reports use distinct semantics", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await setupProject({ cwd: root });
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
    await mkdir(join(root, "docs"), { recursive: true });
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
  assert.ok(validateReport("| Control ID | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| Placeholder | Pass | proof | Sam | retest |").some((error) => /valid SEC-NN-NN control ID/.test(error)));
  assert.ok(validateReport("| Control ID | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| SEC-01-01 | N/A | | Unassigned | Not verified |").some((error) => /evidence rationale/.test(error)));
  assert.deepEqual(validateReport("| Control ID | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| SEC-01-01 | N/A | Not applicable: the sample has no public API | Unassigned | Not verified |"), []);
  assert.deepEqual(validateReport("| Practice ID | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| ENG-01-01 | Recommended | tests\/api.test.mjs covers only success paths | Add failure cases | Sam | Run targeted tests |"), []);
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
    await setupProject({ cwd: root });
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
    await setupProject({ cwd: root });
    const reports = await Promise.all(Array.from({ length: 8 }, () => auditSecurity("04", { cwd: root })));
    assert.equal(new Set(reports.map((report) => report.path)).size, reports.length);
    assert.ok(reports.every((report) => report.status === "created"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("security and engineering worksheets require documentation initialization", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await assert.rejects(auditSecurity("04", { cwd: root }), /Initialize documentation before creating a security worksheet/);
    await assert.rejects(reviewEngineering("08", { cwd: root }), /Initialize documentation before creating an engineering worksheet/);
    await setupProject({ cwd: root });
    assert.equal((await auditSecurity("04", { cwd: root, dryRun: true })).status, "planned");
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

test("canonical website and mirror relationship stay consistent across public surfaces", async () => {
  const projectRoot = join(import.meta.dirname, "..");
  const canonical = "https://agent-docs-kit.ghostbyte1014.workers.dev/";
  const metadata = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  const readme = await readFile(join(projectRoot, "README.md"), "utf8");
  const site = await readFile(join(projectRoot, "site", "index.html"), "utf8");
  const privacy = await readFile(join(projectRoot, "site", "privacy.html"), "utf8");
  const hosting = await readFile(join(projectRoot, "docs", "GITHUB_AND_NPM_SETUP.md"), "utf8");
  const pagesWorkflow = await readFile(join(projectRoot, ".github", "workflows", "pages.yml"), "utf8");
  assert.equal(metadata.homepage, canonical);
  assert.equal(websiteUrl, canonical);
  assert.match(readme, new RegExp(canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(site, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
  assert.match(privacy, /Cloudflare Workers/);
  assert.match(privacy, /GitHub Pages as an optional mirror/);
  assert.match(hosting, /canonical public URL/);
  assert.match(hosting, /GitHub Pages mirror/);
  assert.ok(readme.includes(`@ghostbyte/agent-docs-kit@${metadata.version}`));
  assert.ok(site.includes(`@ghostbyte/agent-docs-kit@${metadata.version}`));
  assert.match(pagesWorkflow, /- run: npm test/);
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
  assert.match(helpText, /Documentation checks are automated/);
  assert.match(helpText, /separate point-in-time/);
  assert.match(helpText, /protected agent policy/);
  assert.match(helpText, /suggest reviews \[--staged\|--base <ref>\]/);
  assert.ok(helpText.includes(`${npxCommand} suggest reviews --staged`));
  assert.doesNotMatch(helpText, /^\s+npx agent-docs suggest reviews/m);
  assert.match(helpText, /Initialize documentation with 'setup'/);
  assert.match(helpText, /does not run vulnerability scans/);
});

test("website leads with accurate boundaries, safe onboarding, and genuine examples", async () => {
  const site = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../site/app.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../site/styles.css", import.meta.url), "utf8");
  assert.match(site, /Keep project documentation organized/);
  assert.match(site, /What runs automatically\?/);
  assert.match(site, /no active network scans run automatically/);
  assert.match(site, /One project memory\. Three quality lenses\./);
  assert.match(site, /View source on GitHub/);
  assert.match(site, /Sanitized, reproducible example/);
  assert.match(site, /Fresh security worksheet sample/);
  assert.match(site, /Fictional, manually reviewed evidence sample/);
  assert.match(site, /Safe first run/);
  assert.match(site, /node --version/);
  assert.match(site, /npx.*may download and cache the package/);
  assert.match(site, /Catalog areas, not scans/);
  assert.match(site, /documentation guide/);
  assert.match(site, /role="tab" aria-selected="true" aria-controls="code-panel-setup"/);
  assert.match(site, /start \[new\|existing\|agent\|manual\]/);
  assert.match(site, /does not bundle an AI model or background process/);
  assert.match(site, /AI-first, agent-assisted/);
  assert.match(site, /suggest reviews --staged/);
  assert.match(site, /npx @ghostbyte\/agent-docs-kit@latest suggest reviews --staged/);
  assert.doesNotMatch(site, /npx agent-docs suggest reviews/);
  assert.match(site, /Requires initialized documentation/);
  assert.match(site, /data-copy-visible/);
  assert.doesNotMatch(site, /data-copy-command/);
  assert.doesNotMatch(site, /data-panel="[^"]+"[^>]* hidden/);
  assert.doesNotMatch(site, /data-code-panel="[^"]+"[^>]* hidden/);
  assert.match(app, /visibleCopyText/);
  assert.match(app, /textContent\?\.trim/);
  assert.match(app, /Home.*End/);
  assert.match(styles, /button:focus-visible, a:focus-visible/);
  assert.match(styles, /overflow-x: auto/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(site, /rel="canonical" href="https:\/\/agent-docs-kit\.ghostbyte1014\.workers\.dev\/"/);
  assert.doesNotMatch(site, /git clone https:\/\/github\.com\/ghostbyte1014\/Agent_Docs_Kit\.git/);
  const footer = site.match(/<footer>([\s\S]*?)<\/footer>/)?.[1] ?? "";
  assert.match(footer, />Explore</);
  assert.match(footer, /href="#quick-start">Get started/);
  assert.match(footer, /href="#command-reference">CLI reference/);
  assert.match(footer, /href="privacy\.html">Privacy/);
  assert.match(footer, /href="terms\.html">Terms of use/);

  const outcome = site.indexOf('id="outcome"');
  const howItWorks = site.indexOf('id="how-it-works"');
  const workflows = site.indexOf('id="workflows"');
  const examples = site.indexOf('id="example-output"');
  const installationGuide = site.indexOf('id="quick-start"');
  const agentIntegration = site.indexOf('id="agentic-coding"');
  const trust = site.indexOf('id="trust"');
  const packageContents = site.indexOf('id="contents"');
  const commandOverview = site.indexOf('id="commands"');
  const cliReference = site.indexOf('id="command-reference"');
  assert.ok(outcome < howItWorks && howItWorks < workflows && workflows < examples, "outcomes, process, workflows, and examples should be ordered for first-time readers");
  assert.ok(examples < installationGuide && installationGuide < agentIntegration && agentIntegration < trust, "examples should lead into setup, AI integration, and trust boundaries");
  assert.ok(trust < packageContents && packageContents < commandOverview && commandOverview < cliReference, "advanced package and command references should come last");
});

test("site preview builds first and the artifact exposes only public documentation", async () => {
  const projectRoot = join(import.meta.dirname, "..");
  const metadata = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  assert.match(metadata.scripts["site:preview"], /^npm run build && /);
  execFileSync(process.execPath, ["scripts/build-site.mjs"], { cwd: projectRoot, stdio: "pipe" });
  const builtDocs = (await readdir(join(projectRoot, "build", "site", "docs"))).sort();
  assert.deepEqual(builtDocs, [
    "ARCHITECTURE.html",
    "BETA_TESTING_GUIDE.html",
    "CONTENT_MAINTENANCE.html",
    "GITHUB_AND_NPM_SETUP.html",
    "PURPOSE.html",
    "RELEASE_PROCESS.html",
    "SECURITY_MODEL.html"
  ]);
  await assert.rejects(access(join(projectRoot, "build", "site", "docs", "README.md")));
  const purposePage = await readFile(join(projectRoot, "build", "site", "docs", "PURPOSE.html"), "utf8");
  const securityPage = await readFile(join(projectRoot, "build", "site", "docs", "SECURITY_MODEL.html"), "utf8");
  const betaPage = await readFile(join(projectRoot, "build", "site", "docs", "BETA_TESTING_GUIDE.html"), "utf8");
  assert.match(purposePage, /<h1>Purpose and boundaries<\/h1>/);
  assert.match(purposePage, /href="\.\.\/privacy\.html">Privacy/);
  assert.match(purposePage, /href="\.\.\/terms\.html">Terms of use/);
  assert.doesNotMatch(purposePage, />GitHub and npm setup<\/a>|>Release process<\/a>/);
  assert.match(securityPage, /href="SECURITY_MODEL\.html" class="is-current">Security model/);
  assert.match(betaPage, /<h1>Closed-beta testing guide<\/h1>/);
  assert.match(betaPage, /rel="canonical" href="https:\/\/agent-docs-kit\.ghostbyte1014\.workers\.dev\/docs\/BETA_TESTING_GUIDE\.html"/);
  assert.match(betaPage, /AGENTS\.md/);
  assert.match(betaPage, /suggest reviews --staged/);
  assert.match(betaPage, /byte-for-byte unchanged/);
  const privacyPage = await readFile(join(projectRoot, "build", "site", "privacy.html"), "utf8");
  const termsPage = await readFile(join(projectRoot, "build", "site", "terms.html"), "utf8");
  assert.match(privacyPage, /agent-docs-command-mode/);
  assert.match(privacyPage, /canonical website is served as static assets through Cloudflare Workers/);
  assert.match(privacyPage, /GitHub Pages as an optional mirror/);
  assert.match(privacyPage, /does not make promises about.*infrastructure logging/);
  assert.match(termsPage, /Only assess systems you own or are explicitly authorized to test/);
  assert.match(termsPage, /MIT License/);
});

test("site Markdown rendering escapes content and permits only safe links", () => {
  const html = renderMarkdown([
    "# <unsafe>",
    "",
    "[Architecture](ARCHITECTURE.md#components)",
    "[External](https://example.com/docs?a=1&b=2)",
    "[Unsafe](javascript:alert(1))"
  ].join("\n"));
  assert.match(html, /<h1>&lt;unsafe&gt;<\/h1>/);
  assert.match(html, /href="ARCHITECTURE\.html#components"/);
  assert.match(html, /href="https:\/\/example\.com\/docs\?a=1&amp;b=2" target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /javascript:/i);
});
