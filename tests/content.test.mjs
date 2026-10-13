import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { loadCatalog } from "../src/core/catalog.mjs";
import { resolveFromPackage } from "../src/core/paths.mjs";

test("catalog exposes all migrated review areas", async () => {
  const catalog = await loadCatalog();
  assert.equal(catalog.documentation.length, 7);
  assert.equal(catalog.security.length, 12);
  assert.equal(catalog.engineering.length, 14);
  for (const entry of [...catalog.documentation, ...catalog.security, ...catalog.engineering]) {
    await access(resolveFromPackage(entry.source));
    const value = await readFile(resolveFromPackage(entry.source), "utf8");
    assert.match(value, /^# /);
    assert.equal((value.match(/^#\s+/gm) ?? []).length, 1);
  }
});
