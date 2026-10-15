# Content maintenance

The files under `content/` are canonical. Run `npm run build` after changing them so the installable skill receives the same progressive references.

Review security guidance at least quarterly and after material changes to major standards, threat models, supported platforms, or tooling. Record the source and review date in the changed content or pull request. Verify external claims against primary sources.

Review engineering topics when supported runtimes, architectural assumptions, or operational scale change. Keep recommendations contextual and avoid presenting preferences as universal rules.

The catalog records `lastReviewed` and `reviewDue`. The scheduled health workflow fails after the due date; extending the date requires an actual content review.

Before release, run `npm run release:check`. Validation checks selectors, source files, duplicate headings, legacy references, encoding, package paths, templates, and website anchors. The smoke test installs the actual tarball into a clean temporary consumer. Human review is still required for technical accuracy and external-link freshness.

For every material package change, assess documentation impact before completion. Update only affected public guides, website copy, generated consumer guidance, and local project records. If no document changes, record why. Run the strict documentation audit after updates. Security and engineering worksheets remain separate point-in-time reviews and are not refreshed merely because documentation changed.

The ignored `MONTHLY_MAINTENANCE_AI.md` file is the maintainer's reusable AI runbook. It checks runtime support, dependencies, actions, dates, links, registry/tag/release alignment, and rotates one security phase plus one engineering topic each month.
