# Release process

Published npm versions are immutable. A matching version-tag push can publish a new version, but it cannot replace the contents of an existing version.

1. Update canonical content and run `npm run build` to refresh progressive skill references and the site.
2. Set the intended release version on the release branch with `npm version <version> --no-git-tag-version`. This updates `package.json` and `package-lock.json` without creating a premature commit or tag.
3. Update the changelog, migration guidance, and any public examples that pin a reviewed version.
4. Run `npm run release:check`. This includes tests, validation, review dates, builds, a clean tarball installation, and `npm audit`.
5. Confirm the package archive contains no credentials, local reports, nested repositories, or generated consumer data. `npm pack --dry-run --json` must show only the approved public files under `docs/` listed in `scripts/public-docs.mjs`, and every `main`, `bin`, and `exports` target must exist in the archive.
6. Commit and push the release branch, open a pull request, and require the configured CI matrix to pass before merge.
7. After the reviewed release commit is on `main`, create and push the matching `v<version>` tag on that exact commit. A matching `v*` tag on `main` runs `.github/workflows/publish-npm.yml`, verifies the version and ancestry, and publishes through npm trusted publishing.
8. Let the workflow create the matching GitHub Release. npm may temporarily show the new version as `Validating`; wait for automated review to finish rather than reusing the tag or publishing again.
9. After npm marks the version Published and moves `latest`, verify `npx --yes @ghostbyte/agent-docs-kit@<version> --help` from a clean directory outside this package's source repository.

```bash
git switch -c release/v6.2.1
npm version 6.2.1 --no-git-tag-version
node scripts/sync-version.mjs          # rewrites every pinned version from package.json
npm ci
npm run release:check
git add -A
git commit -m "release: prepare v6.2.1"
git push -u origin release/v6.2.1

# After the pull request is approved, CI passes, and the merge commit is on main:
git switch main
git pull --ff-only
git tag v6.2.1
git push origin v6.2.1
```

On Windows PowerShell, call `npm.cmd` and `npx.cmd` if the execution policy blocks `npm.ps1`.

## One source for the version number

`package.json` `version` is the only place a release version is authored.

- `node scripts/sync-version.mjs` rewrites the pinned version in `README.md` and both release documents.
- `site/index.html` stores the placeholder `__AGENT_DOCS_KIT_VERSION__`; `scripts/build-site.mjs` substitutes the real version at build time, so the page source cannot drift.
- `node scripts/sync-version.mjs --check` fails when any pin, including `package-lock.json`, disagrees. `npm run release:check` runs it, and a test asserts the same agreement.

Run the sync immediately after `npm version`, before `release:check`. The `version` npm lifecycle script also invokes it, but verify the rewrite landed rather than assuming the hook fired.

## Publish to the beta tag first

A release reaches `@latest` only after testers confirm it.

1. Publish under the `beta` dist-tag. The workflow derives the dist-tag from the version in `package.json`: a prerelease version such as `<version>-beta.1` publishes to `beta`, and a plain `<version>` publishes to `latest`. `workflow_dispatch` accepts an explicit `dist_tag` input.

   The publish workflow requires the pushed tag to equal the version in `package.json`, so a prerelease is a real version bump, not just a differently named tag:

```bash
git switch -c release/v<version>-beta.1
npm version <version>-beta.1 --no-git-tag-version   # also runs sync-version
npm run release:check
git commit -am "release: prepare v<version>-beta.1"
# merge to main, then:
git tag v<version>-beta.1
git push origin v<version>-beta.1
```
2. Testers install the beta explicitly:

```bash
npm install --save-dev @ghostbyte/agent-docs-kit@beta
```

3. Promote only after the agent-behavior checks and the post-publish smoke test pass:

```bash
npm dist-tag add @ghostbyte/agent-docs-kit@6.2.1 latest
npm dist-tag ls @ghostbyte/agent-docs-kit
```

## Verify provenance after publishing

`docs/SECURITY_MODEL.md` states that provenance is used when configured. Confirm it on each release rather than assuming it:

```bash
# In a throwaway project that installed the published version:
npm audit signatures
```

The npm package page must also show the provenance badge for the exact version. Record the result as release evidence. Keep 2FA on the npm account, branch protection on `main`, and OIDC trusted publishing instead of a long-lived token.

## Post-publish smoke test

The `smoke` job in `.github/workflows/publish-npm.yml` runs after publication on a clean runner: it installs the exact published version from the registry and runs `--version`, `doctor`, `setup --dry-run`, `setup`, and `audit documentation` in a temporary directory. It retries for several minutes because a freshly published version takes time to propagate and may sit in npm's automated validation.

## Freeze rule for a prerelease window

While a release sits under the `beta` dist-tag and has not been promoted:

- Accept bug fixes only, for about two weeks. No new commands, no new options, and no changes to generated text.
- No major version during the window. A breaking change needs a deprecation cycle first, as [`COMPATIBILITY.md`](COMPATIBILITY.md) describes.
- Triage tester feedback into "fix now" (correctness, data loss, safety) and "after promotion" (everything else).
- Promote to `@latest` only when the agent-behavior scenarios in [`TESTING_GUIDE.md`](TESTING_GUIDE.md) and the post-publish smoke test both pass on the prerelease build.

Generated text is part of the contract because it changes what AI agents do, so a wording change during the freeze is a release decision, not a cleanup.

## If a release is bad

Published versions cannot be overwritten or re-uploaded.

1. Deprecate the bad version with a reason users will see on install:

```bash
npm deprecate @ghostbyte/agent-docs-kit@6.2.1 "Superseded: <reason>. Install @latest."
```

2. If the bad version holds `latest`, move the tag back to the last good version with `npm dist-tag add`.
3. Publish a corrective patch version. Never reuse the bad version number.
4. Record what happened in the changelog and in a dated evidence record.

Use a patch version for a backward-compatible fix, a minor version for a backward-compatible feature, and a major version for a breaking change. The workflow enforces agreement between `package.json` and the pushed tag, then creates the corresponding GitHub Release after publication.

The first release was published manually because the package had to exist before its trusted publisher could be configured. If a pushed version already exists, the workflow validates the project and safely skips publication; increment the version before pushing package changes that should reach npm.

When validating local source from this repository, run `node .\bin\agent-docs.mjs`. An `npx` invocation from the package's own root can be affected by npm self-resolution because the root package does not link its own executable into `node_modules/.bin`; this does not represent consumer behavior.
