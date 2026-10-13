import { copyFile, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const references = resolve(root, "skills/manage-project-quality/references");
await mkdir(references, { recursive: true });
const catalog = JSON.parse(await readFile(resolve(root, "content/catalog.json"), "utf8"));
const expected = new Set();
for (const kind of ["documentation", "security", "engineering"]) {
  for (const entry of catalog[kind]) {
    const name = `${kind}-${basename(entry.source)}`;
    expected.add(name);
    await copyFile(resolve(root, entry.source), resolve(references, name));
  }
  const fullName = `${kind}-full-reference.md`;
  expected.add(fullName);
  await copyFile(resolve(root, `content/${kind}/full-reference.md`), resolve(references, fullName));
}
for (const name of await readdir(references)) {
  if (/^(?:documentation|security|engineering)-(?:\d{2}-.+|full-reference)\.md$/.test(name) && !expected.has(name)) {
    await rm(resolve(references, name));
  }
}
console.log("Built progressive skill references.");
