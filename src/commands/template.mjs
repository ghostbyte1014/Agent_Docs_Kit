import { resolve } from "node:path";
import { loadProjectConfig } from "../core/config.mjs";
import { readTemplate, writeUnique } from "../core/files.mjs";
import { localDate } from "./audit.mjs";

export const templateTypes = Object.freeze({
  adr: { file: "adr.md", directory: "02-project/decisions", label: "Architecture decision record" },
  runbook: { file: "runbook.md", directory: "05-operations/runbooks", label: "Operational runbook" },
  change: { file: "change-record.md", directory: "03-development/changes", label: "Change record" },
  incident: { file: "incident-review.md", directory: "05-operations/incidents", label: "Blameless incident review" },
  evidence: { file: "test-evidence.md", directory: "04-testing/evidence", label: "Test evidence record" }
});

export function listTemplates() {
  for (const [type, value] of Object.entries(templateTypes)) console.log(`${type.padEnd(10)} ${value.label}`);
  return templateTypes;
}

export async function createTemplate(type, options = {}) {
  const selected = templateTypes[type];
  if (!selected) throw new Error(`Unknown template '${type ?? ""}'. Run 'agent-docs template list'.`);
  const { root, config } = await loadProjectConfig(options.cwd);
  const date = localDate();
  const due = new Date();
  due.setDate(due.getDate() + 90);
  const contents = await readTemplate(selected.file, { DATE: date, REVIEW_DUE: localDate(due), TITLE: selected.label });
  const suffix = options.name ? `-${options.name}` : "";
  const output = resolve(root, config.templateOutput, selected.directory, `${date}-${type}${suffix}.md`);
  const result = await writeUnique(output, contents, options);
  console.log(`${result.status} ${result.path}`);
  return result;
}
