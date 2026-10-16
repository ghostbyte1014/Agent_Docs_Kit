# Old-version compatibility fixtures

Each directory is the output of a real released version of this package, run against an empty directory. The current CLI is tested against them so an upgrade cannot break a project that was initialized by an earlier version.

## How these were produced

Generated on 2026-10-16 from the released source at each version's Git tag, not from the npm registry, so the trees are reproducible offline:

```bash
for v in 5.1.0 6.0.0 6.1.0; do
  git worktree add --detach /tmp/wt/$v "v$v"
  d="tests/fixtures/compat/$v"
  mkdir -p "$d"
  node /tmp/wt/$v/bin/agent-docs.mjs setup --cwd "$d"
  for fmt in text markdown json; do
    node /tmp/wt/$v/bin/agent-docs.mjs audit documentation --report --format "$fmt" --cwd "$d"
  done
  node /tmp/wt/$v/bin/agent-docs.mjs security worksheet api-layer --cwd "$d"
  node /tmp/wt/$v/bin/agent-docs.mjs engineering worksheet testing-types --cwd "$d"
done
```

Each tree therefore holds that version's configuration, its starter documents, one saved audit report in each supported format, one security worksheet, and one engineering worksheet.

The report and worksheet filenames carry the generation date (2026-10-16). That date is part of the fixture and is never rewritten; `tests/compat.test.mjs` does not depend on the date being current.

## What each version actually produced

| Version | Notable differences |
|---|---|
| 5.1.0 | No root `AGENTS.md`: `setup` did not create one before 6.0.0. No `docs/05-operations/agents/` tree. |
| 6.0.0 | Adds `AGENTS.md`. Worksheet creation now requires an initialized workspace. No governance switches or change-record guide. |
| 6.1.0 | Adds the governance switches to `AGENTS.md` and the `docs/05-operations/agents/` guides, including the change-record template. |

All three wrote `schemaVersion: 2` and none wrote the `timezone`, `attribution`, or `agents` keys that 6.2.0 added. That is the point: those keys are optional with defaults, so no migration step exists.

## Expected results under the current CLI

Recorded in `tests/compat.test.mjs`:

- `next` reports **stage 3** for every fixture, because the starter documents still hold their generated prose. The shared starter-text detector recognizes that prose even though these versions wrote no `agent-docs:starter` marker.
- `audit documentation --strict` **exits 1** for every fixture, with three `starter-text` findings. Before 6.2.0 these scaffolds passed, which is the behavior change the release corrects.
- `audit documentation` without `--strict` **exits 0**, per the documented exit-code contract.
- No fixture produces an `agent-pointer` check, because none configured an agent.
- The saved audit reports from these versions remain readable in all three formats and are never promoted into a pass that the current rules would not grant.

## Maintaining these fixtures

Do not edit the generated trees by hand. If a future release needs a new fixture, add a directory for that version using the commands above and record its expected results in the table in `tests/compat.test.mjs`. Leave existing fixtures unchanged: they are historical evidence of what shipped.
