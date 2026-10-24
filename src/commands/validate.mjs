import { access, readFile, readdir } from "node:fs/promises";
import { basename } from "node:path";
import { loadCatalog } from "../core/catalog.mjs";
import { resolveFromPackage } from "../core/paths.mjs";

export async function validatePackage() {
  const catalog = await loadCatalog();
  const errors = [];
  const expectedGenerated = new Set();
  for (const group of ["documentation", "security", "engineering"]) {
    for (const entry of catalog[group]) {
      let source;
      let generated;
      const generatedName = `${group}-${basename(entry.source)}`;
      expectedGenerated.add(generatedName);
      try {
        source = await readFile(resolveFromPackage(entry.source), "utf8");
      }
      catch { errors.push(`Missing catalog source: ${entry.source}`); }
      try {
        generated = await readFile(resolveFromPackage("skills/manage-project-quality/references", generatedName), "utf8");
      }
      catch { errors.push(`Missing generated skill reference: ${generatedName}`); }
      if (source !== undefined && generated !== undefined && source !== generated) errors.push(`Stale generated skill reference: ${generatedName}`);
    }
    const fullName = `${group}-full-reference.md`;
    expectedGenerated.add(fullName);
    try {
      const source = await readFile(resolveFromPackage(`content/${group}/full-reference.md`), "utf8");
      const generated = await readFile(resolveFromPackage("skills/manage-project-quality/references", fullName), "utf8");
      if (source !== generated) errors.push(`Stale generated skill reference: ${fullName}`);
    } catch { errors.push(`Missing ${group} full reference or generated copy.`); }
  }
  for (const name of await readdir(resolveFromPackage("skills/manage-project-quality/references"))) {
    if (/^(?:documentation|security|engineering)-(?:\d{2}-.+|full-reference)\.md$/.test(name) && !expectedGenerated.has(name)) errors.push(`Unexpected generated skill reference: ${name}`);
  }
  if (catalog.schemaVersion !== 2) errors.push("Catalog schemaVersion must be 2.");
  if (catalog.documentation.length !== 7) errors.push("Catalog must contain 7 documentation areas.");
  if (catalog.security.length !== 13) errors.push("Catalog must contain 13 security phases.");
  if (catalog.engineering.length !== 18) errors.push("Catalog must contain 18 engineering topics.");
  for (const template of ["adr.md", "runbook.md", "change-record.md", "incident-review.md", "test-evidence.md"]) {
    try { await access(resolveFromPackage("templates", template)); }
    catch { errors.push(`Missing template: ${template}`); }
  }
  const skill = await readFile(resolveFromPackage("skills/manage-project-quality/SKILL.md"), "utf8");
  if (!skill.includes("name: manage-project-quality")) errors.push("Skill name is invalid.");
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`PASS catalog (${catalog.documentation.length} documentation areas, ${catalog.security.length} security phases, ${catalog.engineering.length} engineering topics)`);
  console.log("PASS documentation templates");
  console.log("PASS unified skill");
  return true;
}
