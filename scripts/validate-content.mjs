import { access, readFile, readdir } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(await readFile(resolve(root, "content/catalog.json"), "utf8"));
const metadata = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const errors = [];
const identities = new Set();
const expectedGenerated = new Set();
const aliases = { documentation: new Map(), security: new Map(), engineering: new Map() };
const controlIds = new Set();

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

if (catalog.schemaVersion !== 2) errors.push("content/catalog.json must use schemaVersion 2.");
if (!validDate(catalog.lastReviewed)) errors.push("Catalog lastReviewed is missing or invalid.");
if (!validDate(catalog.reviewDue)) errors.push("Catalog reviewDue is missing or invalid.");
if (catalog.reviewDue < catalog.lastReviewed) errors.push("Catalog reviewDue precedes lastReviewed.");

for (const kind of ["documentation", "security", "engineering"]) {
  for (const entry of catalog[kind]) {
    const identity = `${kind}:${entry.id}:${entry.slug}`;
    if (identities.has(identity)) errors.push(`Duplicate catalog entry: ${identity}`);
    identities.add(identity);
    if (!validDate(entry.lastReviewed)) errors.push(`${identity} has an invalid lastReviewed date.`);
    if (!validDate(entry.reviewDue)) errors.push(`${identity} has an invalid reviewDue date.`);
    if (entry.reviewDue < entry.lastReviewed) errors.push(`${identity} reviewDue precedes lastReviewed.`);
    for (const selector of new Set([entry.id, entry.slug, ...(entry.aliases ?? [])])) {
      if (aliases[kind].has(selector) && aliases[kind].get(selector) !== identity) errors.push(`Duplicate ${kind} selector: ${selector}`);
      aliases[kind].set(selector, identity);
    }
    try {
      const value = await readFile(resolve(root, entry.source), "utf8");
      const h1s = value.match(/^#\s+/gm) ?? [];
      if (h1s.length !== 1) errors.push(`${entry.source} must contain exactly one H1; found ${h1s.length}.`);
      if (/\uFFFD|Ã|â(?:€|†)/.test(value)) errors.push(`${entry.source} contains encoding artifacts.`);
      if (/CHECKLIST\.md|RESULTS_TEMPLATE\.md|SECURITY_CHECKLIST\.md|ENGINEERING_REFERENCE\.md|security-gate/.test(value)) errors.push(`${entry.source} contains a legacy path reference.`);
      if (/Files in this folder|this same folder|RESULTS_\d{4}-\d{2}-\d{2}|Reference (?:checklist|list) only/.test(value)) errors.push(`${entry.source} contains legacy folder-oriented instructions.`);
      const prefix = kind === "documentation" ? "DOC" : kind === "security" ? "SEC" : "ENG";
      const ids = value.match(new RegExp(`\\b${prefix}-${entry.id}-\\d{2}\\b`, "g")) ?? [];
      if (!ids.length) errors.push(`${entry.source} has no stable ${prefix}-${entry.id}-NN identifiers.`);
      for (const id of ids) {
        if (controlIds.has(id)) errors.push(`Duplicate control identifier: ${id}`);
        controlIds.add(id);
      }
      const generated = resolve(root, "skills/manage-project-quality/references", `${kind}-${basename(entry.source)}`);
      expectedGenerated.add(basename(generated));
      try {
        if (await readFile(generated, "utf8") !== value) errors.push(`Generated skill reference is stale: ${relative(root, generated)}`);
      } catch { errors.push(`Missing generated skill reference: ${relative(root, generated)}`); }
    } catch { errors.push(`Missing source: ${entry.source}`); }
  }
  const fullSource = resolve(root, `content/${kind}/full-reference.md`);
  const fullGenerated = resolve(root, `skills/manage-project-quality/references/${kind}-full-reference.md`);
  expectedGenerated.add(basename(fullGenerated));
  try {
    if (await readFile(fullSource, "utf8") !== await readFile(fullGenerated, "utf8")) errors.push(`Generated ${kind} full reference is stale.`);
  } catch { errors.push(`Missing ${kind} full reference or generated copy.`); }
}

for (const name of await readdir(resolve(root, "skills/manage-project-quality/references"))) {
  if (/^(?:documentation|security|engineering)-(?:\d{2}-.+|full-reference)\.md$/.test(name) && !expectedGenerated.has(name)) errors.push(`Unexpected generated skill reference: ${name}`);
}

if (catalog.documentation.length !== 7) errors.push(`Expected 7 documentation areas; found ${catalog.documentation.length}.`);
if (catalog.security.length !== 12) errors.push(`Expected 12 security phases; found ${catalog.security.length}.`);
if (catalog.engineering.length !== 14) errors.push(`Expected 14 engineering topics; found ${catalog.engineering.length}.`);
if (!Number(metadata.engines?.node?.match(/\d+/)?.[0]) || Number(metadata.engines.node.match(/\d+/)[0]) < 22) errors.push("Node.js engine must require 22 or newer.");
for (const directory of metadata.files ?? []) {
  try { await access(resolve(root, directory)); }
  catch { errors.push(`package.json files entry does not exist: ${directory}`); }
}

const site = await readFile(resolve(root, "site/index.html"), "utf8");
const ids = [...site.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
for (const id of new Set(duplicateIds)) errors.push(`Duplicate website id: ${id}`);
for (const [, anchor] of site.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(anchor)) errors.push(`Broken website anchor: #${anchor}`);

if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Validated ${identities.size} catalog entries, package paths, and website anchors.`);
