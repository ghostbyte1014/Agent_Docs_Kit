# Release process

Published npm versions are immutable. A matching version-tag push can publish a new version, but it cannot replace the contents of an existing version.

## Reset release line

The maintained line restarts at `1.3.7` after the earlier `4.0.0` through `6.2.1` releases advanced before the public contract stabilized. npm accepts a previously unused lower version, but SemVer clients treat it as older than 6.x. Existing 6.x users must opt into `1.3.7` explicitly; they will not receive it through a normal upgrade range.

The stable publish workflow maps a plain version to `latest`. Version `1.3.7` is published under that tag; the `1.3.8` candidate will replace it only after the reviewed release commit is on `main` and the matching tag is pushed. Do not represent the reset as an automatic upgrade for existing 6.x consumers.

1. Update canonical content and run `npm run build` to refresh progressive skill references and the site.
2. Set the intended release version on the release branch with `npm version <version> --no-git-tag-version`. This updates `package.json` and `package-lock.json` without creating a premature commit or tag.
3. Update the changelog, migration guidance, release-history ledger, and any public examples that pin a reviewed version. Do not mark the candidate as published before registry evidence exists.
4. Run `npm run release:check`. This includes tests, validation, the retired-version policy, review dates, builds, a clean tarball installation, and `npm audit`.
5. Confirm the package archive contains no credentials, local reports, nested repositories, or generated consumer data. `npm pack --dry-run --json` must show only the approved public files under `docs/` listed in `scripts/public-docs.mjs`, and every `main`, `bin`, and `exports` target must exist in the archive.
6. Commit and push the release branch, open a pull request, and require the configured CI matrix to pass before merge.
7. After the reviewed release commit is on `main`, create and push the matching `v<version>` tag on that exact commit. A matching `v*` tag on `main` runs `.github/workflows/publish-npm.yml`, verifies the version and ancestry, and publishes through npm trusted publishing.
8. Let the workflow create the matching GitHub Release. npm may temporarily show the new version as `Validating`; wait for automated review to finish rather than reusing the tag or publishing again.
9. After npm marks the version Published and moves `latest`, verify `npx --yes @ghostbyte/agent-docs-kit@<version> --help` from a clean directory outside this package's source repository.

```bash
git switch -c release/v1.3.8
npm version 1.3.8 --no-git-tag-version
node scripts/sync-version.mjs          # rewrites every pinned version from package.json
npm ci
npm run release:check
git add -A
git commit -m "release: prepare v1.3.8"
git push -u origin release/v1.3.8

# After the pull request is approved, CI passes, and the merge commit is on main:
git switch main
git pull --ff-only
git tag v1.3.8
git push origin v1.3.8
```

On Windows PowerShell, call `npm.cmd` and `npx.cmd` if the execution policy blocks `npm.ps1`.

## One source for the version number

`package.json` `version` is the only place a release version is authored.

The historical 4.x, 5.x, and 6.x lines are retired. The reset line may progress through 1.x, 2.x, and 3.x; its next major after 3.x is 7.0.0. See [`RELEASE_HISTORY.md`](RELEASE_HISTORY.md), and run `npm run release:version-policy` before committing a version change.

- `node scripts/sync-version.mjs` rewrites the pinned version in `README.md` and both release documents.
- `site/index.html` stores the placeholder `__AGENT_DOCS_KIT_VERSION__`; `scripts/build-site.mjs` substitutes the real version at build time, so the page source cannot drift.
- `node scripts/sync-version.mjs --check` fails when any pin, including `package-lock.json`, disagrees. `npm run release:check` runs it, and a test asserts the same agreement.

Run the sync immediately after `npm version`, before `release:check`. The `version` npm lifecycle script also invokes it, but verify the rewrite landed rather than assuming the hook fired.

## Choose the dist-tag

The workflow derives the dist-tag from the version in `package.json`: a plain version publishes to `latest`, and a prerelease version such as `<version>-beta.1` publishes to `beta`. `workflow_dispatch` accepts an explicit `dist_tag` input, but it is subject to the same requirement that the selected commit is already on `main`.

Publishing straight to `latest` is the owner's decision. It is the shorter path, and it means the first execution of the publish workflow lands on the tag every consumer installs. Before tagging a release that goes directly to `latest`, confirm all of the following:

- The full CI matrix passed on the release commit.
- `npm run release:check` passed locally, including the packed-installation smoke test.
- The rollback procedure below is understood, because a published version can never be replaced.
- The site and npm will agree: the built site pins the new version in its install commands, so a merge that deploys the site before the version exists on npm leaves visitors with install instructions that return a 404. Merge and tag close together.

The `beta` route below stays available and is worth using for a large or risky change, because it lets testers confirm a build before `@latest` moves.

### Optional: publish to the beta tag first

1. Publish under the `beta` dist-tag. The workflow derives the dist-tag from the version in `package.json`: a prerelease version such as `<version>-beta.1` publishes to `beta`, and a plain `<version>` publishes to `latest`. `workflow_dispatch` accepts an explicit `dist_tag` input and rejects a selected commit that is not already on `main`.

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

3. Promote after the agent-behavior checks and the post-publish smoke test pass:

```bash
npm dist-tag add @ghostbyte/agent-docs-kit@1.3.8 latest
npm dist-tag ls @ghostbyte/agent-docs-kit
```

## Verify provenance after publishing

`docs/SECURITY_MODEL.md` states that provenance is used when configured. Confirm it on each release rather than assuming it:

```bash
# In a throwaway project that installed the published version:
npm audit signatures
```

The npm package page must also show the provenance badge for the exact version. Record the result as release evidence. Keep 2FA on the npm account, branch protection on `main`, and OIDC trusted publishing instead of a long-lived token.

Protect the `v*` tag namespace against deletion and force-updates in the Git host. Do not recreate a missing historical tag unless the exact original release commit has been established from trustworthy evidence.

## Post-publish smoke test

The `smoke` job in `.github/workflows/publish-npm.yml` runs after publication on a clean runner: it installs the exact published version from the registry and runs `--version`, `doctor`, `setup --dry-run`, `setup`, and `audit documentation` in a temporary directory. It retries for several minutes because a freshly published version takes time to propagate and may sit in npm's automated validation.

## Freeze rule for a prerelease window

While a release sits under the `beta` dist-tag and has not been promoted:

- Accept bug fixes only, for about two weeks. No new commands, no new options, and no changes to generated text.
- No major version during the window. A breaking change needs a deprecation cycle first, as [`VERSIONING_AND_UPGRADES.md`](VERSIONING_AND_UPGRADES.md) describes.
- Triage tester feedback into "fix now" (correctness, data loss, safety) and "after promotion" (everything else).
- Promote to `@latest` only when the agent-behavior scenarios in [`TESTING_GUIDE.md`](TESTING_GUIDE.md) and the post-publish smoke test both pass on the prerelease build. This applies to the prerelease route; a release published directly to `latest` has no promotion step, so its verification happens before the tag.

Generated text is part of the contract because it changes what AI agents do, so a wording change during the freeze is a release decision, not a cleanup.

## If a release is bad

Published versions cannot be overwritten or re-uploaded.

1. Deprecate the bad version with a reason users will see on install:

```bash
npm deprecate @ghostbyte/agent-docs-kit@1.3.8 "Superseded: <reason>. Install @latest."
```

2. If the bad version holds `latest`, move the tag back to the last good version immediately. This is the primary safety net for a release published directly to `latest`:

```bash
npm dist-tag add @ghostbyte/agent-docs-kit@<last-good-version> latest
npm dist-tag ls @ghostbyte/agent-docs-kit
```

   Moving `latest` does not unpublish the bad version; it stops new installs from resolving to it.
3. Publish a corrective patch version. Never reuse the bad version number.
4. Record what happened in the changelog and in a dated evidence record.

Use a patch version for a backward-compatible fix, a minor version for a backward-compatible feature, and a major version for a breaking change. The workflow enforces agreement between `package.json` and the pushed tag, then creates the corresponding GitHub Release after publication.

The first release was published manually because the package had to exist before its trusted publisher could be configured. If a pushed version already exists, the workflow validates the project and safely skips publication; increment the version before pushing package changes that should reach npm.

When validating local source from this repository, run `node .\bin\agent-docs.mjs`. An `npx` invocation from the package's own root can be affected by npm self-resolution because the root package does not link its own executable into `node_modules/.bin`; this does not represent consumer behavior.
