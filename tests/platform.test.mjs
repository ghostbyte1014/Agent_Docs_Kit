// Platform and odd-input regression tests (plan section 6.8.7).
//
// These cases were verified to work before 6.2.0; the tests exist so a future
// change cannot break them silently. CI runs this suite on Linux, Windows, and
// macOS, so the path and line-ending cases are covered on all three.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupProject } from "../src/commands/setup.mjs";
import { auditDocumentation } from "../src/commands/audit.mjs";
import { nextWorkflow } from "../src/commands/workflow.mjs";
import { containsStarterText } from "../src/core/starter-text.mjs";
import { importsCanonicalInstructions } from "../src/core/agents.mjs";

const cli = join(import.meta.dirname, "..", "bin", "agent-docs.mjs");
const runCli = (arguments_) => spawnSync(process.execPath, [cli, ...arguments_], { encoding: "utf8" });

const CRLF = "\r\n";

async function completeStarterDocuments(root, lineEnding = "\n") {
  for (const [path, heading, body] of [
    ["docs/01-system/overview.md", "# System overview", "Verified boundary, users, and dependencies."],
    ["docs/02-project/README.md", "# Project", "Verified requirements and delivery status."],
    ["docs/05-operations/README.md", "# Operations", "Verified setup, deployment, and recovery procedure."]
  ]) {
    await writeFile(join(root, path), [heading, "", body, ""].join(lineEnding), "utf8");
  }
}

test("setup, audit, and next work in a path containing spaces and non-ASCII characters", async () => {
  const parent = await mkdtemp(join(tmpdir(), "agent-docs-kit-paths-"));
  const root = join(parent, "proj with spaces é ü 日本");
  try {
    await mkdir(root, { recursive: true });
    const setup = runCli(["setup", "--ai", "--cwd", root]);
    assert.equal(setup.status, 0, setup.stderr);

    assert.equal(runCli(["audit", "documentation", "--strict", "--cwd", root]).status, 1, "starter text still present");
    assert.equal((await nextWorkflow({ cwd: root })).stage, 3);

    await completeStarterDocuments(root);
    const audit = runCli(["audit", "documentation", "--strict", "--report", "--format", "markdown", "--cwd", root]);
    assert.equal(audit.status, 0, audit.stdout);
    // A passing audit with no worksheets is stage 5: reviews are optional.
    assert.equal((await nextWorkflow({ cwd: root })).stage, 5);

    // A worksheet lands in the same awkward path without error.
    assert.equal(runCli(["security", "worksheet", "api-layer", "--cwd", root]).status, 0);
    assert.equal(runCli(["template", "create", "adr", "--name", "cache-policy", "--cwd", root]).status, 0);
  } finally { await rm(parent, { recursive: true, force: true }); }
});

test("every audit rule handles CRLF line endings", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-crlf-"));
  try {
    await setupProject({ cwd: root, agents: "claude" });

    // Convert every generated document, and the pointer file, to CRLF.
    const convert = async (path) => {
      const value = await readFile(path, "utf8");
      await writeFile(path, value.split(/\r?\n/).join(CRLF), "utf8");
    };
    const walk = async (directory) => {
      for (const item of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, item.name);
        if (item.isDirectory()) await walk(path);
        else if (item.name.endsWith(".md")) await convert(path);
      }
    };
    await walk(join(root, "docs"));
    await convert(join(root, "CLAUDE.md"));

    // Starter text is still detected through CRLF.
    assert.ok(containsStarterText(await readFile(join(root, "docs", "01-system", "overview.md"), "utf8")));
    const crlfAudit = await auditDocumentation({ cwd: root, format: "json" });
    assert.ok(crlfAudit.checks.some((check) => check.rule === "starter-text"));
    // The pointer import still resolves with CRLF endings.
    assert.ok(importsCanonicalInstructions(await readFile(join(root, "CLAUDE.md"), "utf8")));
    assert.ok(crlfAudit.checks.some((check) => check.rule === "agent-pointer" && check.pass));

    // No rule produces a spurious failure from the line endings themselves.
    await completeStarterDocuments(root, CRLF);
    await walk(join(root, "docs"));
    const completed = await auditDocumentation({ cwd: root, format: "json" });
    const failures = completed.checks.filter((check) => !check.pass);
    assert.deepEqual(failures, [], `CRLF documents must not fail: ${JSON.stringify(failures)}`);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("a pointer file without a trailing newline still imports the policy", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-eof-"));
  try {
    await setupProject({ cwd: root, agents: "claude" });
    await completeStarterDocuments(root);
    for (const contents of ["@AGENTS.md", "  @AGENTS.md  ", `@AGENTS.md${CRLF}`, "@AGENTS.md\n\n# Notes"]) {
      await writeFile(join(root, "CLAUDE.md"), contents, "utf8");
      assert.ok(importsCanonicalInstructions(contents), `should import: ${JSON.stringify(contents)}`);
      assert.equal(runCli(["audit", "documentation", "--strict", "--cwd", root]).status, 0, JSON.stringify(contents));
    }
    for (const contents of ["s@AGENTS.md", "@AGENTSxmd", "@AGENTS.md-extra"]) {
      assert.equal(importsCanonicalInstructions(contents), false, `must reject: ${JSON.stringify(contents)}`);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("a configuration saved with a UTF-8 BOM fails with an actionable message", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-bom-"));
  try {
    await setupProject({ cwd: root });
    const configPath = join(root, ".agent-docs", "config.json");
    const value = await readFile(configPath, "utf8");
    await writeFile(configPath, `﻿${value}`, "utf8");

    for (const command of [["next"], ["audit", "documentation"]]) {
      const result = runCli([...command, "--cwd", root]);
      assert.equal(result.status, 1, command.join(" "));
      assert.match(result.stderr, /byte-order mark/, "the message must name the BOM");
      assert.match(result.stderr, /without a BOM/, "the message must say what to do");
      assert.doesNotMatch(result.stderr, /Unexpected token/, "no raw parser error");
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("documents with a BOM are audited rather than crashing the parser", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-doc-bom-"));
  try {
    await setupProject({ cwd: root });
    await completeStarterDocuments(root);
    const overview = join(root, "docs", "01-system", "overview.md");
    await writeFile(overview, `﻿${await readFile(overview, "utf8")}`, "utf8");
    const result = runCli(["audit", "documentation", "--cwd", root]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Result:/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
