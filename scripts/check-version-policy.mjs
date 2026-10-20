import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { historicalVersions, releaseHistoryErrors, versionPolicyErrors } from "./version-policy-rules.mjs";

const root = resolve(import.meta.dirname, "..");
const metadata = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const history = await readFile(resolve(root, "docs", "RELEASE_HISTORY.md"), "utf8");
const errors = [...versionPolicyErrors(metadata.version), ...releaseHistoryErrors(history)];

try {
  const tags = new Set(execFileSync("git", ["tag", "--list"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split(/\r?\n/u)
    .map((tag) => tag.trim())
    .filter(Boolean));
  for (const entry of historicalVersions) {
    if (!entry.gitTag.startsWith("`")) continue;
    const tag = entry.gitTag.slice(1, -1);
    if (!tags.has(tag)) errors.push(`Historical Git tag ${tag} is missing. Do not recreate it without verifying the original commit.`);
  }
} catch {
  console.warn("SKIP historical Git-tag verification (Git repository unavailable). The version and ledger checks still ran.");
}

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(1);
}

console.log(`PASS version policy (${metadata.version}; retired major lines: 4.x, 5.x, 6.x)`);
