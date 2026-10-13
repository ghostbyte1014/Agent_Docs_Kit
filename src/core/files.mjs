import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { resolveFromPackage } from "./paths.mjs";

export async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function writeSafe(path, contents, { force = false, dryRun = false } = {}) {
  if (!force && await exists(path)) return { path, status: "skipped" };
  if (!dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents, "utf8");
  }
  return { path, status: dryRun ? "planned" : "created" };
}

export async function copySafe(source, destination, options = {}) {
  if (!options.force && await exists(destination)) return { path: destination, status: "skipped" };
  if (!options.dryRun) {
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true, force: Boolean(options.force) });
  }
  return { path: destination, status: options.dryRun ? "planned" : "created" };
}

export async function readTemplate(name, replacements = {}) {
  let value = await readFile(resolveFromPackage("templates", name), "utf8");
  for (const [key, replacement] of Object.entries(replacements)) {
    value = value.replaceAll(`{{${key}}}`, replacement);
  }
  return value;
}

export function displayResults(root, results) {
  for (const result of results) console.log(`${result.status.padEnd(8)} ${relative(root, result.path)}`);
}
