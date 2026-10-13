# Release process

Published npm versions are immutable. A push can publish a new version, but it cannot replace the contents of an existing version.

1. Update canonical content and run `npm run build` to refresh progressive skill references and the site.
2. Run `npm test`, `npm run validate`, and `npm pack --dry-run`.
3. Confirm the package archive contains no credentials, local reports, nested repositories, or generated consumer data.
4. Commit the package changes locally.
5. Update the version with `npm version patch`, `minor`, or `major` according to compatibility.
6. Push the commit and tag. A push to `main` runs `.github/workflows/publish-npm.yml` and publishes the new version through npm trusted publishing.
7. Verify `npx --yes @ghostbyte/agent-docs-kit@<version> --help` from a clean directory.

```powershell
git add -A
git commit -m "feat: describe the update"
npm.cmd version patch
git push --follow-tags
```

Use `minor` for a backward-compatible feature and `major` for a breaking change. A GitHub Release is optional and does not control npm publication.

The first release was published manually because the package had to exist before its trusted publisher could be configured. If a pushed version already exists, the workflow validates the project and safely skips publication; increment the version before pushing package changes that should reach npm.
