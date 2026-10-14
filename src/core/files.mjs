import { access, cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, extname, relative, resolve } from "node:path";
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
    if (!force) {
      try { await writeFile(path, contents, { encoding: "utf8", flag: "wx" }); }
      catch (error) {
        if (error.code === "EEXIST") return { path, status: "skipped" };
        throw error;
      }
    } else {
      const nonce = `${process.pid}-${Date.now()}-${randomUUID()}`;
      const staged = `${path}.agent-docs-stage-${nonce}`;
      const backup = `${path}.agent-docs-backup-${nonce}`;
      await writeFile(staged, contents, { encoding: "utf8", flag: "wx" });
      const replacing = await exists(path);
      let movedOriginal = false;
      try {
        if (replacing) {
          await rename(path, backup);
          movedOriginal = true;
        }
        await rename(staged, path);
      } catch (error) {
        await rm(staged, { force: true });
        if (movedOriginal && !(await exists(path))) await rename(backup, path);
        throw error;
      }
      if (movedOriginal) await rm(backup, { force: true });
    }
  }
  return { path, status: dryRun ? "planned" : "created" };
}

export async function availablePath(base, { force = false } = {}) {
  if (force || !(await exists(base))) return base;
  const extension = extname(base);
  const stem = extension ? base.slice(0, -extension.length) : base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${stem}-${index}${extension}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`Unable to select an unused path for ${base}.`);
}

export async function writeUnique(base, contents, options = {}) {
  if (options.force) return writeSafe(base, contents, options);
  if (options.dryRun) return writeSafe(await availablePath(base), contents, options);
  const extension = extname(base);
  const stem = extension ? base.slice(0, -extension.length) : base;
  for (let index = 1; index < 1000; index += 1) {
    const candidate = index === 1 ? base : `${stem}-${index}${extension}`;
    const result = await writeSafe(candidate, contents, options);
    if (result.status === "created") return result;
  }
  throw new Error(`Unable to create an unused path for ${base}.`);
}

export async function copySafe(source, destination, options = {}) {
  if (!options.force && await exists(destination)) return { path: destination, status: "skipped" };
  if (options.dryRun) return { path: destination, status: "planned" };
  await mkdir(dirname(destination), { recursive: true });
  const nonce = `${process.pid}-${Date.now()}-${randomUUID()}`;
  const staged = `${destination}.agent-docs-stage-${nonce}`;
  const backup = `${destination}.agent-docs-backup-${nonce}`;
  await cp(source, staged, { recursive: true, force: false, errorOnExist: true });
  const replacing = await exists(destination);
  try {
    if (replacing) await rename(destination, backup);
    await rename(staged, destination);
    if (replacing) await rm(backup, { recursive: true, force: true });
  } catch (error) {
    await rm(staged, { recursive: true, force: true });
    if (replacing && await exists(backup) && !(await exists(destination))) await rename(backup, destination);
    throw error;
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
