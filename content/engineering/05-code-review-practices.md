# Code Review Practices

# Engineering Topic 5: Code Review Practices

**When to run this:** Ongoing — use this to periodically check whether the team's actual review habits match its stated process, not just once.

**Goal of this pass:** Keep review effective and fast rather than either a rubber stamp or a bottleneck.

## Files in this folder

| File | Purpose |
|---|---|
| `CHECKLIST.md` | The reference list of concepts for this topic — what each one is, why it matters, and the self-check question to ask. Doesn't get filled in; copy `RESULTS_TEMPLATE.md` to record a real pass. |
| `RESULTS_TEMPLATE.md` | Fillable version of the same list, with a Status column and notes. Copy this file per pass (e.g. `RESULTS_2026-08-29.md`) so history isn't overwritten. |

Full source list lives in `../ENGINEERING_REFERENCE.md`. Unlike
`../../security-gate/phases/`, this is knowledge/practice review, not pass/fail security
testing — there's no severity rating, and "Fail" isn't the right framing.
Use the Status options in `RESULTS_TEMPLATE.md` instead: Applied, Partial,
Should adopt, or Not applicable.

## Wrap-up

- This isn't a gate — nothing here blocks a release the way
  Critical/High security items in `../../security-gate/phases/` do.
- Total concepts in this topic: 10
- Useful as an onboarding read-through, a periodic self-audit, or context
  to hand an agent before it reviews related code.

---

# Concepts — Topic 5: Code Review Practices

Reference list only — no status column. Use `RESULTS_TEMPLATE.md` in
this same folder to actually record a pass.

| # | Concept | Why it matters | Self-check |
|---|---|---|---|
| 1 | Small PRs | Large PRs get worse review (reviewers skim or rubber-stamp) and take longer to land. | Is there a rough size norm for PRs, and are oversized PRs flagged for splitting? |
| 2 | Clear description | A reviewer without context re-derives the 'why' from the diff alone, which is slower and more error-prone than being told. | Does every PR description explain what changed and why, not just restate the diff? |
| 3 | Constructive feedback | Feedback that reads as personal or vague either gets ignored or damages the reviewer/author relationship over time. | Is feedback phrased around the code/tradeoff rather than the author, with a suggested direction, not just a criticism? |
| 4 | Nitpick vs blocker | Without this distinction, minor style opinions can block a merge as if they were correctness issues. | Are non-blocking comments explicitly labeled (e.g. 'nit:') so the author knows what's optional vs required? |
| 5 | Fast turnaround | A PR that sits for days loses context for both author and reviewer and blocks downstream work. | Is there a target turnaround time for first review, and is it generally being met? |
| 6 | Automated checks first | Humans shouldn't spend review time on things a linter/CI can catch automatically. | Do lint, format, and test checks run and pass before a human reviews the PR? |
| 7 | Context before code | Reviewing code without understanding the surrounding system leads to reviews that miss integration-level problems. | Does the reviewer understand the relevant part of the system before diving into line-by-line comments? |
| 8 | Approve vs request changes | Conflating 'I have a question' with 'this is blocked' slows things down or sends mixed signals. | Is the approve/comment/request-changes distinction used deliberately, not defaulted to whichever is habit? |
| 9 | Self-review first | Authors catch a meaningful fraction of their own issues by re-reading the diff before asking someone else to. | Does the author review their own diff (and leave self-notes where useful) before requesting review? |
| 10 | Learning from reviews | Review comments that aren't retained just repeat themselves across future PRs instead of becoming shared knowledge. | Do recurring review comments get turned into a lint rule, style-guide entry, or documented convention? |
