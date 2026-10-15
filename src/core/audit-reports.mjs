import { readdir, readFile, stat } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import { exists } from "./files.mjs";

const candidateName = /^\d{4}-\d{2}-\d{2}-documentation(?:-\d+)?\.(json|md|txt)$/i;

function normalized(path) {
  return path.replaceAll("\\", "/");
}

function validCheckedAt(value) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function validateChecks(checks, overall, expected) {
  if (!Array.isArray(checks) || !checks.length) return "Report has no audit checks.";
  if (checks.some((row) => !row || typeof row.rule !== "string" || typeof row.path !== "string" || typeof row.pass !== "boolean")) {
    return "Report contains a malformed audit check.";
  }
  const derived = checks.every((row) => row.pass);
  if (derived !== overall) return "Report result does not match its check rows.";
  const configuration = checks.find((row) => row.rule === "configuration" && normalized(row.path) === ".agent-docs/config.json");
  if (!configuration) return "Report does not contain the expected project configuration check.";
  for (const path of expected.requiredDocuments) {
    if (!checks.some((row) => row.rule === "required-document" && normalized(row.path) === normalized(path))) {
      return `Report does not cover configured required document '${path}'.`;
    }
  }
  return undefined;
}

function parseJson(value, expected) {
  let parsed;
  try { parsed = JSON.parse(value); }
  catch { return { status: "invalid", detail: "Report is not valid JSON." }; }
  const checkedAt = validCheckedAt(parsed?.checkedAt);
  if (checkedAt === undefined) return { status: "invalid", detail: "Report has no valid checkedAt timestamp." };
  if (typeof parsed.pass !== "boolean") return { status: "invalid", detail: "Report has no boolean pass result." };
  const detail = validateChecks(parsed.checks, parsed.pass, expected);
  if (detail) return { status: "invalid", detail, checkedAt };
  return { status: parsed.pass ? "pass" : "fail", checkedAt, detail: parsed.pass ? "The latest documentation audit passed." : "The latest documentation audit failed." };
}

function markdownRows(value) {
  const checks = [];
  for (const line of value.split(/\r?\n/)) {
    const match = line.match(/^\|\s*(PASS|FAIL)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
    if (match) checks.push({ pass: match[1] === "PASS", rule: match[2].trim(), path: match[3].trim() });
  }
  return checks;
}

function parseMarkdown(value, expected) {
  if (!/^# Documentation audit\s*$/m.test(value)) return { status: "invalid", detail: "Report is not a documentation audit." };
  const checkedAt = validCheckedAt(value.match(/^- Checked:\s*(.*?)\s*$/m)?.[1]);
  if (checkedAt === undefined) return { status: "invalid", detail: "Report has no valid Checked timestamp." };
  const result = value.match(/^- Result:\s*(PASS|FAIL)\s*$/m)?.[1];
  if (!result) return { status: "invalid", detail: "Report has no recognized Result field.", checkedAt };
  const pass = result === "PASS";
  const detail = validateChecks(markdownRows(value), pass, expected);
  if (detail) return { status: "invalid", detail, checkedAt };
  return { status: pass ? "pass" : "fail", checkedAt, detail: pass ? "The latest documentation audit passed." : "The latest documentation audit failed." };
}

function parseText(value, expected) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let checkedAt;
  let declared;
  const checks = [];
  for (const line of lines) {
    if (line.startsWith("Checked: ")) {
      checkedAt = validCheckedAt(line.slice("Checked: ".length));
      if (checkedAt === undefined) return { status: "invalid", detail: "Report has an invalid Checked timestamp." };
      continue;
    }
    if (/^Result: (PASS|FAIL)$/.test(line)) {
      declared = line.endsWith("PASS");
      continue;
    }
    const separator = line.indexOf(" — ");
    const left = separator >= 0 ? line.slice(0, separator) : line;
    const match = left.match(/^(PASS|FAIL)\s+([^\s]+)\s+(.+)$/);
    if (!match) return { status: "invalid", detail: "Legacy text report contains an unrecognized line.", checkedAt };
    checks.push({ pass: match[1] === "PASS", rule: match[2], path: match[3].trim() });
  }
  const pass = checks.length > 0 && checks.every((row) => row.pass);
  if (declared !== undefined && declared !== pass) return { status: "invalid", detail: "Report result does not match its check rows.", checkedAt };
  const detail = validateChecks(checks, pass, expected);
  if (detail) return { status: "invalid", detail, checkedAt };
  return { status: pass ? "pass" : "fail", checkedAt, legacy: checkedAt === undefined, detail: pass ? "The latest documentation audit passed." : "The latest documentation audit failed." };
}

async function files(directory) {
  if (!(await exists(directory))) return [];
  const found = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) found.push(...await files(path));
    else if (item.isFile() && item.name !== ".gitkeep") found.push(path);
  }
  return found;
}

export async function evaluateDocumentationReports(directory, { root, requiredDocuments }) {
  const allFiles = await files(directory);
  const candidates = allFiles.filter((path) => candidateName.test(basename(path)));
  if (!candidates.length) {
    return {
      status: allFiles.length ? "invalid" : "missing",
      candidateCount: 0,
      ignoredCount: allFiles.length,
      detail: allFiles.length ? "No recognized documentation audit report was found; unrelated files were ignored." : "No documentation audit report was found."
    };
  }

  const evaluated = [];
  for (const path of candidates) {
    const [value, info] = await Promise.all([readFile(path, "utf8"), stat(path)]);
    const extension = path.toLowerCase().split(".").at(-1);
    const parsed = extension === "json" ? parseJson(value, { requiredDocuments }) : extension === "md" ? parseMarkdown(value, { requiredDocuments }) : parseText(value, { requiredDocuments });
    evaluated.push({ ...parsed, path, relativePath: relative(root, path), modifiedAt: info.mtimeMs, recency: parsed.checkedAt ?? info.mtimeMs });
  }
  evaluated.sort((left, right) => right.recency - left.recency || right.modifiedAt - left.modifiedAt || right.path.localeCompare(left.path));
  const latest = evaluated[0];
  const tied = evaluated.filter((item) => item.recency === latest.recency && item.modifiedAt === latest.modifiedAt);
  if (tied.length > 1) {
    return { status: "invalid", candidateCount: candidates.length, ignoredCount: allFiles.length - candidates.length, reportPath: latest.path, relativePath: latest.relativePath, detail: "Multiple documentation audits have the same latest timestamp; rerun the audit to establish an unambiguous result." };
  }
  return { ...latest, candidateCount: candidates.length, ignoredCount: allFiles.length - candidates.length };
}
