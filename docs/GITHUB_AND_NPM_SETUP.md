# GitHub and npm setup

These commands assume the GitHub owner is `ghostbyte1014`, the repository is `Agent_Docs_Kit`, and the npm package is owned by the separate npm account `ghostbyte` at `@ghostbyte/agent-docs-kit`.

## 1. Validate locally

Commands in this document are portable. On Windows PowerShell, call `npm.cmd` and `npx.cmd` instead if the execution policy blocks `npm.ps1`.

```bash
npm install
npm test
npm run validate
npm run build
npm pack --dry-run
```

## 2. Create and push the GitHub repository

With GitHub CLI:

```bash
git add .
git commit -m "feat: unify Agent Docs and Quality Kit"
gh auth login
gh repo create ghostbyte1014/Agent_Docs_Kit --public --source . --remote origin --push
```

If `origin` already exists, inspect it before changing anything:

```bash
git remote -v
git push -u origin main
```

The web alternative is to create an empty repository on GitHub, then run:

```bash
git remote add origin https://github.com/ghostbyte1014/Agent_Docs_Kit.git
git branch -M main
git push -u origin main
```

Do not add a second README, license, or `.gitignore` when creating the remote because this local repository already has them.

## 3. Configure the canonical site and mirror

The canonical public URL is `https://agent-docs-kit.ghostbyte1014.workers.dev/`. `package.json`, the CLI `website` command, README links, and HTML canonical metadata must use that URL.

`wrangler.jsonc` publishes `build/site` as Cloudflare Workers static assets. Build and validate locally before an authorized owner deploys it:

```bash
npm run validate
npm run build
npx wrangler deploy
```

Deployment is an owner action. Do not run it during ordinary validation or as an unapproved side effect of a package release.

### GitHub Pages mirror

When GitHub Pages is enabled, the `pages.yml` workflow builds the same `build/site` artifact and can deploy an optional mirror at `https://ghostbyte1014.github.io/Agent_Docs_Kit/`. The generated pages point canonical metadata back to the Cloudflare URL. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the source. Then run the workflow or push to `main`.

With GitHub CLI/API after the first push:

```bash
gh api --method POST repos/ghostbyte1014/Agent_Docs_Kit/pages -f build_type=workflow
gh workflow run pages.yml
gh run watch
```

If Pages already exists with another source, use:

```bash
gh api --method PUT repos/ghostbyte1014/Agent_Docs_Kit/pages -f build_type=workflow
```

## 4. Prepare npm

Sign in to the npm account named `ghostbyte`, which owns the `@ghostbyte` personal scope. Confirm package access and authentication:

```bash
npm view @ghostbyte/agent-docs-kit name version
npm login
npm whoami
```

An npm `E404` from `view` usually means no public package currently exists under that exact name; it does not prove that the signed-in account owns the scope.

## 5. Prepare a release

Review the archive before opening the release pull request:

```bash
npm pack --dry-run
```

Do not publish manually during ordinary releases. The trusted-publisher workflow performs publication only after the reviewed commit is on `main` and its matching version tag is pushed.

For an existing package, set a new immutable version on the release branch without creating a tag before review:

```bash
npm version <version> --no-git-tag-version
```

Commit that version with the release changes and merge it through the normal pull-request checks. After the verified release commit is on `main`, create and push the matching `v<version>` tag. Test the published version from a disposable directory:

```bash
npx --yes @ghostbyte/agent-docs-kit@latest --help
npx --yes @ghostbyte/agent-docs-kit@latest setup --dry-run
```

Do not use this package's own repository as the consumer test directory. npm can resolve the root package as itself without generating its executable shim. Inside the source repository, test local code with `node .\bin\agent-docs.mjs`; test the registry package from a different project or temporary directory.

## 6. Configure trusted publishing

In npm package settings, add a trusted publisher for GitHub Actions with these values:

| Field | Value |
|---|---|
| Organization or user | `ghostbyte1014` |
| Repository | `Agent_Docs_Kit` |
| Workflow filename | `publish-npm.yml` |
| Environment name | Leave blank |
| Allowed actions | Allow direct `npm publish` |

No npm token or GitHub environment is required. The workflow is restricted to this GitHub repository and workflow through OIDC.

After that, commit the versioned changes on a release branch and merge them only after CI passes. Push the matching version tag from the verified commit on `main`. The tag workflow verifies that the tag and `package.json` agree, runs the full release gate, publishes through npm trusted publishing, and creates the matching GitHub Release. A normal push to `main` updates source and Pages but does not publish npm. No long-lived `NPM_TOKEN` is required.

```bash
npm version 6.2.1 --no-git-tag-version
git add package.json package-lock.json CHANGELOG.md
git commit -m "release: prepare v6.2.1"
git push -u origin release/v6.2.1
```

Use `npm version minor` for a backward-compatible feature and `npm version major` for a breaking change. Never reuse an existing npm version: registry versions are immutable. [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md) records the dist-tag, provenance, post-publish, and bad-release procedures.

After trusted publishing, npm may place the version in automated validation before making it installable. During that window, `npm view <package>` can still report the prior `latest` version and explicit `npx @<version>` can fail. Wait until npm shows the version as Published, then verify the exact version and `latest`; do not create another tag merely to bypass validation.
