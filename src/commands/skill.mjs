import { homedir } from "node:os";
import { resolve } from "node:path";
import { copySafe } from "../core/files.mjs";
import { resolveFromPackage } from "../core/paths.mjs";

export async function installSkill(target = "project", options = {}) {
  if (!["project", "codex"].includes(target)) throw new Error(`Invalid target '${target}'. Use project or codex.`);
  const root = resolve(options.cwd ?? process.cwd());
  const destination = target === "codex"
    ? resolve(homedir(), ".codex", "skills", "manage-project-quality")
    : resolve(root, ".agents", "skills", "manage-project-quality");
  const result = await copySafe(resolveFromPackage("skills", "manage-project-quality"), destination, options);
  console.log(`${result.status} ${destination}`);
  return result;
}
