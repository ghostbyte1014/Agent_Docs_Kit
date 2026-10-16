// Supported AI coding agents that need a tool-specific instruction file.
//
// AGENTS.md stays the single canonical policy. Each entry below describes a
// thin pointer file that imports it, so the policy is never duplicated and can
// never drift between tools.
//
// `skillDirectory` is set only where the tool's own documentation defines a
// project-level skill location. Agents without one still read the pointer file.

import { resolve } from "node:path";
import { exists } from "./files.mjs";

export const canonicalInstructions = "AGENTS.md";
export const importLine = "@AGENTS.md";

export const agentRegistry = Object.freeze({
  claude: Object.freeze({
    id: "claude",
    label: "Claude Code",
    instructionFile: "CLAUDE.md",
    skillDirectory: ".claude/skills",
    signals: Object.freeze([".claude", "CLAUDE.md"]),
    note: "Claude Code reads CLAUDE.md and resolves '@AGENTS.md' as an import."
  }),
  gemini: Object.freeze({
    id: "gemini",
    label: "Gemini CLI",
    instructionFile: "GEMINI.md",
    skillDirectory: undefined,
    signals: Object.freeze([".gemini", "GEMINI.md"]),
    note: "Gemini CLI reads GEMINI.md by default and supports '@file' imports, so no settings.json change is needed."
  })
});

export const agentIds = Object.freeze(Object.keys(agentRegistry));

export function agentDefinition(id) {
  const definition = agentRegistry[id];
  if (!definition) throw new Error(`Unknown agent '${id}'. Use ${agentIds.join(", ")}, all, auto, or none.`);
  return definition;
}

// Accepts "all", "auto", "none", or a comma-separated list of agent ids.
// "auto" is resolved by the caller against the project; it is returned as-is.
export function parseAgentSelection(value) {
  if (value === undefined || value === null || value === "") return { mode: "unset", ids: [] };
  const raw = String(value).trim().toLowerCase();
  if (raw === "auto") return { mode: "auto", ids: [] };
  if (raw === "all") return { mode: "explicit", ids: [...agentIds] };
  if (raw === "none") return { mode: "explicit", ids: [] };
  const ids = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (!ids.length) throw new Error(`Invalid --agents value '${value}'. Use ${agentIds.join(", ")}, all, auto, or none.`);
  const unique = [];
  for (const id of ids) {
    agentDefinition(id);
    if (!unique.includes(id)) unique.push(id);
  }
  return { mode: "explicit", ids: unique };
}

// Agents the project already shows signs of using.
export async function detectAgents(root) {
  const found = [];
  for (const id of agentIds) {
    for (const signal of agentRegistry[id].signals) {
      if (await exists(resolve(root, signal))) {
        found.push(id);
        break;
      }
    }
  }
  return found;
}

export function pointerFileContents(id) {
  const definition = agentDefinition(id);
  return `${importLine}

<!-- ${definition.label} reads this file. The shared policy lives in ${canonicalInstructions};
     keep it as the single source and add only ${definition.label}-specific notes below. -->

## ${definition.label} notes
`;
}

// A pointer file is healthy when it imports the canonical policy.
export function importsCanonicalInstructions(value) {
  return new RegExp(`^\s*@${canonicalInstructions.replace(".", "\.")}\s*$`, "m").test(value ?? "");
}
