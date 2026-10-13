import { readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { exists } from "./files.mjs";

export const defaultConfig = Object.freeze({
  schemaVersion: 2,
  documentationRoot: "docs",
  documentationReports: "docs/03-development/audits",
  securityReports: "docs/04-testing/security-audits",
  engineeringReports: "docs/03-development/engineering-reviews",
  templateOutput: "docs",
  interactionStyle: "standard",
  maxAgeDays: 180,
  requireMetadata: false,
  requiredDocuments: ["docs/README.md", "docs/01-system/overview.md", "docs/02-project/README.md", "docs/05-operations/README.md"]
});

const configKeys = new Set(Object.keys(defaultConfig));

async function nearestExistingPath(path) {
  let current = path;
  while (!(await exists(current))) {
    const parent = dirname(current);
    if (parent === current) return current;
    current = parent;
  }
  return current;
}

async function safeRelativePath(root, value, label) {
  if (typeof value !== "string" || !value.trim() || isAbsolute(value)) throw new Error(`${label} must be a non-empty project-relative path.`);
  const resolved = resolve(root, value);
  const rel = relative(root, resolved);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`${label} must stay inside the target project.`);
  const [realRoot, realAncestor] = await Promise.all([realpath(root), realpath(await nearestExistingPath(resolved))]);
  const realRelative = relative(realRoot, realAncestor);
  if (realRelative === ".." || realRelative.startsWith(`..${sep}`) || isAbsolute(realRelative)) throw new Error(`${label} resolves through a link outside the target project.`);
  return value.replaceAll("\\", "/");
}

export async function loadProjectConfig(cwd = process.cwd()) {
  const root = resolve(cwd);
  if (!(await exists(root))) throw new Error(`Target project does not exist: ${root}`);
  const configPath = resolve(root, ".agent-docs/config.json");
  let user = {};
  if (await exists(configPath)) {
    try { user = JSON.parse(await readFile(configPath, "utf8")); }
    catch (error) { throw new Error(`Invalid ${configPath}: ${error.message}`); }
  }
  if (!user || typeof user !== "object" || Array.isArray(user)) throw new Error(`${configPath} must contain a JSON object.`);
  for (const key of Object.keys(user)) if (!configKeys.has(key)) throw new Error(`Unknown agent-docs configuration key '${key}'.`);
  const config = { ...defaultConfig, ...user };
  if (![1, 2].includes(config.schemaVersion)) throw new Error("Unsupported agent-docs configuration schemaVersion.");
  if (!Number.isInteger(config.maxAgeDays) || config.maxAgeDays < 1) throw new Error("maxAgeDays must be a positive integer.");
  if (typeof config.requireMetadata !== "boolean") throw new Error("requireMetadata must be a boolean.");
  if (!["standard", "learning"].includes(config.interactionStyle)) throw new Error("interactionStyle must be standard or learning.");
  if (!Array.isArray(config.requiredDocuments)) throw new Error("requiredDocuments must be an array.");
  for (const key of ["documentationRoot", "documentationReports", "securityReports", "engineeringReports", "templateOutput"]) config[key] = await safeRelativePath(root, config[key], key);
  config.requiredDocuments = await Promise.all(config.requiredDocuments.map((value, index) => safeRelativePath(root, value, `requiredDocuments[${index}]`)));
  return { root, config, configPath };
}
