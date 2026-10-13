import { execFileSync } from "node:child_process";

export function doctor() {
  const checks = [{ name: "Node.js >=20", pass: Number(process.versions.node.split(".")[0]) >= 20, value: process.version }];
  try {
    checks.push({ name: "Git", pass: true, value: execFileSync("git", ["--version"], { encoding: "utf8" }).trim() });
  } catch {
    checks.push({ name: "Git", pass: false, value: "not found" });
  }
  for (const check of checks) console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}: ${check.value}`);
  return checks.every((check) => check.pass);
}
