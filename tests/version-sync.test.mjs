// Version-pin rewriting must be idempotent and must not clobber unrelated
// versions. A prerelease version broke both properties before 6.2.1: a second
// run produced 6.2.1-beta.1-beta.1, which corrupted the pins and made
// `sync-version.mjs --check` fail while reporting a mismatch that did not exist.

import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { applyVersionRules, versionTargets } from "../scripts/version-rules.mjs";

const projectRoot = join(import.meta.dirname, "..");
const packageName = "@ghostbyte/agent-docs-kit";

const samples = [
  `npm install --save-dev ${packageName}@6.2.1`,
  `npm install --global ${packageName}@6.2.1`,
  "a reviewed version such as `@6.2.1` and update the pin",
  "npm version 6.2.1 --no-git-tag-version",
  "git switch -c release/v6.2.1",
  "git tag v6.2.1",
  "git push origin v6.2.1",
  'git commit -m "release: prepare v6.2.1"'
];

test("rewriting a pinned version is idempotent for releases and prereleases", () => {
  for (const version of ["6.2.1", "6.3.0", "7.0.0", "6.2.1-beta.1", "6.3.0-rc.2", "7.0.0-alpha.10"]) {
    for (const sample of samples) {
      const once = applyVersionRules(sample, version, packageName);
      const twice = applyVersionRules(once, version, packageName);
      const thrice = applyVersionRules(twice, version, packageName);
      assert.equal(twice, once, `not idempotent at ${version}: ${sample} -> ${once} -> ${twice}`);
      assert.equal(thrice, once, `not stable at ${version}: ${sample}`);
      assert.ok(once.includes(version), `the rewrite must apply at ${version}: ${sample} -> ${once}`);
      assert.ok(!once.includes(`${version}-`) || version.includes("-"), `suffix duplicated at ${version}: ${once}`);
    }
  }
});

test("a version unrelated to the package is left alone", () => {
  const untouched = [
    "Requires Node.js v22.0.0 or newer",
    "Node.js 22, 24, and 26 are covered by CI",
    "the workflow derives the dist-tag from `<version>-beta.1`",
    "see RFC v1.2.3 for the format"
  ];
  for (const version of ["6.2.1", "6.2.1-beta.1"]) {
    for (const sample of untouched) {
      assert.equal(applyVersionRules(sample, version, packageName), sample, `rewrote unrelated text at ${version}: ${sample}`);
    }
  }
});

test("each synced document opts into only the rules that apply to it", async () => {
  // README and the testing guide carry package pins, not release commands, so
  // a release-command rule must never rewrite anything in them.
  for (const target of versionTargets) {
    const source = await readFile(join(projectRoot, target.path), "utf8");
    const applied = applyVersionRules(source, "9.9.9", packageName, target.rules);
    const withEverything = applyVersionRules(source, "9.9.9", packageName);
    if (target.rules.length < 5) {
      assert.equal(
        applied,
        applyVersionRules(source, "9.9.9", packageName, target.rules),
        `${target.path} must rewrite deterministically`
      );
    }
    assert.ok(withEverything.length > 0);
  }
});

test("the repository's pinned versions agree with package.json", async () => {
  const metadata = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  // --check exits nonzero on any drift, so a throw is the assertion.
  execFileSync(process.execPath, ["scripts/sync-version.mjs", "--check"], { cwd: projectRoot, stdio: "pipe" });
  for (const target of versionTargets) {
    const source = await readFile(join(projectRoot, target.path), "utf8");
    assert.equal(
      applyVersionRules(source, metadata.version, packageName, target.rules),
      source,
      `${target.path} is already synced, so applying the rules again must change nothing`
    );
  }
});
