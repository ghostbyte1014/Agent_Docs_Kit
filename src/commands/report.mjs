import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { worksheetReportState } from "../core/report-validation.mjs";

export async function validateWorksheetFile(path, options = {}) {
  if (!path) throw new Error("Choose a worksheet to validate.");
  const root = resolve(options.cwd ?? process.cwd());
  const target = resolve(root, path);
  const projectPath = relative(root, target);
  if (!projectPath || projectPath.startsWith("..") || isAbsolute(projectPath)) {
    throw new Error("Worksheet path must stay inside the target project.");
  }
  const state = worksheetReportState(await readFile(target, "utf8"));
  const errors = [...state.errors];
  if (state.open) errors.push("Worksheet is incomplete: resolve every Unverified finding and update Overall status.");
  const result = { path: target, relativePath: projectPath, ...state, errors, pass: errors.length === 0 };
  console.log(`${result.pass ? "PASS" : "FAIL"} worksheet ${projectPath}`);
  if (result.warnings.length) for (const warning of result.warnings) console.log(`WARNING: ${warning}`);
  if (result.errors.length) for (const error of result.errors) console.log(`- ${error}`);
  else console.log(`Overall status: ${result.overall}. Findings: ${result.statuses.length}.`);
  return result;
}
