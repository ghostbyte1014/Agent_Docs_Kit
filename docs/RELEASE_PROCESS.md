# Release process

1. Update canonical content and run `npm run build` to refresh progressive skill references and the site.
2. Run `npm test`, `npm run validate`, and `npm pack --dry-run`.
3. Confirm the package archive contains no credentials, local reports, nested repositories, or generated consumer data.
4. Update the version with `npm version patch`, `minor`, or `major` according to compatibility.
5. Push the commit and tag, then create the matching GitHub release.
6. Let `.github/workflows/publish-npm.yml` publish through npm trusted publishing.
7. Verify `npx --yes @ghostbyte/agent-docs-kit@<version> --help` from a clean directory.

The first publish is manual because the npm package must exist before its trusted publisher can be configured.
