# Documentation governance

## Purpose

Documentation governance keeps project intent, implementation facts, decisions, and operating knowledge findable and current. It reduces context loss for humans and agents. It does not, by itself, prevent repository mutation.

## Recommended project layout

```text
.agent-docs/
  config.json
docs/
  README.md
  01-system/
  02-project/
  03-development/
    audits/
    engineering-reviews/
  04-testing/
    security-audits/
    evidence/
  05-operations/
  06-future-enhancements/
  archive/
```

Keep the layout proportional to the project. Do not create empty documents merely to satisfy a tree. Every index must describe what belongs beneath it and identify authoritative documents.

## Audit sequence

1. Locate local instructions and the documentation index.
2. Compare claimed behavior with code, configuration, tests, and deployment files.
3. Find broken links, duplicate authorities, stale dates, unresolved placeholders, and undocumented operational dependencies.
4. Classify each document as `Current`, `Needs update`, `Reference`, or `Archived`.
5. Propose the smallest repair that restores a single clear source of truth.

## Change records

Record what changed, why it changed, files affected, validation performed, and approval when required by the project. Prefer commit-linked records. Treat a “change freeze” as a declared collaboration policy unless a technical hook or CI rule actually enforces it.
