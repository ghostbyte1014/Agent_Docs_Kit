import { loadCatalog } from "../core/catalog.mjs";

export async function listCatalog(kind) {
  const catalog = await loadCatalog();
  const groups = kind ? [kind] : ["security", "engineering"];
  for (const group of groups) {
    if (!catalog[group]) throw new Error(`Unknown catalog '${group}'.`);
    console.log(`\n${group.toUpperCase()}`);
    for (const entry of catalog[group]) console.log(`  ${entry.id.padEnd(3)} ${entry.slug.padEnd(34)} ${entry.title}`);
  }
}
