# Content maintenance

The files under `content/` are canonical. Run `npm run build` after changing them so the installable skill receives the same progressive references.

Review security guidance at least quarterly and after material changes to major standards, threat models, supported platforms, or tooling. Record the source and review date in the changed content or pull request. Verify external claims against primary sources.

Review engineering topics when supported runtimes, architectural assumptions, or operational scale change. Keep recommendations contextual and avoid presenting preferences as universal rules.

`REVIEW_GUIDE.md` is the public summary of the security and engineering catalog. Review its affected row whenever a catalog title, selector, purpose, or evidence question changes. `npm run validate` confirms that every catalog title and selector appears exactly once in the guide; a human must still verify that each summary accurately represents the canonical content.

`RELEASE_HISTORY.md` records npm, Git-tag, and changelog evidence separately. Update it only when a release state is verified, preserve discrepancies instead of manufacturing missing tags, and run `npm run release:version-policy` whenever a version or historical tag changes.

The catalog records `lastReviewed` and `reviewDue`. The scheduled health workflow fails after the due date; extending the date requires an actual content review.

Before release, run `npm run release:check`. Validation checks selectors, source files, duplicate headings, legacy references, encoding, package paths, templates, and website anchors. The smoke test installs the actual tarball into a clean temporary consumer. Human review is still required for technical accuracy and external-link freshness.

For every material package change, assess documentation impact before completion. Update only affected public guides, website copy, generated consumer guidance, and local project records. If no document changes, record why. Run the strict documentation audit after updates. Security and engineering worksheets remain separate point-in-time reviews and are not refreshed merely because documentation changed.

The ignored `MONTHLY_MAINTENANCE_AI.md` file is the maintainer's reusable AI runbook. It checks runtime support, dependencies, actions, dates, links, registry/tag/release alignment, and rotates one security phase plus one engineering topic each month.
