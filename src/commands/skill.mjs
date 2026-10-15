import { homedir } from "node:os";
import { resolve } from "node:path";
import { copySafe } from "../core/files.mjs";
import { resolveFromPackage } from "../core/paths.mjs";
import { documentationInitializationState } from "../core/config.mjs";

export async function installSkill(target = "project", options = {}) {
  if (!["project", "codex"].includes(target)) throw new Error(`Invalid target '${target}'. Use project or codex.`);
  const root = resolve(options.cwd ?? process.cwd());
  const destination = target === "codex"
    ? resolve(homedir(), ".codex", "skills", "manage-project-quality")
    : resolve(root, ".agents", "skills", "manage-project-quality");
  const result = await copySafe(resolveFromPackage("skills", "manage-project-quality"), destination, options);
  const documentation = target === "project" ? await documentationInitializationState(root) : undefined;
  console.log(`${result.status} ${destination}`);
  if (options.dryRun) {
    console.log("\nPreview only: no skill files were copied.");
    if (documentation && !documentation.initialized) {
      console.log("Documentation is not initialized. Preview it next with:");
      console.log(`npx @ghostbyte/agent-docs-kit@latest setup --cwd "${root}" --dry-run`);
    }
  } else if (target === "project") {
    console.log("\nNext steps:");
    if (!documentation.initialized) {
      console.log(`1. Initialize documentation: npx @ghostbyte/agent-docs-kit@latest setup --cwd "${root}" --dry-run`);
      console.log(`2. After reviewing the preview: npx @ghostbyte/agent-docs-kit@latest setup --cwd "${root}"`);
      console.log("3. Open or restart your AI coding session so it can discover AGENTS.md and .agents/skills/.");
      console.log("4. Prompt: Use $manage-project-quality. Inspect this repository, determine the current Agent Docs stage, and guide me through the next safe step. Do not infer facts without evidence.");
      console.log(`5. Check progress: npx @ghostbyte/agent-docs-kit@latest next --cwd "${root}"`);
    } else {
      console.log("1. Open or restart your AI coding session so it can discover AGENTS.md and .agents/skills/.");
      console.log("2. Prompt: Use $manage-project-quality. Inspect this repository, determine the current Agent Docs stage, and guide me through the next safe step. Do not infer facts without evidence.");
      console.log(`3. Check progress: npx @ghostbyte/agent-docs-kit@latest next --cwd "${root}"`);
    }
  } else {
    console.log("\nThe skill is now available to supported AI sessions for the current user.");
    console.log("Open or restart the AI session if it was already running, then invoke $manage-project-quality with a scoped request.");
  }
  return result;
}
