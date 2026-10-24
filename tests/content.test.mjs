import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { loadCatalog } from "../src/core/catalog.mjs";
import { resolveFromPackage } from "../src/core/paths.mjs";
import { reviewGuideErrors } from "../scripts/review-guide-validation.mjs";

test("catalog exposes all migrated review areas", async () => {
  const catalog = await loadCatalog();
  assert.equal(catalog.documentation.length, 7);
  assert.equal(catalog.security.length, 13);
  assert.equal(catalog.engineering.length, 18);
  for (const entry of [...catalog.documentation, ...catalog.security, ...catalog.engineering]) {
    await access(resolveFromPackage(entry.source));
    const value = await readFile(resolveFromPackage(entry.source), "utf8");
    assert.match(value, /^# /);
    assert.equal((value.match(/^#\s+/gm) ?? []).length, 1);
  }
});

test("the public review guide stays aligned with every security and engineering catalog entry", async () => {
  const catalog = await loadCatalog();
  const guide = await readFile(resolveFromPackage("docs/REVIEW_GUIDE.md"), "utf8");
  assert.deepEqual(reviewGuideErrors(guide, catalog), []);

  const entry = catalog.security[0];
  const marker = `| ${entry.id} ${entry.title} | \`${entry.slug}\` |`;
  assert.match(reviewGuideErrors(guide.replace(marker, "| missing entry |"), catalog).join("\n"), /exactly once; found 0/);
  assert.match(reviewGuideErrors(guide.replace(marker, `${marker}\n${marker}`), catalog).join("\n"), /exactly once; found 2/);
});

test("every npm publication path requires a commit on main", async () => {
  const workflow = await readFile(resolveFromPackage(".github/workflows/publish-npm.yml"), "utf8");
  assert.match(workflow, /- name: Verify release source is on main\n\s+shell: bash\n\s+run: \|\n\s+git merge-base --is-ancestor "\$GITHUB_SHA" origin\/main/);
  assert.doesNotMatch(workflow, /- name: Verify release source is on main\n\s+if:/);
});
