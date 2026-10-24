# Release history and reserved version lines

This ledger separates npm publication evidence, Git tags, and changelog-only versions. Those records are related, but they are not interchangeable: a Git tag does not prove that npm received a package, and an npm version does not prove that this checkout retains its original tag.

The observations below were verified on 2026-10-22 from the public npm version list, this repository's local Git tags, and `CHANGELOG.md`. Do not manufacture a missing tag merely to make the columns match. A historical tag may be created or repaired only after the exact original release commit is established from trustworthy evidence.

## Recorded versions

| Version | npm registry | Git tag in this repository | Repository record | Status |
|---|---|---|---|---|
| `0.0.0-stage` | Published | None | Registry-only staging artifact | Retired |
| `4.0.0` | Published | None | Registry-only release | Retired |
| `4.0.1` | Not published | `v4.0.1` | Git-tag-only release record | Retired |
| `4.0.2` | Published | `v4.0.2` | Registry and Git tag | Retired |
| `4.0.3` | Published | `v4.0.3` | Registry and Git tag | Retired |
| `5.0.0` | Published | `v5.0.0` | Registry and Git tag | Retired |
| `5.0.1` | Published | `v5.0.1` | Registry and Git tag | Retired |
| `5.1.0` | Published | `v5.1.0` | Registry and Git tag | Retired |
| `6.0.0` | Published | `v6.0.0` | Registry and Git tag | Retired |
| `6.1.0` | Published | `v6.1.0` | Registry and Git tag | Retired |
| `6.2.0` | Not published | None | Changelog-only version | Retired |
| `6.2.1` | Published | `v6.2.1` | Registry and Git tag | Retired |
| `1.3.7` | Published (`latest` verified 2026-10-22) | `v1.3.7` | Registry and Git tag | Current latest |

The maintained reset line begins at `1.3.7`. This source tree prepares `1.3.8`; that candidate is not recorded as published or tagged until the corresponding external evidence exists.

## Reserved-version policy

- Exact npm versions are immutable and must never be reused.
- Historical Git tags must not be deleted, moved, or recreated without verified commit evidence.
- The complete `4.x`, `5.x`, and `6.x` major lines are retired. Do not create new releases in those lines, even when a particular version number was never published.
- The maintained line may progress through 1.x, 2.x, and 3.x according to semantic versioning; the next major after 3.x is 7.0.0.
- `0.0.0-stage` is a historical registry artifact and must not be reused.

`npm run release:version-policy` enforces the local retired-line rule, verifies every expected historical tag that this repository currently retains, and checks this ledger for drift. The npm publish workflow separately queries the registry before publication because only the registry can prove whether an exact package version already exists.

## Maintenance

Update this ledger only from observable release evidence. Record npm, Git-tag, and changelog discrepancies rather than concealing them. When the current release advances, preserve the older entry and add its verified state; do not rewrite history to make the sequence appear continuous.

Repository administrators should protect the `v*` tag namespace against deletion and force-updates. That protection is an external Git-host setting and cannot be guaranteed by this Markdown file or the local validation script.
