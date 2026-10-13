import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(await readFile(resolve(root, "content/catalog.json"), "utf8"));
const errors = [];
const seen = new Set();

for (const kind of ["security", "engineering"]) {
  for (const entry of catalog[kind]) {
    const key = `${kind}:${entry.id}:${entry.slug}`;
    if (seen.has(key)) errors.push(`Duplicate catalog entry: ${key}`);
    seen.add(key);
    try {
      const value = await readFile(resolve(root, entry.source), "utf8");
      if (!value.startsWith("# ")) errors.push(`${entry.source} has no H1.`);
      if (/\uFFFD|Â|â€|ï¿½/.test(value)) errors.push(`${entry.source} contains encoding artifacts.`);
    } catch {
      errors.push(`Missing source: ${entry.source}`);
    }
  }
}

async function markdownFiles(directory) {
  const found = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) found.push(...await markdownFiles(path));
    else if (extname(path) === ".md") found.push(path);
  }
  return found;
}

for (const file of await markdownFiles(resolve(root, "skills/manage-project-quality"))) {
  const value = await readFile(file, "utf8");
  if (/\uFFFD|Â|â€|ï¿½/.test(value)) errors.push(`${file} contains encoding artifacts.`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${seen.size} catalog entries and skill Markdown encoding.`);
}
