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
import { reviewGuideUrl, showReviewGuide } from "../src/commands/review-guide.mjs";
import { installSkill } from "../src/commands/skill.mjs";
import { main } from "../src/cli/main.mjs";
import { nextWorkflow, npxCommand, startWorkflow } from "../src/commands/workflow.mjs";
import { renderMarkdown } from "../scripts/markdown.mjs";
import { suggestReviews, traceChangedFiles } from "../src/commands/suggest.mjs";
import { versionPlaceholder } from "../src/core/version.mjs";
import { worksheetReportState } from "../src/core/report-validation.mjs";
import { validateWorksheetFile } from "../src/commands/report.mjs";

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

function completeSecurityWorksheet(text, failureId) {
  const overall = failureId ? "Fail" : "Pass";
  return text
    .replace("- Overall status: Unverified", `- Overall status: ${overall}`)
    .replace(/^\| (SEC-\d{2}-\d{2}) \| ([^|]+) \| Passive first \| Unverified \| \| \| \| \|$/gm, (_row, id, priority) => {
      if (id === failureId) {
        return `| ${id} | ${priority.trim()} | Passive | Fail | Focused test failed for ${id} | Fix the failed control | Sam | Rerun the focused test |`;
      }
      return `| ${id} | ${priority.trim()} | Passive | Pass | Repository evidence for ${id} | None | Sam | Rerun the focused check |`;
    });
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
    const agentPolicy = await readFile(join(root, "AGENTS.md"), "utf8");
    assert.match(agentPolicy, /Documentation maintenance is continuous/);
    assert.match(agentPolicy, /CHANGE RECORDS: ON/);
    assert.match(agentPolicy, /FREEZE: OFF/);
    assert.match(agentPolicy, /every AI coding agent/);
    assert.match(agentPolicy, /Validation commands:.*inspect the repository-defined command for side effects/);
    assert.doesNotMatch(agentPolicy, /Allowed read operations/);
    const freezeGuide = await readFile(join(root, "docs", "05-operations", "agents", "CHANGE_FREEZE_GUIDE.md"), "utf8");
    assert.match(freezeGuide, /Change freeze guide/);
    assert.match(freezeGuide, /Validation commands:.*inspect the repository-defined command for side effects/);
    assert.doesNotMatch(freezeGuide, /Allowed read operations/);
    assert.match(await readFile(join(root, "docs", "05-operations", "agents", "feature-updates", "README.md"), "utf8"), /Feature updates and change records/);
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

test("AI setup creates protected pointers for common coding agents", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await setupProject({ cwd: root, ai: true });
    for (const name of ["CODEX.md", "CLAUDE.md", "GEMINI.md", "CURSOR.md", "COPILOT.md"]) {
      assert.match(await readFile(join(root, name), "utf8"), /^@AGENTS\.md\s*$/m);
    }
    const config = JSON.parse(await readFile(join(root, ".agent-docs", "config.json"), "utf8"));
    assert.deepEqual(config.agents, ["codex", "claude", "gemini", "cursor", "copilot"]);
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
      changedFiles: ["src/api/users.mjs", "site/index.html", "tests/auth.test.mjs", ".agents/skills/tool/SKILL.md"]
    });
    assert.deepEqual(await snapshotFiles(root), before);
    assert.equal(result.documentationInitialized, false);
    assert.ok(result.security.some((entry) => entry.slug === "api-layer"));
    assert.ok(result.security.some((entry) => entry.slug === "frontend-ui"));
    assert.ok(result.security.some((entry) => entry.slug === "application-security-testing"));
    assert.ok(result.security.some((entry) => entry.slug === "agentic-ai-tooling"));
    assert.ok(result.engineering.some((entry) => entry.slug === "api-design-compatibility"));
    assert.ok(result.engineering.some((entry) => entry.slug === "testing-types"));
    assert.ok(result.engineering.some((entry) => entry.slug === "frontend-accessibility"));
    assert.ok(result.engineering.some((entry) => entry.slug === "agent-workflow-quality"));
    assert.ok(result.documentation.some((entry) => entry.slug === "development-records"));
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

test("documentation suggestions are available before project setup", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  const output = [];
  const originalLog = console.log;
  try {
    console.log = (...values) => output.push(values.join(" "));
    await suggestReviews({ cwd: root, changedFiles: ["src/api/users.mjs"] });
  } finally {
    console.log = originalLog;
    await rm(root, { recursive: true, force: true });
  }
  const text = output.join("\n");
  assert.match(text, /Available now: .* documentation guide /);
  assert.match(text, /After documentation setup, if relevant: .* security worksheet /);
  assert.doesNotMatch(text, /After documentation setup, if relevant: .* documentation guide /);
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
    const worksheet = await readFile(report.path, "utf8");
    stages.push((await nextWorkflow({ cwd: root })).stage);
    await writeFile(report.path, worksheet.replaceAll("Unverified", "Pass"));
    stages.push((await nextWorkflow({ cwd: root })).stage);
    await writeFile(report.path, completeSecurityWorksheet(worksheet));
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
    const completedFailure = completeSecurityWorksheet(await readFile(report.path, "utf8"), "SEC-04-01");
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
    const securityText = await readFile(security.path, "utf8");
    assert.match(securityText, /Security worksheet: API Layer/);
    assert.match(securityText, /Scope and authorization/);
    assert.match(securityText, /^- Expected finding IDs: SEC-04-01,/m);
    assert.deepEqual(validateReport(securityText), []);
    const engineeringText = await readFile(engineering.path, "utf8");
    assert.match(engineeringText, /Engineering worksheet: Testing Types/);
    assert.match(engineeringText, /Review context/);
    assert.doesNotMatch(engineeringText, /Authorization: _Required/);
    assert.deepEqual(validateReport(engineeringText), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("worksheet command validation distinguishes an open template from a completed review", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await setupProject({ cwd: root });
    const report = await auditSecurity("api-layer", { cwd: root });
    const open = await validateWorksheetFile(report.path, { cwd: root });
    assert.equal(open.pass, false);
    assert.ok(open.errors.some((error) => /incomplete/.test(error)));
    await writeFile(report.path, completeSecurityWorksheet(await readFile(report.path, "utf8")));
    const complete = await validateWorksheetFile(report.path, { cwd: root });
    assert.equal(complete.pass, true);
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

test("phase and topic flags behave like positional worksheet selectors", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await setupProject({ cwd: root });
    const securityPositional = await main(["security", "worksheet", "04", "--cwd", root]);
    const securityFlag = await main(["security", "worksheet", "--phase", "04", "--cwd", root]);
    assert.equal(await readFile(securityFlag.path, "utf8"), await readFile(securityPositional.path, "utf8"));
    const engineeringPositional = await main(["engineering", "worksheet", "08", "--cwd", root]);
    const engineeringFlag = await main(["engineering", "worksheet", "--topic", "08", "--cwd", root]);
    assert.equal(await readFile(engineeringFlag.path, "utf8"), await readFile(engineeringPositional.path, "utf8"));
    await assert.rejects(main(["security", "worksheet", "04", "--phase", "05", "--cwd", root]), /Choose either '04' or '--phase'/);
    await assert.rejects(main(["engineering", "worksheet", "08", "--topic", "09", "--cwd", root]), /Choose either '08' or '--topic'/);
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

test("review guide can be printed or opened without creating a worksheet", async () => {
  const printed = await main(["review", "guide"]);
  assert.equal(printed.opened, false);
  assert.equal(printed.url, reviewGuideUrl);
  assert.match(printed.contents, /# Security and engineering review guide/);
  assert.match(printed.contents, /## How to activate a selector/);
  assert.match(printed.contents, /security worksheet <selector> --dry-run/);
  assert.match(printed.contents, /engineering worksheet <selector> --dry-run/);
  assert.match(printed.contents, /Activating a selector means choosing its checklist/);
  assert.match(printed.contents, /If the phase, topic, or scope is not known yet/);
  assert.match(printed.contents, /### Run the command from a terminal/);
  assert.match(printed.contents, /Windows PowerShell/);
  assert.match(printed.contents, /npx\.cmd @ghostbyte\/agent-docs-kit@latest security worksheet api-layer --dry-run/);
  assert.match(printed.contents, /The response should say `planned` and `Preview only`/);
  assert.match(printed.contents, /remove `--dry-run`/);
  assert.match(printed.contents, /`api-layer`/);
  assert.match(printed.contents, /\| Fail \|/);
  assert.match(printed.contents, /\| Recommended \|/);

  let invocation;
  const child = { once() {}, unref() {} };
  const opened = await showReviewGuide({
    open: true,
    platform: "darwin",
    spawnProcess(executable, arguments_, options) {
      invocation = { executable, arguments_, options };
      return child;
    }
  });
  assert.equal(opened.opened, true);
  assert.equal(opened.url, reviewGuideUrl);
  assert.deepEqual(invocation.arguments_, [reviewGuideUrl]);
});

test("report validation rejects unknown statuses and unsupported claims", () => {
  assert.ok(validateReport("| Check | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| A | Definitely fine | proof | Sam | retest |").length > 0);
  assert.ok(validateReport("| Check | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| A | Pass | | Unassigned | Not verified |").length >= 3);
  assert.deepEqual(validateReport("| Check | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| A | Pass | test output | Sam | rerun test |") , []);
  assert.deepEqual(validateReport("| Check | Status | Evidence | Owner | Verification |\n|---|---|---|---|---|\n| A | Pass | command \\| output | Sam | rerun test |") , []);
  const securityHeader = "| Control ID | Priority | Evidence mode | Status | Evidence | Remediation | Owner | Verification |\n|---|---|---|---|---|---|---|---|\n";
  const engineeringHeader = "| Practice ID | Status | Evidence | Impact | Recommendation | Owner | Verification |\n|---|---|---|---|---|---|---|\n";
  assert.ok(validateReport(`${securityHeader}| SEC-01-01 | High | Passive | Applied | proof | None | Sam | retest |`).some((error) => /invalid status/.test(error)));
  assert.ok(validateReport(`${engineeringHeader}| ENG-01-01 | Pass | proof | Slow builds | Cache dependencies | Sam | retest |`).some((error) => /invalid status/.test(error)));
  assert.ok(validateReport(`${securityHeader}| Placeholder | High | Passive | Pass | proof | None | Sam | retest |`).some((error) => /valid SEC-NN-NN control ID/.test(error)));
  assert.ok(validateReport(`${securityHeader}| SEC-01-01 | High | Passive | N/A | | None | Unassigned | Not verified |`).some((error) => /evidence rationale/.test(error)));
  assert.deepEqual(validateReport(`${securityHeader}| SEC-01-01 | High | Passive | N/A | Not applicable: the sample has no public API | None | Unassigned | Not verified |`), []);
  assert.deepEqual(validateReport(`${engineeringHeader}| ENG-01-01 | Recommended | tests/api.test.mjs covers only success paths | Failures can regress | Add failure cases | Sam | Run targeted tests |`), []);
});

test("worksheet validation rejects incomplete, duplicate, and contradictory findings", () => {
  const header = "| Control ID | Priority | Evidence mode | Status | Evidence | Remediation | Owner | Verification |\n|---|---|---|---|---|---|---|---|\n";
  const duplicateRows = "| SEC-01-01 | High | Passive | Pass | test output | None | Sam | retest |\n| SEC-01-01 | High | Passive | Pass | test output | None | Sam | retest |";
  const state = worksheetReportState(`# Security worksheet\n\n- Overall status: Fail\n\n## Findings\n\n${header}${duplicateRows}\n\n## Reference checklist\n\n| Control ID |\n|---|\n| SEC-01-01 |\n| SEC-01-02 |\n`);
  assert.ok(state.errors.some((error) => /duplicate finding ID/.test(error)));
  assert.ok(state.errors.some((error) => /SEC-01-02.*missing from the findings/.test(error)));
  assert.ok(state.errors.some((error) => /conflicts with finding statuses/.test(error)));
  assert.ok(state.warnings.some((warning) => /Legacy worksheet.*cannot fully verify completeness/.test(warning)));
  assert.ok(validateReport(`${header}| SEC-01-01 | High | Automatic scan | Pass | proof | None | Sam | retest |`).some((error) => /invalid evidence mode/.test(error)));
});

test("worksheet metadata detects an ID removed from both findings and the reference checklist", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await setupProject({ cwd: root });
    const report = await auditSecurity("api-layer", { cwd: root });
    const completed = completeSecurityWorksheet(await readFile(report.path, "utf8"));
    const removedFromBothSections = completed.replace(/^\| SEC-04-01 \|.*\r?\n/gm, "");
    const state = worksheetReportState(removedFromBothSections);
    assert.ok(state.errors.some((error) => /SEC-04-01.*missing from the findings table/.test(error)));
    assert.ok(state.errors.some((error) => /SEC-04-01.*missing from the Reference checklist/.test(error)));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("legacy worksheets retain checklist validation and surface their completeness warning", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    await completeDocumentationBaseline(root);
    await auditDocumentation({ cwd: root, report: true, format: "markdown" });
    const report = await auditSecurity("api-layer", { cwd: root });
    const legacy = completeSecurityWorksheet(await readFile(report.path, "utf8"))
      .replace(/^- Expected finding IDs:.*\r?\n/m, "");
    await writeFile(report.path, legacy);
    const validation = await validateWorksheetFile(report.path, { cwd: root });
    assert.equal(validation.pass, true);
    assert.ok(validation.warnings.some((warning) => /Legacy worksheet.*cannot fully verify completeness/.test(warning)));
    const next = await nextWorkflow({ cwd: root });
    assert.equal(next.stage, 6);
    assert.ok(next.notices.some((notice) => /Legacy worksheet.*cannot fully verify completeness/.test(notice)));
  } finally { await rm(root, { recursive: true, force: true }); }
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
  await assert.rejects(main(["review", "guide", "extra"]), /Invalid arguments/);
  await assert.rejects(main(["review", "guide", "--report"]), /not valid here/);
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
  const hosting = await readFile(join(projectRoot, "docs", "PUBLISHING_AND_HOSTING.md"), "utf8");
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
  // The page source carries a placeholder; scripts/build-site.mjs substitutes
  // the real version, so the built output is the only place it appears.
  assert.ok(site.includes(versionPlaceholder), "site/index.html must keep the version placeholder");
  assert.doesNotMatch(site, new RegExp("@ghostbyte/agent-docs-kit@[0-9]+[.][0-9]+[.][0-9]+"), "site/index.html must not pin a literal version");
  execFileSync(process.execPath, ["scripts/build-site.mjs"], { cwd: projectRoot, stdio: "pipe" });
  const builtSite = await readFile(join(projectRoot, "build", "site", "index.html"), "utf8");
  assert.ok(builtSite.includes(`@ghostbyte/agent-docs-kit@${metadata.version}`));
  assert.ok(!builtSite.includes(versionPlaceholder));
  // One source for the version: the lockfile must agree too.
  const lock = JSON.parse(await readFile(join(projectRoot, "package-lock.json"), "utf8"));
  assert.equal(lock.version, metadata.version);
  assert.equal(lock.packages[""].version, metadata.version);
  const releaseProcess = await readFile(join(projectRoot, "docs", "RELEASE_PROCESS.md"), "utf8");
  assert.ok(releaseProcess.includes(`npm version ${metadata.version}`), "docs/RELEASE_PROCESS.md must pin the current version");
  assert.doesNotMatch(releaseProcess, new RegExp("npm[.]cmd version"), "release commands must be portable");
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
  assert.match(helpText, /review guide \[--open\]/);
  assert.match(helpText, /list <documentation\|security\|engineering>/);
  assert.match(helpText, /--phase <selector>/);
  assert.match(helpText, /--topic <selector>/);
  assert.ok(helpText.includes(`${npxCommand} suggest reviews --staged`));
  assert.doesNotMatch(helpText, /^\s+npx agent-docs suggest reviews/m);
  assert.match(helpText, /Initialize documentation with 'setup'/);
  assert.match(helpText, /does not run vulnerability scans/);
});

test("website presents a short copyable agent workflow with accurate boundaries", async () => {
  const site = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  const terms = await readFile(new URL("../site/terms.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../site/app.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../site/styles.css", import.meta.url), "utf8");
  assert.match(site, /One project policy/);
  assert.match(site, /Setup, prompt, verify/);
  assert.match(site, /No vulnerability scan runs automatically/);
  assert.doesNotMatch(site, /github\.com\/ghostbyte1014\/Agent_Docs_Kit/i);
  assert.doesNotMatch(terms, /github\.com\/ghostbyte1014\/Agent_Docs_Kit/i);
  assert.match(site, /Use \$manage-project-quality/);
  assert.match(site, /Copy a prompt to your agent/);
  assert.doesNotMatch(site, /Copy an AI prompt/);
  assert.match(site, /Security prompt types/);
  assert.match(site, /Phase audit, change review, or release gate/);
  assert.match(site, /Engineering prompt types/);
  assert.match(site, /Topic review, diagnosis, or design decision/);
  assert.match(site, /Use any selector from <code>list security<\/code>/);
  assert.match(site, /Use any selector from <code>list engineering<\/code>/);
  assert.match(site, /After you paste the guided prompt/);
  assert.match(site, /The Security and Engineering prompts above can be pasted as-is/);
  assert.match(site, /First show the available security phases with a one-line purpose/);
  assert.match(site, /First show the available engineering topics with a one-line purpose/);
  assert.match(site, /Repeat my choices and wait for confirmation/);
  assert.match(site, /Already know the selector\?/);
  assert.match(site, /Do not run active tests or use credentials without my explicit authorization/);
  assert.match(site, /Separate observed facts from recommendations/);
  assert.match(site, /Step-by-step tutorials/);
  assert.match(site, /A worksheet is a review record, not a completed audit/);
  assert.match(site, /list security/);
  assert.match(site, /security worksheet api-layer/);
  assert.match(site, /list engineering/);
  assert.match(site, /engineering worksheet testing-types/);
  assert.match(site, /Every control starts <code>Unverified<\/code>/);
  assert.match(site, /Every practice starts <code>Unverified<\/code>/);
  assert.match(site, /report validate &lt;worksheet&gt;/);
  assert.match(site, /CODEX\.md/);
  assert.match(site, /CURSOR\.md/);
  assert.match(site, /COPILOT\.md/);
  assert.match(site, /Automatic discovery varies/);
  assert.ok((site.match(/data-copy-visible/g) ?? []).length >= 4);
  assert.match(app, /visibleCopyText/);
  assert.match(app, /textContent\?\.trim/);
  assert.match(app, /aria-live/);
  assert.match(app, /Selected—copy manually/);
  assert.match(styles, /button:focus-visible, a:focus-visible/);
  assert.match(styles, /overflow-x: auto/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(site, /rel="canonical" href="https:\/\/agent-docs-kit\.ghostbyte1014\.workers\.dev\/"/);
  assert.doesNotMatch(site, /git clone https:\/\/github\.com\/ghostbyte1014\/Agent_Docs_Kit\.git/);
  const footer = site.match(/<footer>([\s\S]*?)<\/footer>/)?.[1] ?? "";
  assert.match(footer, />Use</);
  assert.match(footer, /href="#workflow">Workflow/);
  assert.match(footer, /href="#prompts">Agent prompts/);
  assert.match(footer, /href="#tutorials">Tutorials/);
  assert.match(footer, /href="privacy\.html">Privacy/);
  assert.match(footer, /href="terms\.html">Terms/);

  const workflow = site.indexOf('id="workflow"');
  const prompts = site.indexOf('id="prompts"');
  const tutorials = site.indexOf('id="tutorials"');
  const agents = site.indexOf('id="agents"');
  const resources = site.indexOf('id="resources"');
  assert.ok(workflow < prompts && prompts < tutorials && tutorials < agents && agents < resources, "workflow, prompts, tutorials, agents, and references should appear in task order");
});

test("site preview builds first and the artifact exposes only public documentation", async () => {
  const projectRoot = join(import.meta.dirname, "..");
  const metadata = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  assert.match(metadata.scripts["site:preview"], /^npm run build && /);
  execFileSync(process.execPath, ["scripts/build-site.mjs"], { cwd: projectRoot, stdio: "pipe" });
  const builtDocs = (await readdir(join(projectRoot, "build", "site", "docs"))).sort();
  assert.deepEqual(builtDocs, [
    "ARCHITECTURE.html",
    "COMPATIBILITY.html",
    "CONTENT_MAINTENANCE.html",
    "GITHUB_AND_NPM_SETUP.html",
    "PUBLISHING_AND_HOSTING.html",
    "PURPOSE.html",
    "RELEASE_HISTORY.html",
    "RELEASE_PROCESS.html",
    "REVIEW_GUIDE.html",
    "SECURITY_MODEL.html",
    "SECURITY_POLICY.html",
    "TESTING_GUIDE.html",
    "VERSIONING_AND_UPGRADES.html"
  ]);
  await assert.rejects(access(join(projectRoot, "build", "site", "docs", "README.md")));
  // Every local link on a built page must resolve to a file that was published.
  // check-links.mjs validates Markdown against the repository, which cannot see
  // that a root file such as SECURITY.md is absent from the site.
  const siteRoot = join(projectRoot, "build", "site");
  for (const name of builtDocs) {
    const page = await readFile(join(siteRoot, "docs", name), "utf8");
    assert.doesNotMatch(page, /github\.com\/ghostbyte1014\/Agent_Docs_Kit/i, `${name} must not link directly to the source repository`);
    for (const [, target] of page.matchAll(/href="([^"#][^"]*)"/g)) {
      if (/^(?:https?:|mailto:)/i.test(target)) continue;
      await access(join(siteRoot, "docs", target.split("#")[0]));
    }
  }
  const purposePage = await readFile(join(projectRoot, "build", "site", "docs", "PURPOSE.html"), "utf8");
  const securityPage = await readFile(join(projectRoot, "build", "site", "docs", "SECURITY_MODEL.html"), "utf8");
  const testingPage = await readFile(join(projectRoot, "build", "site", "docs", "TESTING_GUIDE.html"), "utf8");
  const securityPolicyPage = await readFile(join(projectRoot, "build", "site", "docs", "SECURITY_POLICY.html"), "utf8");
  assert.match(purposePage, /<h1>Purpose and boundaries<\/h1>/);
  assert.match(purposePage, /href="\.\.\/privacy\.html">Privacy/);
  assert.match(purposePage, /href="\.\.\/terms\.html">Terms of use/);
  assert.doesNotMatch(purposePage, />GitHub and npm setup<\/a>|>Release process<\/a>/);
  assert.match(securityPage, /href="SECURITY_MODEL\.html" class="is-current">Security model/);
  assert.match(testingPage, /<h1>Testing guide<\/h1>/);
  assert.match(testingPage, /rel="canonical" href="https:\/\/agent-docs-kit\.ghostbyte1014\.workers\.dev\/docs\/TESTING_GUIDE\.html"/);
  assert.match(testingPage, /AGENTS\.md/);
  assert.match(testingPage, /suggest reviews --staged/);
  assert.match(testingPage, /byte-for-byte unchanged/);
  assert.match(testingPage, /href="https:\/\/agent-docs-kit\.ghostbyte1014\.workers\.dev\/docs\/SECURITY_POLICY\.html"/);
  assert.doesNotMatch(testingPage, /github\.com\/ghostbyte1014\/Agent_Docs_Kit/i);
  assert.match(securityPolicyPage, /<h1>Security policy<\/h1>/);
  assert.match(securityPolicyPage, /href="SECURITY_POLICY\.html" class="is-current">Security policy/);
  // The guide documents ordinary verification, not a time-boxed beta programme.
  assert.doesNotMatch(testingPage, /[Cc]losed-beta/);
  const privacyPage = await readFile(join(projectRoot, "build", "site", "privacy.html"), "utf8");
  const termsPage = await readFile(join(projectRoot, "build", "site", "terms.html"), "utf8");
  assert.doesNotMatch(privacyPage, /agent-docs-command-mode|localStorage/i);
  assert.match(privacyPage, /does not include.*browser storage/);
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
    "[External Markdown](https://example.com/SECURITY.md)",
    "[Unsafe](javascript:alert(1))"
  ].join("\n"));
  assert.match(html, /<h1>&lt;unsafe&gt;<\/h1>/);
  assert.match(html, /href="ARCHITECTURE\.html#components"/);
  assert.match(html, /href="https:\/\/example\.com\/docs\?a=1&amp;b=2" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /href="https:\/\/example\.com\/SECURITY\.md" target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /https:\/\/example\.com\/SECURITY\.html/);
  assert.doesNotMatch(html, /javascript:/i);
});
