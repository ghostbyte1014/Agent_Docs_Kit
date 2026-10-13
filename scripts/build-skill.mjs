import { copyFile, mkdir, readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const references = resolve(root, "skills/manage-project-quality/references");
await mkdir(references, { recursive: true });
const catalog = JSON.parse(await readFile(resolve(root, "content/catalog.json"), "utf8"));
for (const kind of ["security", "engineering"]) {
  for (const entry of catalog[kind]) {
    await copyFile(resolve(root, entry.source), resolve(references, `${kind}-${basename(entry.source)}`));
  }
  await copyFile(resolve(root, `content/${kind}/full-reference.md`), resolve(references, `${kind}-full-reference.md`));
}
console.log("Built progressive skill references.");
