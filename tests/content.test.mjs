import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { loadCatalog } from "../src/core/catalog.mjs";
import { resolveFromPackage } from "../src/core/paths.mjs";

test("catalog exposes all migrated review areas", async () => {
  const catalog = await loadCatalog();
  assert.equal(catalog.security.length, 12);
  assert.equal(catalog.engineering.length, 9);
  for (const entry of [...catalog.security, ...catalog.engineering]) {
    await access(resolveFromPackage(entry.source));
    assert.match(await readFile(resolveFromPackage(entry.source), "utf8"), /^# /);
  }
});
