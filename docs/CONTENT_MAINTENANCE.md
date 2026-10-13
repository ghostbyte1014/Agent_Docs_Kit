# Content maintenance

The files under `content/` are canonical. Run `npm run build` after changing them so the installable skill receives the same progressive references.

Review security guidance at least quarterly and after material changes to major standards, threat models, supported platforms, or tooling. Record the source and review date in the changed content or pull request. Verify external claims against primary sources.

Review engineering topics when supported runtimes, architectural assumptions, or operational scale change. Keep recommendations contextual and avoid presenting preferences as universal rules.

Before release, run the content validator. It checks catalog/source consistency and common encoding corruption. A human review is still required for technical accuracy and link freshness.
