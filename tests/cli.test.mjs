import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupProject } from "../src/commands/setup.mjs";
import { auditSecurity, reviewEngineering } from "../src/commands/audit.mjs";
import { browserCommand, openWebsite, websiteUrl } from "../src/commands/website.mjs";

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

test("security and engineering reports use distinct semantics", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-kit-"));
  try {
    const security = await auditSecurity("04", { cwd: root });
    const engineering = await reviewEngineering("08", { cwd: root });
    assert.match(await readFile(security.path, "utf8"), /Security audit: API Layer/);
    assert.match(await readFile(engineering.path, "utf8"), /Engineering review: Testing Types/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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
