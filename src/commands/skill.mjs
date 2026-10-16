import { homedir } from "node:os";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { copySafe } from "../core/files.mjs";
import { resolveFromPackage } from "../core/paths.mjs";
import { documentationInitializationState } from "../core/config.mjs";
import { agentDefinition, agentIds } from "../core/agents.mjs";
import { kitVersion, skillVersionContents, skillVersionFile } from "../core/version.mjs";

const skillName = "manage-project-quality";

// Project-level targets write only inside the repository. `codex` is the one
// user-level target and stays an explicit, separate choice.
const projectTargets = Object.freeze({
  project: { directory: ".agents/skills", label: "repository (.agents/skills)" },
  ...Object.fromEntries(agentIds
    .filter((id) => agentRegistryDirectory(id))
    .map((id) => [id, { directory: agentRegistryDirectory(id), label: `${agentDefinition(id).label} (${agentRegistryDirectory(id)})` }]))
});

function agentRegistryDirectory(id) {
  return agentDefinition(id).skillDirectory;
}

export const skillTargets = Object.freeze([...Object.keys(projectTargets), "codex"]);

// Targets `setup --ai` installs into: always the generic repository location,
// plus the documented project-level directory of each selected agent.
export function projectSkillTargets(selectedAgentIds = []) {
  return ["project", ...selectedAgentIds.filter((id) => projectTargets[id])];
}

export function skillDestination(target, root) {
  if (target === "codex") return resolve(homedir(), ".codex", "skills", skillName);
  const entry = projectTargets[target];
  if (!entry) throw new Error(`Invalid target '${target}'. Use ${skillTargets.join(", ")}.`);
  return resolve(root, ...entry.directory.split("/"), skillName);
}

export async function installSkill(target = "project", options = {}) {
  if (!skillTargets.includes(target)) throw new Error(`Invalid target '${target}'. Use ${skillTargets.join(", ")}.`);
  const root = resolve(options.cwd ?? process.cwd());
  const destination = skillDestination(target, root);
  const result = await copySafe(resolveFromPackage("skills", skillName), destination, options);
  // The marker records which CLI produced this vendored copy so `next` can
  // report a skill that is older than the running CLI.
  if (result.status === "created" && !options.dryRun) {
    await writeFile(resolve(destination, skillVersionFile), skillVersionContents(await kitVersion()), "utf8");
  }
  const documentation = target === "codex" ? undefined : await documentationInitializationState(root);
  if (options.quiet) return result;
  console.log(`${result.status} ${destination}`);
  if (options.dryRun) {
    console.log("\nPreview only: no skill files were copied.");
    if (documentation && !documentation.initialized) {
      console.log("Documentation is not initialized. Preview it next with:");
      console.log(`npx @ghostbyte/agent-docs-kit@latest setup --cwd "${root}" --dry-run`);
    }
  } else if (target !== "codex") {
    console.log("\nNext steps:");
    if (!documentation.initialized) {
      console.log(`1. Initialize documentation: npx @ghostbyte/agent-docs-kit@latest setup --cwd "${root}" --dry-run`);
      console.log(`2. After reviewing the preview: npx @ghostbyte/agent-docs-kit@latest setup --cwd "${root}"`);
      console.log("3. Open or restart your AI coding session so it can discover AGENTS.md and the installed skill.");
      console.log("4. Prompt: Use $manage-project-quality. Inspect this repository, determine the current Agent Docs stage, and guide me through the next safe step. Do not infer facts without evidence.");
      console.log(`5. Check progress: npx @ghostbyte/agent-docs-kit@latest next --cwd "${root}"`);
    } else {
      console.log("1. Open or restart your AI coding session so it can discover AGENTS.md and the installed skill.");
      console.log("2. Prompt: Use $manage-project-quality. Inspect this repository, determine the current Agent Docs stage, and guide me through the next safe step. Do not infer facts without evidence.");
      console.log(`3. Check progress: npx @ghostbyte/agent-docs-kit@latest next --cwd "${root}"`);
    }
  } else {
    console.log("\nThe skill is now available to supported AI sessions for the current user.");
    console.log("Open or restart the AI session if it was already running, then invoke $manage-project-quality with a scoped request.");
  }
  return result;
}
