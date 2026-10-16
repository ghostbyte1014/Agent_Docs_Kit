// Pinned-version rewrite rules, kept side-effect free so they can be unit
// tested across release and prerelease versions.
//
// Matching the prerelease suffix is what keeps a rewrite idempotent. Without
// it, a second run over an already-synced prerelease pin appended the suffix
// again and produced something like 6.2.1-beta.1-beta.1, which corrupted the
// pins and made `sync-version.mjs --check` fail while reporting a mismatch.
export const semverPattern = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+(?:\.[0-9A-Za-z.]+)*)?`;

export function versionRules(version, packageName) {
  const name = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [
    ["package pin", new RegExp(`(${name}@)${semverPattern}`, "g"), `$1${version}`],
    ["bare version pin in backticks", new RegExp("(`@)" + semverPattern + "(`)", "g"), `$1${version}$2`],
    ["npm version command", new RegExp(`(npm version )${semverPattern}`, "g"), `$1${version}`],
    ["release branch", new RegExp(`(release/v)${semverPattern}`, "g"), `$1${version}`],
    // Anchored to the commands that actually name a release tag. A bare
    // `vX.Y.Z` in prose is deliberately not synced: documentation sometimes
    // contrasts two different versions on purpose, and rewriting both would
    // destroy the point. Use <version> placeholders in prose instead.
    ["release tag", new RegExp("(git tag v|git push origin v|release: prepare v)" + semverPattern, "g"), `$1${version}`]
  ];
}

// Which rules each synced document opts into.
export const versionTargets = Object.freeze([
  { path: "README.md", rules: ["package pin", "bare version pin in backticks"] },
  { path: "docs/TESTING_GUIDE.md", rules: ["package pin", "bare version pin in backticks"] },
  { path: "docs/RELEASE_PROCESS.md", rules: ["package pin", "bare version pin in backticks", "npm version command", "release branch", "release tag"] },
  { path: "docs/GITHUB_AND_NPM_SETUP.md", rules: ["package pin", "bare version pin in backticks", "npm version command", "release branch", "release tag"] }
]);

export function applyVersionRules(text, version, packageName, allowed) {
  return versionRules(version, packageName).reduce(
    (value, [name, pattern, replacement]) => (allowed && !allowed.includes(name) ? value : value.replace(pattern, replacement)),
    text
  );
}
