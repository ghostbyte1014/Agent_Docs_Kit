// package.json `version` is the only source for every pinned version string.
//
// The site is not rewritten here: site/index.html holds a placeholder token and
// scripts/build-site.mjs substitutes it, so the source file never drifts.
// Run with --check to fail instead of writing (used by release:check and CI).

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { versionPlaceholder } from "../src/core/version.mjs";
import { versionRules, versionTargets } from "./version-rules.mjs";

const root = resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");

const metadata = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const version = metadata.version;
const lock = JSON.parse(await readFile(resolve(root, "package-lock.json"), "utf8"));

const packageName = metadata.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Rules and targets live in ./version-rules.mjs so they can be unit tested.
const rules = versionRules(version, metadata.name);
const targets = versionTargets;

const problems = [];
const updated = [];

for (const target of targets) {
  const file = resolve(root, target.path);
  const original = await readFile(file, "utf8");
  let next = original;
  for (const [name, pattern, replacement] of rules) {
    if (target.rules.includes(name)) next = next.replace(pattern, replacement);
  }
  if (next === original) continue;
  if (check) problems.push(`${target.path} has a pinned version that does not match package.json (${version}).`);
  else {
    await writeFile(file, next, "utf8");
    updated.push(target.path);
  }
}

// The site pin is a build-time substitution, so the source must keep the token.
const site = await readFile(resolve(root, "site/index.html"), "utf8");
if (!site.includes(versionPlaceholder)) {
  problems.push(`site/index.html must contain the ${versionPlaceholder} token; scripts/build-site.mjs substitutes the real version.`);
}
if (new RegExp(`${packageName}@\\d+\\.\\d+\\.\\d+`).test(site)) {
  problems.push("site/index.html pins a literal version. Use the placeholder token so the built page is the only place a version appears.");
}

if (lock.version !== version) problems.push(`package-lock.json version ${lock.version} does not match package.json ${version}.`);
if (lock.packages?.[""]?.version && lock.packages[""].version !== version) {
  problems.push(`package-lock.json packages[""].version ${lock.packages[""].version} does not match package.json ${version}.`);
}

if (problems.length) {
  for (const problem of problems) console.error(`FAIL ${problem}`);
  console.error(check ? "\nRun 'node scripts/sync-version.mjs' to rewrite the pins, then review the diff." : "\nFix the items above by hand; this script does not edit them.");
  process.exit(1);
}

console.log(updated.length ? `Synced version ${version} into: ${updated.join(", ")}` : `Version pins already match ${version}.`);
