// package.json is the only source for the running CLI version.
import { readFile } from "node:fs/promises";
import { resolveFromPackage } from "./paths.mjs";

export const versionPlaceholder = "__AGENT_DOCS_KIT_VERSION__";
export const skillVersionFile = ".agent-docs-skill.json";

let cached;

export async function kitVersion() {
  if (!cached) cached = JSON.parse(await readFile(resolveFromPackage("package.json"), "utf8")).version;
  return cached;
}

export function skillVersionContents(version) {
  return `${JSON.stringify({ kitVersion: version, source: "@ghostbyte/agent-docs-kit" }, null, 2)}\n`;
}

// Reads the marker a previous `skill install` wrote into an installed skill.
export async function installedSkillVersion(markerPath) {
  try {
    const parsed = JSON.parse(await readFile(markerPath, "utf8"));
    return typeof parsed.kitVersion === "string" ? parsed.kitVersion : undefined;
  } catch {
    return undefined;
  }
}
