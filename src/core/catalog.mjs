import { readFile } from "node:fs/promises";
import { resolveFromPackage } from "./paths.mjs";

let cached;

export async function loadCatalog() {
  if (!cached) {
    cached = JSON.parse(await readFile(resolveFromPackage("content", "catalog.json"), "utf8"));
  }
  return cached;
}

export function selectEntry(entries, selector) {
  if (!selector) return undefined;
  const normalized = selector.toLowerCase();
  return entries.find((entry) =>
    entry.id === normalized || entry.slug === normalized || entry.aliases?.includes(normalized)
  );
}
