// Old-version compatibility (plan section 6.8.3).
//
// Each fixture under tests/fixtures/compat is the real output of a released
// version. The fixtures are read-only: every test copies one to a temporary
// directory first, so a run can never mutate the committed evidence.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditDocumentation } from "../src/commands/audit.mjs";
import { nextWorkflow } from "../src/commands/workflow.mjs";
import { loadProjectConfig } from "../src/core/config.mjs";

const cli = join(import.meta.dirname, "..", "bin", "agent-docs.mjs");
const fixtureRoot = join(import.meta.dirname, "fixtures", "compat");
const runCli = (arguments_) => spawnSync(process.execPath, [cli, ...arguments_], { encoding: "utf8" });

// Expected results per fixture, written down rather than inferred.
const expectations = [
  { version: "5.1.0", stage: 3, strictExit: 1, starterFindings: 3, hasAgentsFile: false },
  { version: "6.0.0", stage: 3, strictExit: 1, starterFindings: 3, hasAgentsFile: true },
  { version: "6.1.0", stage: 3, strictExit: 1, starterFindings: 3, hasAgentsFile: true }
];

async function workingCopy(version) {
  const root = await mkdtemp(join(tmpdir(), `agent-docs-kit-compat-${version}-`));
  await cp(join(fixtureRoot, version), root, { recursive: true });
  return root;
}

test("every expected fixture is present", async () => {
  const present = (await readdir(fixtureRoot, { withFileTypes: true }))
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .sort();
  assert.deepEqual(present, expectations.map((item) => item.version));
});

for (const expectation of expectations) {
  test(`a ${expectation.version} project still works with the current CLI`, async () => {
    const root = await workingCopy(expectation.version);
    try {
      // The fixture reflects what that version actually shipped.
      const files = await readdir(root);
      assert.equal(files.includes("AGENTS.md"), expectation.hasAgentsFile, `AGENTS.md presence for ${expectation.version}`);

      // Its configuration loads with no migration step and gets the new defaults.
      const { config } = await loadProjectConfig(root);
      assert.equal(config.schemaVersion, 2);
      assert.equal(config.timezone, "UTC", "a config without the key gets the documented default");
      assert.equal(config.attribution, "");
      assert.deepEqual(config.agents, []);
      const stored = JSON.parse(await readFile(join(root, ".agent-docs", "config.json"), "utf8"));
      for (const key of ["timezone", "attribution", "agents"]) {
        assert.ok(!(key in stored), `the fixture must predate '${key}'`);
      }

      // next reports the documented stage.
      const next = await nextWorkflow({ cwd: root });
      assert.equal(next.stage, expectation.stage);

      // The strict audit exits as documented and never crashes.
      const strict = runCli(["audit", "documentation", "--strict", "--cwd", root]);
      assert.equal(strict.status, expectation.strictExit, strict.stderr);
      assert.match(strict.stdout, /Result:/);
      assert.equal(strict.stderr, "", "no crash output");

      // Without --strict the same run exits 0, per the exit-code contract.
      assert.equal(runCli(["audit", "documentation", "--cwd", root]).status, 0);

      const audit = await auditDocumentation({ cwd: root, format: "json" });
      assert.equal(audit.checks.filter((check) => check.rule === "starter-text").length, expectation.starterFindings);
      // A project that never configured an agent gets no pointer check.
      assert.ok(!audit.checks.some((check) => check.rule === "agent-pointer"));
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  test(`${expectation.version} saved reports and worksheets remain readable`, async () => {
    const root = await workingCopy(expectation.version);
    try {
      const reports = await readdir(join(root, "docs", "03-development", "audits"));
      // One report in each supported format, exactly as that version wrote them.
      for (const extension of ["json", "md", "txt"]) {
        assert.ok(reports.some((name) => name.endsWith(`.${extension}`)), `a .${extension} report from ${expectation.version}`);
      }
      const legacyJson = JSON.parse(await readFile(join(root, "docs", "03-development", "audits", reports.find((name) => name.endsWith(".json"))), "utf8"));
      assert.equal(typeof legacyJson.pass, "boolean");
      assert.ok(Array.isArray(legacyJson.checks));

      // The worksheets that version generated are still recognized as open,
      // so a stale pass can never be inherited from an older release.
      const next = await nextWorkflow({ cwd: root });
      assert.ok(next.stage <= 5, `an open worksheet must not advance past stage 5 (got ${next.stage})`);

      // Its own saved passing report is not trusted over the current rules.
      await rm(join(root, "docs", "04-testing", "security-audits"), { recursive: true, force: true });
      await rm(join(root, "docs", "03-development", "engineering-reviews"), { recursive: true, force: true });
      assert.equal((await nextWorkflow({ cwd: root })).stage, 3, "starter text still blocks progress despite a saved pass");
    } finally { await rm(root, { recursive: true, force: true }); }
  });
}

test("an ambiguous legacy text report is ignored rather than promoted to a pass", async () => {
  const root = await workingCopy("5.1.0");
  try {
    const audits = join(root, "docs", "03-development", "audits");
    for (const name of await readdir(audits)) await rm(join(audits, name));
    // A text report whose result cannot be determined must never count as a pass.
    await writeFile(join(audits, "2026-10-16-documentation.txt"), "Some unrelated notes about documentation.\n", "utf8");
    const next = await nextWorkflow({ cwd: root });
    assert.ok(next.stage <= 4, `an unrecognized report must not advance the workflow (got ${next.stage})`);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("fixtures stay untouched by a test run", async () => {
  // Guards against a future test that forgets to copy before running the CLI.
  const before = await readdir(join(fixtureRoot, "5.1.0"));
  runCli(["next", "--cwd", join(fixtureRoot, "5.1.0")]);
  assert.deepEqual(await readdir(join(fixtureRoot, "5.1.0")), before);
});
