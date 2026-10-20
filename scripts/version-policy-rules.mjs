export const retiredMajors = Object.freeze([4, 5, 6]);

export const historicalVersions = Object.freeze([
  { version: "0.0.0-stage", npm: "Published", gitTag: "None", record: "Registry-only staging artifact" },
  { version: "4.0.0", npm: "Published", gitTag: "None", record: "Registry-only release" },
  { version: "4.0.1", npm: "Not published", gitTag: "`v4.0.1`", record: "Git-tag-only release record" },
  { version: "4.0.2", npm: "Published", gitTag: "`v4.0.2`", record: "Registry and Git tag" },
  { version: "4.0.3", npm: "Published", gitTag: "`v4.0.3`", record: "Registry and Git tag" },
  { version: "5.0.0", npm: "Published", gitTag: "`v5.0.0`", record: "Registry and Git tag" },
  { version: "5.0.1", npm: "Published", gitTag: "`v5.0.1`", record: "Registry and Git tag" },
  { version: "5.1.0", npm: "Published", gitTag: "`v5.1.0`", record: "Registry and Git tag" },
  { version: "6.0.0", npm: "Published", gitTag: "`v6.0.0`", record: "Registry and Git tag" },
  { version: "6.1.0", npm: "Published", gitTag: "`v6.1.0`", record: "Registry and Git tag" },
  { version: "6.2.0", npm: "Not published", gitTag: "None", record: "Changelog-only version" },
  { version: "6.2.1", npm: "Published", gitTag: "`v6.2.1`", record: "Registry and Git tag" }
]);

export function historyRow(entry) {
  return `| \`${entry.version}\` | ${entry.npm} | ${entry.gitTag} | ${entry.record} | Retired |`;
}

export function versionPolicyErrors(version) {
  const errors = [];
  const match = String(version ?? "").match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u);
  if (!match) return [`package.json version '${version ?? ""}' is not a supported semantic version.`];
  const major = Number(match[1]);
  if (retiredMajors.includes(major)) {
    errors.push(`Version ${version} uses retired major line ${major}.x. After 3.x, the next permitted major is 7.0.0.`);
  }
  if (version === "0.0.0-stage") errors.push("Version 0.0.0-stage is a historical registry artifact and cannot be reused.");
  return errors;
}

export function releaseHistoryErrors(value) {
  const errors = [];
  for (const entry of historicalVersions) {
    const row = historyRow(entry);
    const count = value.split(row).length - 1;
    if (count !== 1) errors.push(`docs/RELEASE_HISTORY.md must contain '${row}' exactly once; found ${count}.`);
  }
  for (const major of retiredMajors) {
    if (!value.includes(`\`${major}.x\``)) errors.push(`docs/RELEASE_HISTORY.md must identify ${major}.x as a retired major line.`);
  }
  if (!value.includes("the next major after 3.x is 7.0.0")) {
    errors.push("docs/RELEASE_HISTORY.md must state that the next major after 3.x is 7.0.0.");
  }
  return errors;
}
