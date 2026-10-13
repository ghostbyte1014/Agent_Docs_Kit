import { execFileSync, spawnSync } from "node:child_process";
import { access, mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const scratch = await mkdtemp(resolve(tmpdir(), "agent-docs-kit-smoke-"));
const npmCli = process.env.npm_execpath;
const runNpm = (arguments_, options = {}) => npmCli
  ? execFileSync(process.execPath, [npmCli, ...arguments_], options)
  : execFileSync("npm", arguments_, options);
try {
  const cache = resolve(scratch, "npm-cache");
  const packed = JSON.parse(runNpm(["pack", "--json", "--cache", cache, "--pack-destination", scratch], { cwd: root, encoding: "utf8" }));
  const archivePaths = new Set(packed[0].files.map((entry) => entry.path.replaceAll("\\", "/")));
  for (const required of ["scripts/validate-content.mjs", "site/index.html", "tests/cli.test.mjs", "skills/manage-project-quality/references/security-protocol.md", "skills/manage-project-quality/references/engineering-protocol.md", "skills/manage-project-quality/references/documentation-governance.md"]) {
    if (!archivePaths.has(required)) throw new Error(`Packed archive is missing ${required}.`);
  }
  for (const path of archivePaths) {
    if (/^(?:\.git|\.agent-docs|\.npm-cache|build|node_modules)(?:\/|$)|MONTHLY_MAINTENANCE_AI\.md$|\.tgz$/i.test(path)) throw new Error(`Private or generated path leaked into package: ${path}`);
  }
  const tarball = resolve(scratch, packed[0].filename);
  const consumer = resolve(scratch, "consumer");
  await mkdir(consumer);
  runNpm(["init", "--yes", "--cache", cache], { cwd: consumer, stdio: "ignore" });
  runNpm(["install", "--ignore-scripts", "--cache", cache, tarball], { cwd: consumer, stdio: "ignore" });
  const packageRoot = resolve(consumer, "node_modules", "@ghostbyte", "agent-docs-kit");
  const cli = resolve(packageRoot, "bin", "agent-docs.mjs");
  const runCli = (...arguments_) => execFileSync(process.execPath, [cli, ...arguments_], { cwd: consumer, encoding: "utf8" });
  const help = execFileSync(process.execPath, [cli, "--help"], { cwd: consumer, encoding: "utf8" });
  if (!help.includes("documentation guide") || !help.includes("security worksheet") || !help.includes("template create")) throw new Error("Packed CLI help is incomplete.");
  runCli("setup", "--dry-run");
  runCli("setup");
  runCli("audit", "documentation", "--strict", "--report", "--format", "json");
  const securityOutput = runCli("security", "worksheet", "api-layer");
  const engineeringOutput = runCli("engineering", "worksheet", "testing-types");
  for (const output of [securityOutput, engineeringOutput]) {
    const report = output.match(/created\s+(.+\.md)\s*$/m)?.[1];
    if (!report) throw new Error(`Unable to locate generated report in output: ${output}`);
    execFileSync(process.execPath, [resolve(packageRoot, "skills/manage-project-quality/scripts/check-report.mjs"), report], { cwd: consumer, stdio: "ignore" });
  }
  for (const type of ["adr", "runbook", "change", "incident", "evidence"]) runCli("template", "create", type, "--name", `smoke-${type}`);
  runCli("documentation", "guide", "system-documentation");
  runCli("skill", "install", "--target", "project");
  runCli("validate");
  await access(resolve(consumer, ".agents/skills/manage-project-quality/SKILL.md"));
  execFileSync(process.execPath, ["--input-type=module", "--eval", "const api = await import('@ghostbyte/agent-docs-kit'); if (typeof api.auditDocumentation !== 'function' || typeof api.createTemplate !== 'function') process.exit(1);"], { cwd: consumer });
  const invalid = spawnSync(process.execPath, [cli, "doctor", "unexpected"], { cwd: consumer, encoding: "utf8" });
  if (invalid.status === 0 || !invalid.stderr.includes("Invalid arguments")) throw new Error("CLI accepted an unexpected positional argument.");
  runNpm(["run", "validate"], { cwd: packageRoot, stdio: "ignore" });
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const reportBody = await readFile(resolve(consumer, "docs/03-development/audits", `${date}-documentation.json`), "utf8");
  JSON.parse(reportBody);
  console.log(`PASS packed installation (${packed[0].size} bytes, ${packed[0].entryCount} files)`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
