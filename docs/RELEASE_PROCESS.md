# Release process

Published npm versions are immutable. A matching version-tag push can publish a new version, but it cannot replace the contents of an existing version.

1. Update canonical content and run `npm run build` to refresh progressive skill references and the site.
2. Set the intended release version on the release branch with `npm version <version> --no-git-tag-version`. This updates `package.json` and `package-lock.json` without creating a premature commit or tag.
3. Update the changelog, migration guidance, and any public examples that pin a reviewed version.
4. Run `npm run release:check`. This includes tests, validation, review dates, builds, a clean tarball installation, and `npm audit`.
5. Confirm the package archive contains no credentials, local reports, nested repositories, or generated consumer data. `npm pack --dry-run --json` must show only the seven approved public files under `docs/`, and every `main`, `bin`, and `exports` target must exist in the archive.
6. Commit and push the release branch, open a pull request, and require the configured CI matrix to pass before merge.
7. After the reviewed release commit is on `main`, create and push the matching `v<version>` tag on that exact commit. A matching `v*` tag on `main` runs `.github/workflows/publish-npm.yml`, verifies the version and ancestry, and publishes through npm trusted publishing.
8. Let the workflow create the matching GitHub Release. npm may temporarily show the new version as `Validating`; wait for automated review to finish rather than reusing the tag or publishing again.
9. After npm marks the version Published and moves `latest`, verify `npx --yes @ghostbyte/agent-docs-kit@<version> --help` from a clean directory outside this package's source repository.

```powershell
npm.cmd version 6.0.0 --no-git-tag-version
git add -A
git commit -m "release: prepare v6.0.0"
git push -u origin release/v6.0.0

# After the pull request is approved, CI passes, and the merge commit is on main:
git switch main
git pull --ff-only
git tag v6.0.0
git push origin v6.0.0
```

Use a patch version for a backward-compatible fix, a minor version for a backward-compatible feature, and a major version for a breaking change. The workflow enforces agreement between `package.json` and the pushed tag, then creates the corresponding GitHub Release after publication.

The first release was published manually because the package had to exist before its trusted publisher could be configured. If a pushed version already exists, the workflow validates the project and safely skips publication; increment the version before pushing package changes that should reach npm.

When validating local source from this repository, run `node .\bin\agent-docs.mjs`. An `npx` invocation from the package's own root can be affected by npm self-resolution because the root package does not link its own executable into `node_modules/.bin`; this does not represent consumer behavior.
