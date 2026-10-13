# GitHub and npm setup

These commands assume the GitHub owner is `ghostbyte1014`, the repository is `Agent_Docs_Kit`, and the npm package is owned by the separate npm account `ghostbyte` at `@ghostbyte/agent-docs-kit`.

## 1. Validate locally

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run validate
npm.cmd run build
npm.cmd pack --dry-run
```

## 2. Create and push the GitHub repository

With GitHub CLI:

```powershell
git add .
git commit -m "feat: unify Agent Docs and Quality Kit"
gh auth login
gh repo create ghostbyte1014/Agent_Docs_Kit --public --source . --remote origin --push
```

If `origin` already exists, inspect it before changing anything:

```powershell
git remote -v
git push -u origin main
```

The web alternative is to create an empty repository on GitHub, then run:

```powershell
git remote add origin https://github.com/ghostbyte1014/Agent_Docs_Kit.git
git branch -M main
git push -u origin main
```

Do not add a second README, license, or `.gitignore` when creating the remote because this local repository already has them.

## 3. Enable GitHub Pages

The `pages.yml` workflow builds `build/site` and deploys it. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the source. Then run the workflow or push to `main`.

With GitHub CLI/API after the first push:

```powershell
gh api --method POST repos/ghostbyte1014/Agent_Docs_Kit/pages -f build_type=workflow
gh workflow run pages.yml
gh run watch
```

If Pages already exists with another source, use:

```powershell
gh api --method PUT repos/ghostbyte1014/Agent_Docs_Kit/pages -f build_type=workflow
```

## 4. Prepare npm

Sign in to the npm account named `ghostbyte`, which owns the `@ghostbyte` personal scope. Confirm package access and authentication:

```powershell
npm.cmd view @ghostbyte/agent-docs-kit name version
npm.cmd login
npm.cmd whoami
```

An npm `E404` from `view` usually means no public package currently exists under that exact name; it does not prove that the signed-in account owns the scope.

## 5. Publish the first version

Review the archive before publishing:

```powershell
npm.cmd pack --dry-run
npm.cmd publish --access public
```

The first publication establishes the package. Test it from a disposable directory:

```powershell
npx --yes @ghostbyte/agent-docs-kit@latest --help
npx --yes @ghostbyte/agent-docs-kit@latest setup --dry-run
```

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

After that, commit your changes, increment the npm version, and push to `main`. The push automatically validates and publishes the new version. No long-lived `NPM_TOKEN` is required.

```powershell
npm.cmd version patch
git push --follow-tags
```

Use `npm.cmd version minor` for a backward-compatible feature and `npm.cmd version major` for a breaking change. Never reuse an existing npm version: registry versions are immutable. Use `npm deprecate` for a bad release and publish a corrected version.
