import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadCatalog, selectEntry } from "../core/catalog.mjs";
import { exists, writeSafe } from "../core/files.mjs";
import { resolveFromPackage } from "../core/paths.mjs";

const date = () => new Date().toISOString().slice(0, 10);

async function reportFor(kind, selector, options = {}) {
  const catalog = await loadCatalog();
  const entries = catalog[kind];
  const entry = selectEntry(entries, selector);
  if (!entry) throw new Error(`Unknown ${kind} selection '${selector ?? ""}'. Run 'agent-docs list ${kind}'.`);
  const source = await readFile(resolveFromPackage(entry.source), "utf8");
  const status = kind === "security" ? "Unverified" : "Unverified";
  const heading = kind === "security" ? "Security audit" : "Engineering review";
  const destinationRoot = kind === "security"
    ? "docs/04-testing/security-audits"
    : "docs/03-development/engineering-reviews";
  const output = resolve(options.cwd ?? process.cwd(), destinationRoot, `${date()}-${entry.slug}.md`);
  const body = `# ${heading}: ${entry.title}\n\n- Date: ${date()}\n- Style: ${options.style ?? "standard"}\n- Overall status: ${status}\n- Reviewer: _Unassigned_\n\n## Scope and authorization\n\n- Target: _Describe the code, configuration, or authorized environment_\n- Authorization: _Required before active security testing_\n- Exclusions: _List exclusions_\n\n## Findings\n\n| Check | Status | Evidence | Action |\n|---|---|---|---|\n| Add each applicable check | ${status} | File/line, command output, or external evidence | Required follow-up |\n\n## Reference checklist\n\n${source}\n`;
  const result = await writeSafe(output, body, options);
  console.log(`${result.status} ${output}`);
  return result;
}

export const auditSecurity = (selector, options) => reportFor("security", selector, options);
export const reviewEngineering = (selector, options) => reportFor("engineering", selector, options);

export async function auditDocumentation(options = {}) {
  const root = resolve(options.cwd ?? process.cwd());
  const required = [
    ".agent-docs/config.json",
    "docs/README.md",
    "docs/01-system/overview.md",
    "docs/02-project/README.md",
    "docs/05-operations/README.md"
  ];
  const rows = await Promise.all(required.map(async (path) => ({ path, present: await exists(resolve(root, path)) })));
  for (const row of rows) console.log(`${row.present ? "PASS" : "FAIL"} ${row.path}`);
  const result = { checkedAt: new Date().toISOString(), pass: rows.every((row) => row.present), files: rows };
  if (options.report && !options.dryRun) {
    const output = resolve(root, "docs/03-development/audits", `${date()}-documentation.json`);
    await mkdir(resolve(output, ".."), { recursive: true });
    await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(`created ${output}`);
  }
  return result;
}
