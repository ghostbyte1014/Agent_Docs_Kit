import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { historicalVersions, releaseHistoryErrors, retiredMajors, versionPolicyErrors } from "../scripts/version-policy-rules.mjs";

const projectRoot = join(import.meta.dirname, "..");

test("the reset line reserves historical major versions", () => {
  for (const version of ["1.3.7", "2.0.0", "3.9.9", "7.0.0", "7.0.0-beta.1"]) {
    assert.deepEqual(versionPolicyErrors(version), [], `${version} should remain available to the maintained line`);
  }
  for (const major of retiredMajors) {
    assert.match(versionPolicyErrors(`${major}.99.0`)[0], new RegExp(`retired major line ${major}\\.x`));
  }
  assert.match(versionPolicyErrors("0.0.0-stage")[0], /historical registry artifact/);
  assert.match(versionPolicyErrors("not-a-version")[0], /not a supported semantic version/);
});

test("the public release ledger covers every recorded historical version exactly once", async () => {
  const history = await readFile(join(projectRoot, "docs", "RELEASE_HISTORY.md"), "utf8");
  assert.deepEqual(releaseHistoryErrors(history), []);
  for (const entry of historicalVersions) {
    assert.equal(history.split(`| \`${entry.version}\` |`).length - 1, 1);
  }
});

test("the repository version and retained historical tags satisfy release policy", async () => {
  const metadata = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  assert.match(metadata.scripts["release:check"], /npm run release:version-policy/);
  execFileSync(process.execPath, ["scripts/check-version-policy.mjs"], { cwd: projectRoot, stdio: "pipe" });
});
