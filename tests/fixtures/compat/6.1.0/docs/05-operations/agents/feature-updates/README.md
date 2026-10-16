# Feature updates and change records

This directory stores permanent change records generated during project evolution when **CHANGE RECORDS** is active in `AGENTS.md`.

## Purpose

Change records document what changed, why it changed, files touched, validation evidence, and approval metadata. They provide an immutable, chronological log of system changes.

## Naming convention

Each record is stored as a standalone Markdown file named:

`YYYY-MM-DD_HHMM_short-topic.md`

- Use 24-hour Philippine time (UTC+8) from the device clock.
- If multiple records are created within the same minute, append sequence counters: `HHMM-01`, `HHMM-02`.
- Never edit or delete historical records. A correction is recorded as a new entry.

## Record template

Copy the template below when creating a new change record:

```markdown
# Topic Title

- **Date:** YYYY-MM-DD HH:MM (Philippine time)
- **AI tool:** [AI Tool Name and model, or Manual]
- **Files changed:** `path/to/file1`, `path/to/file2`
- **Approved by:** [git config user.name and user.email]
- **Type:** [Fix | Polish | Feature | New feature (approved outside the documented flow)]

## Intent

Describe the rationale and goal for this change.

## Key changes

Summarize the specific modifications made across affected files.

## Validation evidence

List commands executed, test results, or manual verification steps confirming correctness.
```
