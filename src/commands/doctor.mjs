import { execFileSync } from "node:child_process";

export function doctor() {
  const checks = [{ name: "Node.js >=22", pass: Number(process.versions.node.split(".")[0]) >= 22, value: process.version }];
  try {
    checks.push({ name: "Git", pass: true, value: execFileSync("git", ["--version"], { encoding: "utf8" }).trim() });
  } catch {
    checks.push({ name: "Git", pass: false, value: "not found" });
  }
  for (const check of checks) console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}: ${check.value}`);
  return checks.every((check) => check.pass);
}
