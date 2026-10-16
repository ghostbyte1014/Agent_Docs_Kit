// Tests for the 6.2.0 scope: one shared starter-text detector, configurable
// generated-policy defaults, agent pointer files, per-agent skill targets,
// the skill version marker, and the documented exit codes.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupProject } from "../src/commands/setup.mjs";
import { auditDocumentation } from "../src/commands/audit.mjs";
import { installSkill, projectSkillTargets, skillTargets } from "../src/commands/skill.mjs";
import { nextWorkflow } from "../src/commands/workflow.mjs";
import { helpText } from "../src/cli/help.mjs";
import { containsStarterText, starterTextSignal } from "../src/core/starter-text.mjs";
import { importsCanonicalInstructions } from "../src/core/agents.mjs";
import { kitVersion, skillVersionFile } from "../src/core/version.mjs";
import { loadProjectConfig } from "../src/core/config.mjs";

const cli = join(import.meta.dirname, "..", "bin", "agent-docs.mjs");

function runCli(arguments_, options = {}) {
  return spawnSync(process.execPath, [cli, ...arguments_], { encoding: "utf8", ...options });
}

async function scratch() {
  return mkdtemp(join(tmpdir(), "agent-docs-kit-6.2-"));
}

// Replaces the generated starter prompts with content a reviewer would write.
async function completeStarterDocuments(root) {
  for (const [path, heading, body] of [
    ["docs/01-system/overview.md", "# System overview", "Verified boundary, users, dependencies, and authoritative sources."],
    ["docs/02-project/README.md", "# Project", "Verified requirements, decisions, milestones, and delivery status."],
    ["docs/05-operations/README.md", "# Operations", "Verified setup, deployment, observability, and recovery procedure."]
  ]) {
    await writeFile(join(root, path), [heading, "", body, ""].join("\n"), "utf8");
  }
}

async function snapshot(directory, prefix = "") {
  const entries = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${item.name}` : item.name;
    const path = join(directory, item.name);
    if (item.isDirectory()) Object.assign(entries, await snapshot(path, name));
    else if (item.isFile()) entries[name] = (await readFile(path)).toString("base64");
  }
  return entries;
}

test("a fresh scaffold fails the strict audit and passes once starter text is replaced", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root });

    const untouched = runCli(["audit", "documentation", "--strict", "--cwd", root]);
    assert.equal(untouched.status, 1, "an untouched scaffold must fail --strict");
    assert.match(untouched.stdout, /FAIL starter-text/);
    // Every starter document is named, not just the first one.
    for (const path of ["01-system", "02-project", "05-operations"]) {
      assert.ok(untouched.stdout.includes(path), `the failure should name docs/${path}`);
    }

    await completeStarterDocuments(root);
    const completed = runCli(["audit", "documentation", "--strict", "--cwd", root]);
    assert.equal(completed.status, 0, "a reviewed scaffold must pass --strict");
    assert.doesNotMatch(completed.stdout, /starter-text/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("audit and next read one shared starter-text detector", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root });

    const auditStarters = (await auditDocumentation({ cwd: root, format: "json" })).checks
      .filter((check) => check.rule === "starter-text")
      .map((check) => check.path.replaceAll("\\", "/"))
      .sort();
    const nextResult = await nextWorkflow({ cwd: root });
    assert.equal(nextResult.stage, 3);
    const nextStarters = nextResult.detected
      .find((line) => line.startsWith("Starter documents needing work:"))
      .replace("Starter documents needing work: ", "")
      .split(", ")
      .map((path) => path.replaceAll("\\", "/"))
      .sort();
    assert.deepEqual(auditStarters, nextStarters, "both commands must flag the same documents");

    // Deleting the marker without replacing the text must not clear the check:
    // the shared detector still recognizes the untouched prose.
    const overview = join(root, "docs", "01-system", "overview.md");
    const stripped = (await readFile(overview, "utf8")).split("\n").filter((line) => !line.includes("agent-docs:starter")).join("\n");
    await writeFile(overview, stripped, "utf8");
    const overviewPath = "docs/01-system/overview.md";
    assert.ok(containsStarterText(stripped, { path: overviewPath }), "untouched prose in an owned starter document is still starter text");
    assert.equal(starterTextSignal(stripped, { path: overviewPath }).kind, "phrase");
    // The same prose outside the owned set carries no signal, so legitimate
    // content and archived material are not flagged.
    assert.equal(starterTextSignal(stripped, { path: "docs/01-system/caching.md" }), null);
    assert.equal(starterTextSignal(stripped), null, "without a path only the marker is authoritative");
    const stillFailing = await auditDocumentation({ cwd: root, format: "json" });
    assert.ok(stillFailing.checks.some((check) => check.rule === "starter-text" && check.path.includes("overview.md")));
    assert.equal((await nextWorkflow({ cwd: root })).stage, 3);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("the prose fallback applies only to the documents setup owns", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root });
    await completeStarterDocuments(root);

    // "Status: Needs update" is one of the statuses the generated docs/README.md
    // tells users to apply, so it must not be read as unreplaced scaffold.
    await writeFile(join(root, "docs", "01-system", "caching.md"), [
      "# Caching design", "", "Status: Needs update", "",
      "Describes the real cache layer; it lags the current code.", ""
    ].join("\n"), "utf8");

    // Archived material keeps superseded wording, and the generated policy says
    // not to audit against docs/archive/. It is also immutable by that policy,
    // so flagging it would make a passing audit unreachable.
    await writeFile(join(root, "docs", "archive", "2025-old-design.md"), [
      "# Superseded design", "", "Status: Needs update", "",
      "Describe the system boundary, users, dependencies, and authoritative sources.", ""
    ].join("\n"), "utf8");

    const audit = runCli(["audit", "documentation", "--strict", "--cwd", root]);
    assert.equal(audit.status, 0, audit.stdout);
    assert.doesNotMatch(audit.stdout, /starter-text/);
    assert.equal((await nextWorkflow({ cwd: root })).stage, 4, "next must agree that no starter document is outstanding");

    // The same prose in an owned starter document is still caught.
    await writeFile(join(root, "docs", "01-system", "overview.md"), [
      "# System overview", "", "Status: Needs update", ""
    ].join("\n"), "utf8");
    assert.equal(runCli(["audit", "documentation", "--strict", "--cwd", root]).status, 1);
    assert.equal((await nextWorkflow({ cwd: root })).stage, 3);

    // A marker is authoritative wherever it appears, including outside the
    // owned set, so a copied starter template is still detected.
    await completeStarterDocuments(root);
    await writeFile(join(root, "docs", "01-system", "copied.md"), [
      "# Copied template", "", "<!-- agent-docs:starter: fill this in -->", ""
    ].join("\n"), "utf8");
    const marked = runCli(["audit", "documentation", "--strict", "--cwd", root]);
    assert.equal(marked.status, 1);
    assert.match(marked.stdout, /starter-text docs\/01-system\/copied\.md/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("report paths use forward slashes on every platform", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root, agents: "claude" });
    const audit = await auditDocumentation({ cwd: root, format: "json" });
    assert.ok(audit.checks.length > 5);
    for (const check of audit.checks) {
      assert.ok(!check.path.includes("\\"), `report path must not contain a backslash: ${check.path}`);
    }
    // The same file must be reported under one spelling by every rule.
    const required = audit.checks.find((check) => check.rule === "required-document" && check.path.endsWith("01-system/overview.md"));
    const starter = audit.checks.find((check) => check.rule === "starter-text" && check.path.endsWith("01-system/overview.md"));
    assert.ok(required && starter);
    assert.equal(required.path, starter.path);
    for (const item of audit.skill.installed) assert.ok(!item.path.includes("\\"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("an explicit --agents value replaces the stored list and persists without --force", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root, agents: "claude,gemini" });
    assert.deepEqual((await loadProjectConfig(root)).config.agents, ["claude", "gemini"]);

    // Hand-edited keys must survive a profile change.
    const configPath = join(root, ".agent-docs", "config.json");
    const edited = { ...JSON.parse(await readFile(configPath, "utf8")), maxAgeDays: 42, requireMetadata: true };
    await writeFile(configPath, `${JSON.stringify(edited, null, 2)}\n`, "utf8");

    // '--agents none' previously parsed, exited 0, and changed nothing.
    const cleared = runCli(["setup", "--agents", "none", "--cwd", root]);
    assert.equal(cleared.status, 0, cleared.stderr);
    assert.match(cleared.stdout, /Updated \.agent-docs\/config\.json: agents/);
    assert.match(cleared.stdout, /Claude Code: no longer tracked/);
    const after = (await loadProjectConfig(root)).config;
    assert.deepEqual(after.agents, []);
    assert.equal(after.maxAgeDays, 42, "an unrelated hand-edited key must be preserved");
    assert.equal(after.requireMetadata, true);

    // Untracked pointer files are kept on disk, just no longer checked.
    await access(join(root, "CLAUDE.md"));
    await access(join(root, "GEMINI.md"));
    const audit = await auditDocumentation({ cwd: root, format: "json" });
    assert.ok(!audit.checks.some((check) => check.rule === "agent-pointer"));

    // An explicit list is authoritative, not additive.
    await setupProject({ cwd: root, agents: "gemini" });
    assert.deepEqual((await loadProjectConfig(root)).config.agents, ["gemini"]);

    // --timezone persists on an initialized project too, without --force.
    await setupProject({ cwd: root, timezone: "Asia/Tokyo" });
    assert.equal((await loadProjectConfig(root)).config.timezone, "Asia/Tokyo");
    assert.equal((await loadProjectConfig(root)).config.maxAgeDays, 42);

    // A run with no profile flag must leave the configuration alone.
    const untouched = await readFile(configPath, "utf8");
    await setupProject({ cwd: root });
    assert.equal(await readFile(configPath, "utf8"), untouched);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("a profile change is previewed by --dry-run and writes nothing", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root, agents: "claude" });
    const configPath = join(root, ".agent-docs", "config.json");
    const before = await readFile(configPath, "utf8");
    const preview = await setupProject({ cwd: root, agents: "none", timezone: "local", dryRun: true });
    assert.equal(preview.configUpdate?.status, "planned");
    assert.deepEqual(preview.configUpdate.changed.sort(), ["agents", "timezone"]);
    assert.equal(await readFile(configPath, "utf8"), before, "a preview must not change the configuration");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("a marker inside a fenced code block is not treated as starter text", () => {
  const documented = ["# Guide", "", "Add the marker like this:", "", "```markdown", "<!-- agent-docs:starter: example -->", "```", ""].join("\n");
  assert.equal(starterTextSignal(documented), null);
});

test("generated agent instructions carry no author-specific defaults", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root });
    const policy = await readFile(join(root, "AGENTS.md"), "utf8");
    assert.doesNotMatch(policy, /Philippine time/);
    assert.doesNotMatch(policy, /Created by/);
    assert.doesNotMatch(policy, /UTC\+8/);
    assert.match(policy, /24-hour time in UTC/);
    const records = await readFile(join(root, "docs", "05-operations", "agents", "feature-updates", "README.md"), "utf8");
    assert.doesNotMatch(records, /Philippine time/);
    assert.match(records, /24-hour time in UTC/);
    const { config } = await loadProjectConfig(root);
    assert.equal(config.timezone, "UTC");
    assert.equal(config.attribution, "");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("timezone and attribution are configurable and inherited on a rerun", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root, timezone: "Europe/Berlin", attribution: "Platform Team" });
    const policy = await readFile(join(root, "AGENTS.md"), "utf8");
    assert.match(policy, /24-hour time in Europe\/Berlin/);
    assert.match(policy, /> Created by Platform Team/);
    assert.match(policy, /TZ=Europe\/Berlin date/);

    // A later setup with no flags must not reset the stored profile.
    const rerun = await setupProject({ cwd: root, force: true });
    assert.equal(rerun.profile.timezone, "Europe/Berlin");
    assert.equal(rerun.profile.attribution, "Platform Team");
    const { config } = await loadProjectConfig(root);
    assert.equal(config.timezone, "Europe/Berlin");

    assert.equal(runCli(["setup", "--timezone", "Mars/Olympus", "--cwd", root]).status, 1);
    assert.match(runCli(["setup", "--timezone", "Mars/Olympus", "--cwd", root]).stderr, /IANA time-zone name/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("setup --agents creates pointer files that import the canonical policy", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root, agents: "claude,gemini" });
    for (const name of ["CLAUDE.md", "GEMINI.md"]) {
      const pointer = await readFile(join(root, name), "utf8");
      assert.ok(importsCanonicalInstructions(pointer), `${name} must import AGENTS.md`);
      assert.match(pointer, /^@AGENTS\.md/);
      // The policy is imported, never copied.
      assert.ok(pointer.length < 400, `${name} must stay a thin pointer, not a copy`);
      assert.doesNotMatch(pointer, /CHANGE RECORDS/);
    }
    const { config } = await loadProjectConfig(root);
    assert.deepEqual(config.agents, ["claude", "gemini"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("setup --agents auto creates pointers only for tools already in use", async () => {
  const root = await scratch();
  try {
    await mkdir(join(root, ".claude"), { recursive: true });
    await setupProject({ cwd: root, agents: "auto" });
    await access(join(root, "CLAUDE.md"));
    await assert.rejects(access(join(root, "GEMINI.md")), "Gemini shows no signs of use here");
    assert.deepEqual((await loadProjectConfig(root)).config.agents, ["claude"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("an existing agent instruction file is never replaced, with or without --force", async () => {
  const root = await scratch();
  try {
    const original = "# My own Claude rules\n\nProject-specific policy.\n";
    await writeFile(join(root, "CLAUDE.md"), original, "utf8");
    await writeFile(join(root, "AGENTS.md"), "# Existing project policy\n", "utf8");

    for (const force of [false, true]) {
      const result = await setupProject({ cwd: root, agents: "claude", force });
      assert.equal(await readFile(join(root, "CLAUDE.md"), "utf8"), original, `--force=${force} must not rewrite CLAUDE.md`);
      assert.equal(await readFile(join(root, "AGENTS.md"), "utf8"), "# Existing project policy\n");
      const pointer = result.pointers.find((item) => item.agent === "claude");
      assert.equal(pointer.status, "skipped");
      assert.equal(pointer.imports, false, "the CLI must notice the missing import");
    }

    // The operator is told the exact single line to add.
    const output = runCli(["setup", "--agents", "claude", "--cwd", root]);
    assert.match(output.stdout, /does not import AGENTS\.md/);
    assert.match(output.stdout, /Add this single line near the top of CLAUDE\.md:\s+@AGENTS\.md/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("the drift check flags a pointer file that does not import the policy", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root, agents: "claude" });
    await completeStarterDocuments(root);
    assert.equal(runCli(["audit", "documentation", "--strict", "--cwd", root]).status, 0);

    await writeFile(join(root, "CLAUDE.md"), "# Local rules only\n", "utf8");
    const drifted = runCli(["audit", "documentation", "--strict", "--cwd", root]);
    assert.equal(drifted.status, 1);
    assert.match(drifted.stdout, /FAIL agent-pointer CLAUDE\.md/);
    assert.match(drifted.stdout, /@AGENTS\.md/);

    // A missing pointer file is reported too, naming the fix.
    await rm(join(root, "CLAUDE.md"));
    const missing = runCli(["audit", "documentation", "--cwd", root]);
    assert.match(missing.stdout, /FAIL agent-pointer CLAUDE\.md/);
    assert.match(missing.stdout, /setup --agents claude/);

    await writeFile(join(root, "CLAUDE.md"), "@AGENTS.md\n\n# Local notes\n", "utf8");
    assert.equal(runCli(["audit", "documentation", "--strict", "--cwd", root]).status, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("setup --dry-run --ai lists every planned path and writes nothing", async () => {
  const root = await scratch();
  try {
    const preview = await setupProject({ cwd: root, ai: true, dryRun: true });
    assert.ok(preview.every((item) => item.status === "planned"));
    const planned = preview.map((item) => item.path.replaceAll("\\", "/"));
    for (const name of ["AGENTS.md", "CLAUDE.md", "GEMINI.md", ".agent-docs/config.json", "docs/README.md"]) {
      assert.ok(planned.some((path) => path.endsWith(name)), `${name} must appear in the preview`);
    }
    assert.deepEqual(await readdir(root), [], "a preview must not create anything");

    const output = runCli(["setup", "--dry-run", "--ai", "--cwd", root]);
    assert.equal(output.status, 0);
    assert.match(output.stdout, /Planned project skill targets: project, claude/);
    assert.match(output.stdout, /Nothing is written outside it/);
    assert.deepEqual(await readdir(root), []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("setup --ai initializes documentation, agent files, and the skill in one run", async () => {
  const root = await scratch();
  const home = await scratch();
  try {
    const result = runCli(["setup", "--ai", "--cwd", root], { env: { ...process.env, HOME: home, USERPROFILE: home } });
    assert.equal(result.status, 0, result.stderr);
    for (const required of [
      "AGENTS.md",
      "CLAUDE.md",
      "GEMINI.md",
      ".agent-docs/config.json",
      "docs/README.md",
      ".agents/skills/manage-project-quality/SKILL.md",
      ".claude/skills/manage-project-quality/SKILL.md"
    ]) await access(join(root, required));

    // Writes stay inside the project: nothing lands in the user's home.
    assert.deepEqual(await readdir(home), [], "setup --ai must not write outside the project");

    const first = await snapshot(root);
    const repeat = runCli(["setup", "--ai", "--cwd", root], { env: { ...process.env, HOME: home, USERPROFILE: home } });
    assert.equal(repeat.status, 0);
    assert.deepEqual(await snapshot(root), first, "a second run must change nothing");
    assert.deepEqual(await readdir(home), []);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(home, { recursive: true, force: true });
  }
});

test("setup --ai leaves unrelated repository skills untouched", async () => {
  const root = await scratch();
  try {
    await mkdir(join(root, ".agents", "skills", "existing-skill"), { recursive: true });
    await writeFile(join(root, ".agents", "skills", "existing-skill", "SKILL.md"), "# Existing skill\n", "utf8");
    await setupProject({ cwd: root, ai: true });
    assert.equal(await readFile(join(root, ".agents", "skills", "existing-skill", "SKILL.md"), "utf8"), "# Existing skill\n");
    await access(join(root, ".agents", "skills", "manage-project-quality", "SKILL.md"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("a failed skill step exits nonzero, keeps the documentation, and a rerun completes it", async () => {
  const root = await scratch();
  try {
    // A regular file where the skill directory belongs makes the copy fail.
    await writeFile(join(root, ".agents"), "not a directory\n", "utf8");
    const failed = runCli(["setup", "--ai", "--cwd", root]);
    assert.equal(failed.status, 1, "a partial failure must exit nonzero");
    assert.match(failed.stdout, /Incomplete:/);
    assert.match(failed.stdout, /skill install --target project failed/);
    assert.match(failed.stdout, /Rerun the same command to finish/);

    // The documentation that was written before the failure survives.
    await access(join(root, "docs", "README.md"));
    await access(join(root, "AGENTS.md"));
    await access(join(root, ".agent-docs", "config.json"));

    await rm(join(root, ".agents"));
    const rerun = runCli(["setup", "--ai", "--cwd", root]);
    assert.equal(rerun.status, 0, rerun.stdout);
    await access(join(root, ".agents", "skills", "manage-project-quality", "SKILL.md"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("an installed skill records the CLI version and a mismatch is reported, not failed", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root, ai: true });
    await completeStarterDocuments(root);
    const version = await kitVersion();
    const marker = join(root, ".agents", "skills", "manage-project-quality", skillVersionFile);
    assert.equal(JSON.parse(await readFile(marker, "utf8")).kitVersion, version);

    // A stale copy is named, with the exact refresh command.
    await writeFile(marker, `${JSON.stringify({ kitVersion: "5.1.0", source: "@ghostbyte/agent-docs-kit" })}\n`, "utf8");
    const stale = runCli(["next", "--cwd", root]);
    assert.match(stale.stdout, /records version 5\.1\.0/);
    assert.match(stale.stdout, /skill install --target project --force/);
    const staleAudit = runCli(["audit", "documentation", "--strict", "--cwd", root]);
    assert.equal(staleAudit.status, 0, "a stale skill is reported, never failed");
    assert.match(staleAudit.stdout, /records version 5\.1\.0/);

    await installSkill("project", { cwd: root, force: true, quiet: true });
    assert.equal(JSON.parse(await readFile(marker, "utf8")).kitVersion, version);
    assert.doesNotMatch(runCli(["next", "--cwd", root]).stdout, /records version/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("skill targets are project-scoped except the explicit user-level codex target", async () => {
  const root = await scratch();
  const home = await scratch();
  try {
    assert.deepEqual(skillTargets, ["project", "claude", "codex"]);
    assert.deepEqual(projectSkillTargets(["claude", "gemini"]), ["project", "claude"]);
    assert.ok(!projectSkillTargets(["claude", "gemini"]).includes("codex"), "--ai must never write outside the project");

    await setupProject({ cwd: root });
    await installSkill("claude", { cwd: root, quiet: true, env: undefined });
    await access(join(root, ".claude", "skills", "manage-project-quality", "SKILL.md"));
    assert.deepEqual(await readdir(home), []);

    assert.equal(runCli(["skill", "install", "--target", "cursor", "--cwd", root]).status, 1);
    assert.match(runCli(["skill", "install", "--target", "cursor", "--cwd", root]).stderr, /Use project, claude, codex/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(home, { recursive: true, force: true });
  }
});

test("doctor reports CLI, config, and skill version drift without changing the exit code", async () => {
  const root = await scratch();
  try {
    // Outside a project there is nothing to compare.
    const bare = runCli(["doctor", "--cwd", root]);
    assert.equal(bare.status, 0);
    assert.match(bare.stdout, /PASS Node\.js >=22/);
    assert.match(bare.stdout, new RegExp(`CLI version: ${await kitVersion()}`));
    assert.match(bare.stdout, /no \.agent-docs\/config\.json/);

    await setupProject({ cwd: root, ai: true });
    const current = runCli(["doctor", "--cwd", root]);
    assert.equal(current.status, 0);
    assert.match(current.stdout, /Config schemaVersion: 2/);
    assert.match(current.stdout, /\(current\)/);
    assert.doesNotMatch(current.stdout, /Refresh the stale skill copies/);

    const marker = join(root, ".agents", "skills", "manage-project-quality", skillVersionFile);
    await writeFile(marker, `${JSON.stringify({ kitVersion: "5.1.0" })}\n`, "utf8");
    const drifted = runCli(["doctor", "--cwd", root]);
    assert.equal(drifted.status, 0, "a version mismatch must not change the exit code");
    assert.match(drifted.stdout, /Installed skill .+manage-project-quality: 5\.1\.0/);
    assert.match(drifted.stdout, /skill install --target project --force/);

    // A prerequisite failure is what sets a nonzero exit code, not drift.
    assert.equal(runCli(["doctor", "unexpected"]).status, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("help documents the new options without dropping the documented strings", () => {
  assert.match(helpText, /--ai\s+Set up docs, agent files, and the project skill together/);
  assert.match(helpText, /--agents <list>/);
  assert.match(helpText, /--timezone <zone>/);
  assert.match(helpText, /--attribution <text>/);
  assert.match(helpText, /setup \[--dry-run\] \[--ai\]/);
  assert.match(helpText, /skill install --target project\|claude\|codex/);
  assert.match(helpText, /@AGENTS\.md/);
  // Strings the existing public contract depends on.
  assert.match(helpText, /Initialize documentation with 'setup'/);
  assert.match(helpText, /does not run vulnerability scans/);
  assert.match(helpText, /protected agent policy/);
  assert.match(helpText, /Documentation checks are automated/);
});

test("a configuration written before 6.2.0 keeps working with documented defaults", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root });
    // Exactly the keys a 6.0.0/6.1.0 setup wrote: no timezone, attribution, or agents.
    await writeFile(join(root, ".agent-docs", "config.json"), `${JSON.stringify({
      schemaVersion: 2,
      documentationRoot: "docs",
      documentationReports: "docs/03-development/audits",
      securityReports: "docs/04-testing/security-audits",
      engineeringReports: "docs/03-development/engineering-reviews",
      templateOutput: "docs",
      interactionStyle: "standard",
      maxAgeDays: 180,
      requireMetadata: false,
      requiredDocuments: ["docs/README.md", "docs/01-system/overview.md", "docs/02-project/README.md", "docs/05-operations/README.md"]
    }, null, 2)}\n`, "utf8");

    const { config } = await loadProjectConfig(root);
    assert.equal(config.timezone, "UTC");
    assert.equal(config.attribution, "");
    assert.deepEqual(config.agents, []);
    // No migration step, and no pointer-file check for a project that never asked for one.
    const audit = await auditDocumentation({ cwd: root, format: "json" });
    assert.ok(!audit.checks.some((check) => check.rule === "agent-pointer"));
    assert.equal((await nextWorkflow({ cwd: root })).stage, 3);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("an unreadable or future configuration fails with a clear message, not a stack trace", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root });
    const configPath = join(root, ".agent-docs", "config.json");
    const original = JSON.parse(await readFile(configPath, "utf8"));

    await writeFile(configPath, `${JSON.stringify({ ...original, schemaVersion: 99 }, null, 2)}\n`, "utf8");
    const future = runCli(["next", "--cwd", root]);
    assert.equal(future.status, 1);
    assert.match(future.stderr, /Unsupported agent-docs configuration schemaVersion '99'/);
    assert.match(future.stderr, /reads schemaVersion 1 and 2/);
    assert.doesNotMatch(future.stderr, /at Object\./, "no stack trace");

    await writeFile(configPath, `${JSON.stringify({ ...original, agents: ["cursor"] }, null, 2)}\n`, "utf8");
    assert.match(runCli(["next", "--cwd", root]).stderr, /Unknown agent 'cursor'/);

    await writeFile(configPath, `${JSON.stringify({ ...original, timezone: "Mars/Olympus" }, null, 2)}\n`, "utf8");
    assert.match(runCli(["next", "--cwd", root]).stderr, /timezone must be 'UTC', 'local', or an IANA/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("the documented exit codes hold", async () => {
  const root = await scratch();
  try {
    // 1: unknown subcommand and unknown option.
    assert.equal(runCli(["nonsense"]).status, 1);
    assert.equal(runCli(["setup", "--nonsense"]).status, 1);
    // 1: a worksheet before setup.
    const early = runCli(["security", "worksheet", "api-layer", "--cwd", root]);
    assert.equal(early.status, 1);
    assert.match(early.stderr, /Initialize documentation before creating a security worksheet/);

    await setupProject({ cwd: root });
    // 0: audit without --strict, even though checks fail.
    const lenient = runCli(["audit", "documentation", "--cwd", root]);
    assert.equal(lenient.status, 0, "audit without --strict must exit 0 even on failure");
    assert.match(lenient.stdout, /Result: FAIL/);
    // 1: the same run with --strict.
    assert.equal(runCli(["audit", "documentation", "--strict", "--cwd", root]).status, 1);
    // 0: read-only commands.
    assert.equal(runCli(["next", "--cwd", root]).status, 0);
    assert.equal(runCli(["--version"]).status, 0);
    assert.equal(runCli(["setup", "--dry-run", "--cwd", root]).status, 0);

    await completeStarterDocuments(root);
    assert.equal(runCli(["audit", "documentation", "--strict", "--cwd", root]).status, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("a configuration path that escapes the project is rejected", async () => {
  const root = await scratch();
  try {
    await setupProject({ cwd: root });
    const configPath = join(root, ".agent-docs", "config.json");
    const original = JSON.parse(await readFile(configPath, "utf8"));
    await writeFile(configPath, `${JSON.stringify({ ...original, documentationRoot: "../outside" }, null, 2)}\n`, "utf8");
    const escaped = runCli(["audit", "documentation", "--cwd", root]);
    assert.equal(escaped.status, 1);
    assert.match(escaped.stderr, /must stay inside the target project/);
    await assert.rejects(stat(join(root, "..", "outside")));
  } finally { await rm(root, { recursive: true, force: true }); }
});
