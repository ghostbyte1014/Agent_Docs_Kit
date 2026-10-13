import { readFile } from "node:fs/promises";
import { loadCatalog, selectEntry } from "../core/catalog.mjs";
import { resolveFromPackage } from "../core/paths.mjs";

export async function showDocumentationGuide(selector) {
  const catalog = await loadCatalog();
  const entry = selectEntry(catalog.documentation, selector);
  if (!entry) throw new Error(`Unknown documentation area '${selector ?? ""}'. Run 'agent-docs list documentation'.`);
  const contents = await readFile(resolveFromPackage(entry.source), "utf8");
  console.log(contents.trim());
  return { entry, contents };
}
