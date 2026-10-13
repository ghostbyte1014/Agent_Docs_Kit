import { access, readFile } from "node:fs/promises";
import { loadCatalog } from "../core/catalog.mjs";
import { resolveFromPackage } from "../core/paths.mjs";

export async function validatePackage() {
  const catalog = await loadCatalog();
  const errors = [];
  for (const group of ["security", "engineering"]) {
    for (const entry of catalog[group]) {
      try { await access(resolveFromPackage(entry.source)); }
      catch { errors.push(`Missing catalog source: ${entry.source}`); }
    }
  }
  const skill = await readFile(resolveFromPackage("skills/manage-project-quality/SKILL.md"), "utf8");
  if (!skill.includes("name: manage-project-quality")) errors.push("Skill name is invalid.");
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`PASS catalog (${catalog.security.length} security phases, ${catalog.engineering.length} engineering topics)`);
  console.log("PASS unified skill");
  return true;
}
