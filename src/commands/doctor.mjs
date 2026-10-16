import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { exists } from "../core/files.mjs";
import { installedSkillVersion, kitVersion, skillVersionFile } from "../core/version.mjs";
import { skillDestination, skillTargets } from "./skill.mjs";

// Prerequisite checks decide the exit code. Project version reporting is
// informational: a mismatch is reported, never failed.
export async function doctor(options = {}) {
  const checks = [{ name: "Node.js >=22", pass: Number(process.versions.node.split(".")[0]) >= 22, value: process.version }];
  try {
    checks.push({ name: "Git", pass: true, value: execFileSync("git", ["--version"], { encoding: "utf8" }).trim() });
  } catch {
    checks.push({ name: "Git", pass: false, value: "not found" });
  }
  for (const check of checks) console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}: ${check.value}`);

  const running = await kitVersion();
  console.log(`\nCLI version: ${running}`);
  const root = resolve(options.cwd ?? process.cwd());
  const configPath = resolve(root, ".agent-docs", "config.json");
  if (!(await exists(configPath))) {
    console.log("Project: no .agent-docs/config.json in this directory; nothing else to compare.");
    return checks.every((check) => check.pass);
  }

  let schemaVersion = "unreadable";
  try {
    schemaVersion = JSON.parse((await readFile(configPath, "utf8")).replace(/^﻿/, "")).schemaVersion ?? "absent";
  } catch { /* reported as unreadable below */ }
  const supported = [1, 2];
  console.log(`Config schemaVersion: ${schemaVersion}${supported.includes(schemaVersion) ? "" : " (not readable by this CLI)"}`);

  const stale = [];
  for (const target of skillTargets) {
    if (target === "codex") continue;
    const directory = skillDestination(target, root);
    if (!(await exists(resolve(directory, "SKILL.md")))) continue;
    const version = await installedSkillVersion(resolve(directory, skillVersionFile));
    const name = relative(root, directory);
    if (version === running) console.log(`Installed skill ${name}: ${version} (current)`);
    else {
      console.log(`Installed skill ${name}: ${version ?? "no recorded version"} (this CLI is ${running})`);
      stale.push(target);
    }
  }
  if (stale.length) {
    console.log("\nRefresh the stale skill copies:");
    for (const target of stale) console.log(`npx @ghostbyte/agent-docs-kit@latest skill install --target ${target} --force --cwd "${root}"`);
    console.log("A version mismatch is reported, not failed; it does not change the exit code.");
  }
  return checks.every((check) => check.pass);
}
