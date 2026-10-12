# Agent Docs Kit v3.2 — Existing Feature Evolution: documentation, auditing, and session control

**Created by:** ghostbyte1014
**For:** an AI coding agent (Claude Code, Codex, Gemini CLI, Cursor, Copilot, or any other) setting this up in a project, and the developer who owns that project.
**Origin:** adapted from ghostbyte1014's project process (October 1, 2026).
**Version:** v3.2 — **Transparent Governance** (compiled edition, October 12, 2026).
**Versioning:** Existing capabilities grouped retroactively into v1.x, v2.x, and v3.x so recipients can see the progression; these labels are not claims of independently published releases.
**Defaults:** `FREEZE: OFF`, `CHANGE RECORDS: ON`, Philippine time (UTC+8), Git identity from `git config` (not proof of approval).
**Purpose:** Provide a turnkey, transparent documentation, change-auditing, and session-governance foundation for AI-assisted coding projects—establishing clear scope boundaries, verifiable per-commit change records, a mandatory startup Session Gate, and human-in-the-loop developer approval before any project files are modified.

> **Purpose & Foundation:**
> This kit is a self-contained framework designed to give human developers full visibility and control when collaborating with AI coding agents (Claude Code, Codex, Gemini CLI, Cursor, Copilot, Antigravity, and others). It establishes:
> - **Structured Documentation:** A standardized `docs/` hierarchy with clear status labels (`Current`, `Reference`, `Needs update`, `Archived`) and an authoritative scope baseline.
> - **Verifiable Change Auditing:** Immutable, Philippine-time (UTC+8) change records for tracked code modifications to eliminate undocumented or silent agent edits.
> - **Session-Level Governance (Session Gate):** A mandatory two-question startup sequence (`FREEZE` first, then `CHANGE RECORDS`) at the start of every new AI session, keeping the agent strictly read-only until the developer confirms policy.
> - **Developer Approval Guardrails:** Change freeze rules requiring explicit permission before editing each file, backed by optional Git pre-commit hooks and audit scripts.
>
> **This is a foundation, not a fixed standard.** Refine it to fit your project and team: rename folders, add or drop sections, change the defaults, port the scripts to your stack. Please keep the `Created by ghostbyte1014` credit. **This kit edits no project until its developer approves the proposed installation files.**

---

## Complete version history — v1.0 through v3.2

**Origin:** October 1, 2026. **Current compiled edition:** v3.2, October 12, 2026.

The table below **divides functionality already present in this kit into nine named milestones**, so recipients can see what each stage contributes. This is a **retrospective feature breakdown, not proof of nine separately published historical releases**. Everything listed is included in this one compiled kit; nothing in the table is a future promise. The original v1.1 reliability work and v1.2 Session Gate work are preserved as source material; the names below reorganize their contents for presentation.

| Version family | Subversion | Name | What it adds from the existing kit |
|---|---|---|---|
| **v1 — Documentation & Change Control** | **v1.0** | Documentation Foundation | Project docs layout, `docs/README.md` index, separate development/testing/operations/archive areas |
| | **v1.1** | Scope & Status | Authoritative scope placeholder, `Current` / `Reference` / `Needs update` / `Archived` labels, scope verification before freeze |
| | **v1.2** | Change Control | `AGENTS.md` rules, `FREEZE` and `CHANGE RECORDS` switches, per-file approvals, dated change-record template |
| **v2 — Reliability & Git Enforcement** | **v2.0** | Commit Traceability | New change record per staged change/commit, baseline-based history checks, no reuse of older records |
| | **v2.1** | Audit Integrity | Python/Node audit implementations, record metadata/path/date validation, append-only checks, fail-closed error handling |
| | **v2.2** | Enforcement Toolkit | Optional Claude Code permissions (C1), Git audit (C2), pre-commit hook (C3), installation and verification instructions |
| **v3 — Session Control & Governance** | **v3.0** | Session Gate | Mandatory **two separate startup questions**, Change Freeze first and Change Records second, for each new agentic coding session that loads the rules |
| | **v3.1** | Persistent Settings | `ON`, `OFF`, or `Keep current setting` for each question; remain read-only until both answered; explicit approval, switch history, and record for persistent changes |
| | **v3.2** | Transparent Governance | Cross-tool instruction pointers, setup/verification workflow, limitations of Markdown enforcement, optional hooks and Git controls, known bypass disclosures |

**Version index (start → current):** v1.0 Documentation Foundation → v1.1 Scope & Status → v1.2 Change Control → v2.0 Commit Traceability → v2.1 Audit Integrity → v2.2 Enforcement Toolkit → v3.0 Session Gate → v3.1 Persistent Settings → **v3.2 Transparent Governance (current)**.

**For the recipient:** The versions above explain how the **same existing feature set** is layered. Distributing the v3.2 compiled file includes all v1.x, v2.x, and v3.x features. They do not need to install nine different files or upgrade through nine releases. Actual distribution dates and published tags must be taken from release records, not inferred from these presentation labels. Future-version proposals belong in the accompanying changelog, not in this list of included features.

### Package updates and creator note

- **Creator / package maintainer:** `ghostbyte1014`.
- **Self-updates vs. official linear updates:**
  - **Independent / custom updates:** Recipients and AI agents have the full freedom to adapt, customize, or update the kit on their own to suit their project's requirements. However, independent local modifications mean the kit diverges from the creator's planned version tree; **such custom modifications are non-linear** and will affect how smoothly future official updates can be merged.
  - **Official linear updates:** If recipients prefer a standard **linear update** directly from the creator, they can request the next updated package from **ghostbyte1014**. The developer will prepare the update from the kit's changelog/evolution roadmap and supply the newly compiled Agent Docs Kit edition.
- **Before replacing an installed version:** Check the package's version history, compare it with your project's custom rules and scripts, and obtain the project developer's approval for each proposed project-file change. **Do not automatically overwrite** `AGENTS.md`, agent settings, audit scripts, hooks, or other customized files.
- **Current scope and claims:** The current compiled kit contains only the features listed through **v3.2**. Ideas listed under future proposals are not included functionality or promised release dates. An AI agent must not claim to have downloaded, installed, or updated the official kit unless it actually obtained and verified the new package from ghostbyte1014.

### v1 — What the foundations provide

- A consistent documentation directory and index for actual system behavior, development notes, testing, operations, future enhancements, and historical archives.
- Scope and document statuses that make it clear which text is authoritative and which is not yet verified.
- The two persisted configuration switches and a repeatable, Philippine-time change-record format.
- Scope-aware freeze rules requiring explicit permission before changing each file.

### v2 — What reliability adds

- **Commit-scoped audits:** each staged change or post-baseline commit requires a **new** change record; older records cannot be reused.
- **Index-aware checks:** the record and code must both be staged; previously committed records cannot be edited or deleted under the audit rules.
- **Validated records:** filename, Philippine-time date consistency, required fields, types, exact paths, and verification sections are checked.
- **Fail-closed audits and hooks:** missing runtime, invalid Git/baseline, or malformed metadata blocks the check rather than silently passing.
- **Optional integration:** C1 Claude Code permissions, C2 Python or Node.js audit, and C3 pre-commit enforcement.

### v3 — What session control adds

- **Mandatory two-question startup:** when the instructions load in a new coding session, ask Change Freeze and **then separately** Change Records. Each question has `ON`, `OFF`, and `Keep current setting` choices.
- **Read-only until confirmed:** no mutation until both questions have answers and any requested persistent switch edits are separately approved and completed.
- **Governed persistence:** changing a saved value requires approval for affected files, a switch-history entry, and a fresh governance change record—even when turning records OFF.
- **Truthful limits:** this is an agent instruction, not a universal technical lock. Tool-specific startup guards can strengthen enforcement; Git hooks and CI are not automatically session-aware.

---

## Instructions to the agent (read all of this before doing anything)

You have been given this file to set up a documentation and change-tracking process in **this** project. Follow these steps in order.

### Step 1. Look, don't touch
Read the project first: its README, folder layout, existing `docs/` (if any), existing `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` (if any), the tech stack (package manager, languages, framework), and whether it is a git repository. Reading changes nothing and needs no approval.

### Step 2. Ask the developer these installation questions (all at once, then wait)
1. **Project name** and a one-line description (used in the file headings).
2. **Documented scope:** what is the source of truth the code must match when the freeze is ON? (e.g., a thesis paper, a client spec, a PRD, `docs/01-system/overview/SCOPE.md`). If there is none yet, propose `docs/01-system/overview/SYSTEM_SCOPE.md` as a clearly marked **Needs update** placeholder, never as a verified Current scope. If an authoritative source already exists outside the repo, record where it lives and how it is kept in sync.
3. **Code paths to track:** propose a list based on what you found in Step 1 (e.g., `src/`, `app/`, `lib/`, `scripts/`, `migrations/`, `package.json`, `pyproject.toml`, build configs). Ask them to confirm or adjust. Ordinary documentation in `docs/` is not code-tracked; `AGENTS.md`, instruction pointers, hooks, audit scripts, and agent-permission files are protected governance paths.
4. **Docs folder 02:** the second docs folder is project-specific. Propose a name that fits (e.g., `02-thesis/` for thesis or paper work, `02-client/` for a client project, `02-product/` for a product). Ask them to pick.
5. **Existing docs and instruction files:** if any exist, propose whether to merge, move them into the new layout (with `git mv`), or leave them. Never overwrite an existing `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` without showing what will change.
6. **Optional enforcement add-ons** (Part C). Explain each one in a sentence, say whether it fits their stack, and ask which they want:
   - **C1. Claude Code lock** (`.claude/settings.json`): only matters if they use Claude Code.
   - **C2. Audit script**: lists code files changed without a change record. Offer the tested Node.js 18+ CommonJS version or Python 3.9+ version, regardless of app language, using whichever runtime is available in local development and CI.
   - **C3. Commit check** (pre-commit hook): blocks a commit while a code change has no record. Needs C2. Explain how it would be switched on for their stack (npm `prepare` script, a Makefile target, a setup script, or a one-time manual `git config`).
   - Also ask which **risky commands** in their stack should always need approval (e.g., `git push`, `npm install`, `pip install`, `prisma migrate`, `supabase`, `docker`, deploy commands).
7. **Audit baseline and Git workflow:** confirm current repository HEAD, whether the project uses merge/rebase, and whether local commits or CI will enforce records. Explain that the baseline is not retroactive and must never be moved to conceal missing records.
8. **Anything project-specific** to add to `AGENTS.md`: dev commands, data layer, design rules, things never to touch (e.g., `.env*`, production databases).
9. **Session Gate behavior:** explain that every *new* coding chat/session that reads the installed instructions asks **two separate startup questions, one after the other**, regardless of the current stored values. Developer choices are `ON`, `OFF`, and `Keep current setting` for each switch. A session remains read-only until both answers arrive. Ask whether the chosen coding tool supports a startup hook if hard enforcement is desired; do not promise that a Markdown instruction alone is a technical lock.

### Step 3. Propose the file list, then wait for "yes"
List every file you will create or change (Part B, plus the add-ons they chose), one line each. Wait for an explicit "yes". If they say yes to only some, do only those.

### Step 4. Create the files from the templates in the kit
Use the templates in Part B and Part C. Replace every `<PLACEHOLDER>` (including the audit baseline). Remove the template notes in `<!-- ... -->` comments. Keep the wording otherwise; the rules are deliberately exact. **Keep the `Created by ghostbyte1014` watermark** in every file that has one (the line under each heading, and the comment in the scripts and hook); do not remove, reword, or replace it with another name.

### Step 5. Record the setup itself
Before creating the setup record, read the **full** current `HEAD` hash with `git rev-parse HEAD`; put it in C2 and in the records README. If there is no commit, explain that C2 history mode requires an initial commit and ask how to proceed; do not invent a baseline. Create the first change record (`docs/05-operations/agents/feature-updates/<timestamp>_agent-docs-kit-setup.md`) listing every file created or changed. Stage the setup files **and the new record in the same intended commit**, but **do not commit** unless explicitly asked. If C2 was installed, run `--staged` (after staging) and `--history`; any failure must be reported, never silently skipped.

### Step 6. Report and stop
Tell the developer what was created, how to turn the freeze ON later (Part A), and to **start a new AI session** so supported tools load the new rules and the two-question Session Gate appears. Distinguish instruction-level startup prompts from a guaranteed technical lock. Do not commit or push unless they ask for that exact action.

---

## Part A. How the process works (summary for the developer)

| Part | File | What it does | Default |
|---|---|---|---|
| Written rules | `AGENTS.md` | All agent rules: docs layout, change records, change freeze, two-question Session Gate | Always on |
| Tool pointers | `CLAUDE.md`, `GEMINI.md` | One-line files that make Claude Code and Gemini CLI read `AGENTS.md` | Always on |
| Docs index | `docs/README.md` | Every doc listed with a status; where new docs go | Always on |
| Change records | `docs/05-operations/agents/feature-updates/` | One file per change: what, why, which files, which AI tool, who approved | **`CHANGE RECORDS: ON`** |
| Change freeze | `AGENTS.md` section + guide | Agent asks before each file, flags anything new | **`FREEZE: OFF`** |
| C1. Claude Code lock | `.claude/settings.off.json` (renamed to `settings.json` when ON) | Claude Code itself prompts for every edit and risky command | Optional |
| C2. Audit script | `scripts/freezeAudit.cjs` or `scripts/freeze_audit.py` | Checks each staged change and each post-baseline commit against its own newly added record | Optional |
| C3. Commit check | `.githooks/pre-commit` | Blocks a commit when staged tracked changes lack newly staged records | Optional |

**Two switches, both in `AGENTS.md`:**
- `**CHANGE RECORDS: ON**` / `OFF`: whether every code change needs a change record. The audit (C2) and commit check (C3) follow this switch.
- `**FREEZE: ON**` / `OFF`: whether agents must ask before each file and flag anything outside the documented scope.

**Session Gate, every new coding chat/session:** When an agent loads the installed `AGENTS.md`, it asks **Question 1 (Change Freeze)** and waits for an answer, then asks **Question 2 (Change Records)** and waits for an answer. For each question the developer may choose `ON`, `OFF`, or `Keep current setting`. Each question displays the value currently saved in `AGENTS.md`. Until both choices are confirmed, the agent may inspect/read but must not write or run mutating commands. `Keep current setting` does not modify files. If either value changes, obtain explicit permission for each affected governance file and follow the change-record/switch-history workflow before any regular coding edit. A new chat/session prompts again; individual messages **within the same already-confirmed session do not** require re-answering. A Markdown instruction cannot force every tool to comply: use a tool-specific startup hook/wrapper when technical enforcement is necessary.

**Turning the freeze ON later:** change `**FREEZE: OFF**` to `**FREEZE: ON**` in `AGENTS.md`, rename `.claude/settings.off.json` to `.claude/settings.json` (if C1 is installed), add a row to the switch history and create a change record. Commit or push **only when explicitly requested**. Start a new AI session. Full steps are in `docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md` (template B5).

---

## Part B. Core files (always created)

### B1. `AGENTS.md` (repository root)

~~~~markdown
# <PROJECT NAME>: AGENTS.md

> Created by ghostbyte1014 · Agent Docs Kit

<One-line project description.>

## Switches (read before anything else)

**CHANGE RECORDS: ON**

**FREEZE: OFF**

> The two switch values are persistent repository settings, not just chat preferences. A developer's startup choice does not override the stored values until an approved file change is made. When changing settings, start a new AI session after the change so tool instructions/permissions reload. The Claude Code lock is separate: `.claude/settings.json` is active, `.claude/settings.off.json` is inactive. Full guide: [`docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md`](docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md).

These rules apply to **every AI coding agent** (Claude Code, Codex, Gemini CLI, Cursor, Copilot, or any other) **in every mode, including auto, auto-accept, full-access, YOLO, or "skip permissions"**. However, whether the tool actually loads and follows these rules is agent-dependent; text instructions alone cannot prevent edits in every tool.

## Mandatory Session Gate (at the start of every new coding chat/session)

**When these instructions are loaded in a fresh agentic coding chat/session, ask exactly two distinct questions, sequentially. Do not combine them into one prompt or assume prior-session answers carry over.** If the chat context has already recorded answers to both questions, do not ask again for each subsequent message in that same session unless the developer requests a change.

**Question 1 — Change Freeze:** display the saved value read from `AGENTS.md` and ask:
> `Change Freeze is currently <ON/OFF>. For this session, do you want to turn it ON, turn it OFF, or Keep current setting?`

**STOP and wait** for the developer's answer to Question 1. Do not ask Question 2 in the same message.

**Question 2 — Change Records:** after the first answer, display its saved value and ask:
> `Change Records is currently <ON/OFF>. For this session, do you want to turn it ON, turn it OFF, or Keep current setting?`

**STOP and wait** for the developer's answer to Question 2.

- Until **both** answers have been explicitly provided, **READ-ONLY MODE** applies: inspect/search/describe files and run genuinely read-only checks only. Do not create/edit/delete files, stage, commit, push, install packages, change Git config, migrate databases, or perform any other mutating operation. Never infer an answer from silence, auto mode, or the previous session.
- `Keep current setting` means the persisted `AGENTS.md` value remains unchanged. An answer of `ON` or `OFF` that equals the stored value also needs no file change.
- If a requested value differs from the stored value, explain the exact required edits (`AGENTS.md`, a switch-history row in `docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md`, C1 permission-file rename if installed, and a **new** change record). Request explicit approval to modify **each** affected file; until the approved changes are written, obey the currently stored restrictions and do not make regular code changes. If approval is withheld or the update cannot be completed, remain read-only and report the mismatch. Never present a chat-only choice as a switch that already changed Git audit behavior.
- Log a new record for each switch-change transaction even if `CHANGE RECORDS` is being switched OFF. This is a **policy obligation**, not a guarantee from the included C2 script: that script skips record coverage when the staged switch is OFF. For tamper-resistant control, enforce switch-change policies separately in protected CI/branch rules.
- When both choices match persisted settings, acknowledge the two settings and proceed using the stored rules. If updated, verify that the persisted files agree before proceeding. Ask the two questions again in the **next** fresh coding chat/session.
- Do not claim startup gating is universally enforced: a tool must read these instructions, and strict enforcement across all tools requires tool-specific hooks or a launcher that blocks mutation before confirmation.

## Change records (when CHANGE RECORDS is ON)

After every change to code (<TRACKED CODE PATHS>) or protected agent-governance files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.githooks/`, `.claude/settings*.json`, the audit script), create a **new** change record in [`docs/05-operations/agents/feature-updates/`](docs/05-operations/agents/feature-updates/README.md) in the same change:
- **One file per change topic**, named `YYYY-MM-DD_HHMM_short-topic.md` (24-hour **Philippine time**, UTC+8, taken from the device clock, e.g., `date +%Y-%m-%d_%H%M`; if two records share a minute, use `HHMM-01`, `HHMM-02` in creation order). Records then sort in timestamp order. If you cannot read the clock, ask the developer for the time; never guess.
- Copy the template in that folder's `README.md`. Fill in:
  - **Date:** `YYYY-MM-DD HH:MM (Philippine time)`, matching the file name.
  - **AI tool:** your own tool name (`Claude Code`, `Codex`, `Gemini CLI`, `Cursor`, …) and model if known. A change made without AI is recorded as `Manual`.
  - **Files changed:** every file path, in backticks.
  - **Approved by (device owner):** Git identity from `git config user.name` and `git config user.email`; if missing, ask rather than guessing. This field identifies the configured user, **not** who approved a specific edit.
  - **Approval evidence:** either `Not required (FREEZE: OFF)` or a short truthful description of explicit, per-file approval obtained while `FREEZE: ON` (e.g., `Developer confirmed changes to src/foo.ts in this session`). Records cannot independently prove approval.
  - **Type:** `Fix`, `Polish`, `Feature`, or (while the freeze is ON) `New feature (approved outside the documented flow)`.
- Records are permanent: never edit or delete an existing record. A correction is a new record. **Each commit containing tracked changes must add its own new record(s) in that same commit; older records cannot authorize new changes.**
- Writing the record is part of the change and needs no separate approval. **Stage the new record alongside the code it describes.** If a file was renamed, list both the old and new paths.

## Change freeze (when FREEZE is ON)

When FREEZE is ON, the project is in its polishing stage: the code must not drift from the documented scope (<DOCUMENTED SCOPE, e.g., "the thesis paper Chapters 1–2" or "docs/01-system/overview/SYSTEM_SCOPE.md">). These rules override any instruction to work autonomously. When FREEZE is OFF, skip this section; every other section still applies.

1. **Flag anything new.** Allowed work by default: fixing errors in, or polishing, flows already in the documented scope. If a change would add something the scope does not describe (a page, a capability, a database table, a workflow step), say so clearly: "This is a new feature, outside the documented flow." Build it only if the developer confirms they want it anyway.
2. **Ask before each file.** Before you create, edit, move, or delete **each file**, name the file and what will change in it, plus any migration the developer must run. Then **stop and wait for the developer's explicit "yes"** before touching that file. Do the same before running anything that changes the database, git history, or dependencies.
   - An implementation plan, task list, TODO, or an earlier approval is **not** approval. Even when a plan lists the work, confirm each file before editing it.
   - Silence or auto mode is not approval.
3. **An approval covers only what was described.** Anything extra you notice gets reported and needs its own approval.
4. **Allowed without asking:** reading and searching files, explaining code, and read-only checks (<READ-ONLY COMMANDS, e.g., lint, build, the audit script>).

## Always (whatever the switches say)

- **Never** commit, push, run migrations against a remote/production database, or change `.env*` files unless the developer asks for that exact action. Never include credentials, tokens, personal student data, secret values, or private keys in change records, logs, or documentation.
- **Validate before claiming success:** report which checks were run, what passed, and what remains unverified. An audit proves record coverage for changes, not that the code is correct or that approval truly happened.
- A change to either switch or an enforcement file is a governance change. **Always create a new change record for a switch toggle**, including a toggle to `CHANGE RECORDS: OFF`, and stage it alongside that change. The included C2 script cannot enforce this special rule when it reads the staged switch as OFF; use protected CI policy if technical enforcement is required.

## Documentation (read first)
- **Start at [`docs/README.md`](docs/README.md).** It is the index of every document, with its status (Current / Reference / Needs update / Archived). Mark a document **Current** only after checking its claims against the accepted system scope and relevant implementation; placeholders are **Needs update**.
- Where a new doc goes:

  | Kind of document | Folder |
  |---|---|
  | How the system works now (scope, schema, rules, design, security) | `docs/01-system/<topic>/` |
  | <02 FOLDER PURPOSE, e.g., thesis paper work / client deliverables> | `docs/<02-FOLDER>/<topic>/` |
  | Implementation reports for finished work | `docs/03-development/implementation-reports/` |
  | Code audits of a system area and their fix plans (work in progress) | `docs/03-development/audits/` |
  | Test checklists, QA runbooks, evidence | `docs/04-testing/` |
  | Setup, database, deployment, agent process | `docs/05-operations/<topic>/` |
  | Planned improvements, documented but not built | `docs/06-future-enhancements/` |
  | Superseded, completed, or rejected material | `docs/archive/<era-or-kind>/` |

- Name dated docs `TOPIC_YYYY-MM-DD.md`; living docs `TOPIC.md`. Do not create `.md` files in the repo root (only `README.md`, `AGENTS.md`, and the one-line `CLAUDE.md`/`GEMINI.md` pointers live there).
- Every time you add, move, archive, or retire a doc, update `docs/README.md` in the same change.
- **`docs/archive/` is historical, not authoritative.** Do not use it as a source of truth or audit against it.
- Move files with `git mv` so history is kept, then fix relative links.

<!-- Project-specific sections go below: Dev Commands, Architecture, Data Layer, Design Rules, etc. -->
~~~~

### B2. `CLAUDE.md` (repository root)

~~~~markdown
# <PROJECT NAME>: Claude Code instructions

> Created by ghostbyte1014 · Agent Docs Kit

All project rules live in AGENTS.md. At the start of every new coding chat/session, load AGENTS.md and ask its TWO Session Gate questions SEPARATELY (Change Freeze first; Change Records second). Stay read-only until both are answered. Then follow its change-record rules and, when freeze is ON, its per-file approval rules, even in auto mode.

@AGENTS.md
~~~~

### B3. `GEMINI.md` (repository root)

~~~~markdown
# <PROJECT NAME>: Gemini CLI instructions

> Created by ghostbyte1014 · Agent Docs Kit

All project rules live in AGENTS.md. At the start of every new coding chat/session, load AGENTS.md and ask its TWO Session Gate questions SEPARATELY (Change Freeze first; Change Records second). Stay read-only until both are answered. Then follow its change-record rules and, when freeze is ON, its per-file approval rules, even in auto/YOLO mode.

@AGENTS.md
~~~~

### B4. `docs/README.md`

~~~~markdown
# <PROJECT NAME> Documentation Index

> Created by ghostbyte1014 · Agent Docs Kit

Every document in `docs/` is listed here with its status. **Agents and contributors: read this first**, and update this index in the same change whenever a doc is added, moved, archived, or retired.

**Status legend**
- **Current**: verified against accepted scope and relevant implementation on the stated date; authoritative for the documented area.
- **Reference**: still useful and accurate in principle, but not the primary source.
- **Needs update**: still the right place for this topic, but parts are out of date. Trust the code over it.
- **Archived**: historical only (see [`archive/README.md`](archive/README.md)).

**Where a new doc goes**

| Kind of document | Folder | Naming |
|---|---|---|
| How the system works now | `01-system/<topic>/` | `TOPIC.md` (living doc) |
| <02 FOLDER PURPOSE> | `<02-FOLDER>/<topic>/` | `TOPIC_YYYY-MM-DD.md` |
| Report on finished implementation work | `03-development/implementation-reports/` | `TOPIC_YYYY-MM-DD.md` |
| Code audit of a system area, with its fix plan | `03-development/audits/` | `TOPIC_YYYY-MM-DD.md` |
| Test checklist, QA runbook, evidence | `04-testing/` | `TOPIC_YYYY-MM-DD.md` |
| Setup, database, deployment, agent process | `05-operations/<topic>/` | `TOPIC.md` |
| Planned improvements, documented but not built | `06-future-enhancements/` | `TOPIC_YYYY-MM-DD.md` |
| Superseded, completed, or rejected | `archive/<era-or-kind>/` | keep original name |

Do not add `.md` files to the repository root. The root holds only `README.md`, `AGENTS.md` (all agent rules), and the one-line `CLAUDE.md`/`GEMINI.md` pointers to it.

---

## 01 · System: how <PROJECT NAME> works now

| Document | Status | Notes |
|---|---|---|
| [overview/SYSTEM_SCOPE.md](01-system/overview/SYSTEM_SCOPE.md) | Needs update | Placeholder until approved and checked against the accepted project scope. Change to Current only after verification. |

## 02 · <02 FOLDER TITLE>

| Document | Status | Notes |
|---|---|---|

## 03 · Development: audits and implementation reports

| Document | Status | Notes |
|---|---|---|

## 04 · Testing

| Document | Status | Notes |
|---|---|---|

## 05 · Operations

| Document | Status | Notes |
|---|---|---|
| [agents/CHANGE_FREEZE_GUIDE.md](05-operations/agents/CHANGE_FREEZE_GUIDE.md) | Current | How change records and the change freeze work, and how to switch them. |
| [agents/feature-updates/](05-operations/agents/feature-updates/README.md) | Current | One change record per change, with the template. |

## 06 · Future enhancements

| Document | Status | Notes |
|---|---|---|

## Archive

See [`archive/README.md`](archive/README.md).
~~~~

Also create `docs/archive/README.md`:

~~~~markdown
# Archive

> Created by ghostbyte1014 · Agent Docs Kit

Historical material only: superseded, completed, or rejected documents. **Not authoritative.** Do not use anything here as a source of truth or audit against it. Each subfolder is named by era or kind (e.g., `2026-10_old-design/`).
~~~~

If a verified source-of-truth document already exists, replace the example index row above with a link and its actual status; do **not** create a duplicate. Otherwise create the following starter placeholder (its status remains **Needs update**):

### B4a. `docs/01-system/overview/SYSTEM_SCOPE.md` (only if no authoritative scope exists)

~~~~markdown
# <PROJECT NAME> — System Scope

> Created by ghostbyte1014 · Agent Docs Kit

**Status:** Needs update — **NOT YET APPROVED OR VERIFIED**.
**Authoritative external source (if any):** <name/path/link, or None yet>.

## In scope
<Developer must specify existing, approved features and workflows.>

## Out of scope / future
<Developer must distinguish prototypes and future features.>

## Source verification
<References to accepted specification, implementation paths, and verification date.>

**Do not enable a scope-dependent freeze until this document, or another cited scope, has been reviewed and accepted.**
~~~~

Create other folders only when they receive documents (git does not track empty folders).

### B5. `docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md`

<!-- Agent: keep only add-ons that were selected; adapt commands and hooks to the installed audit language. -->

~~~~markdown
# Change Freeze Guide: change records and AI-agent safeguards

> Created by ghostbyte1014 · Agent Docs Kit

**Audience:** <PROJECT NAME> owner and contributors using AI coding tools.
**Status:** Current. Change records: **ON**. Freeze: **OFF** (since <SETUP DATE>). Session Gate: **ON** (two separate confirmations required per new coding chat/session).

## 1. Purpose and switches

`AGENTS.md` contains two independent switches:
- **`CHANGE RECORDS: ON`** requires a *new* append-only record for tracked code or governance changes in each commit. Records describe the change and identify the configured Git user; Git identity is **not proof of authorization**.
- **`FREEZE: ON`** restricts agent work to approved documented scope and requires explicit developer approval **before each file edit**, even in auto modes. Additional or out-of-scope features require separate approval.

Written rules are instructions, **not a universal technical lock**. Permissions depend on the installed agent; Git hooks check staged commits, not every workspace edit. Never commit, push, change secrets, or run remote migrations without a developer request for that action.

### Mandatory Session Gate (v3.0–v3.2) — two separate questions

Each **new coding chat/session that reads `AGENTS.md`** must ask, one at a time:

1. **Question 1, Change Freeze:** `Currently <ON/OFF>. Turn ON / Turn OFF / Keep current setting?` Then **wait for the answer**.
2. **Question 2, Change Records:** `Currently <ON/OFF>. Turn ON / Turn OFF / Keep current setting?` Then **wait for the answer**.

Never combine the questions. Never substitute choices from a previous session. No mutation is allowed until **both** questions are answered. Reading and genuinely read-only checks may continue. This check runs once per **new** chat/session, not after every message inside an already-confirmed session.

`Keep current setting` changes nothing. If the answer differs from `AGENTS.md`, chat confirmation is **not** yet an effective policy switch: get per-file approval, update the persisted switch, add a row to section 8 and a **fresh governance record**, and handle `.claude/settings*.json` if C1 is installed. A toggle to `CHANGE RECORDS: OFF` still requires a record as a process rule, although the supplied C2 script cannot enforce it once the staged switch is OFF. Do not perform regular edits when the desired and persisted settings disagree; report the mismatch if a switch update is not approved.

**Technical limit:** These prompts are instruction-based. For assured startup blocking, implement and test a supported agent-specific startup hook or launcher. Neither Git hooks nor this Markdown file guarantees every agent will ask before editing.

## 2. Components

| Part | Files | Enforcement |
|---|---|---|
| Agent policy | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | Instruction-based, agent dependent |
| Documentation map | `docs/README.md` | Human-reviewed status labels |
| New change record per topic | `docs/05-operations/agents/feature-updates/` | Append-only by policy; checked by C2/C3 if installed |
| C1, optional | `.claude/settings.off.json` / `.claude/settings.json` | Claude Code only; verify effective permissions locally |
| C2, optional | `scripts/freeze_audit.py` **or** `scripts/freezeAudit.cjs` | Commit-scoped Git audit |
| C3, optional | `.githooks/pre-commit` | Refuses staged changes without a newly staged record, unless records deliberately switched OFF; bypassable |

## 3. Workflow for one change

0. Complete both separate Session Gate questions and, if needed, approved persistent switch changes before doing regular work.
1. When freeze is ON, identify the exact file and intended edit, check whether it belongs to the documented scope, and obtain an explicit **yes for that file**. A plan or an earlier general yes is not sufficient.
2. Implement only the approved change. Do not run migrations or install dependencies without their own authorization.
3. Create a **new** `YYYY-MM-DD_HHMM_topic.md` record (Philippine time) with actual files changed, reason, tool, Git identity, truthful approval evidence, and how to verify.
4. Stage the code **and** new record together. Do not stage or commit unrelated changes without authorization.
5. Run `<AUDIT COMMAND> --staged`. A previously committed record never satisfies this step.
6. Commit only if the developer explicitly requested it. With C3 installed, the hook checks the staged snapshot again.

Record corrections in a **new** record. Never edit or delete a previously committed record. When moving code files, list both old and new paths.

## 4. Turning freeze ON or OFF

1. Ask for explicit developer approval to change `AGENTS.md` and each other affected file.
2. Toggle `**FREEZE: OFF**` / `**FREEZE: ON**` in `AGENTS.md`.
3. If C1 is installed, move `.claude/settings.off.json` to `.claude/settings.json` when turning ON; reverse when turning OFF. Merge existing settings rather than overwriting them.
4. Add a dated row to section 8 below; create a new change record for the switch or permission-file change **even when turning `CHANGE RECORDS` OFF**. Stage the changes and the record together; note that the supplied C2 check does not enforce records when the staged setting is OFF.
5. **Do not reset the audit baseline merely to toggle freeze.** Keep the historical baseline so previously audited changes stay covered.
6. Commit or push **only on explicit instruction** and restart AI sessions so the new rules are loaded. Verify permission behavior with a harmless test.

Turning `CHANGE RECORDS` OFF intentionally disables C2/C3 coverage for commits made with that setting, including enforcement of its own OFF-switch record. A separate protected CI rule is needed for non-bypassable governance-switch coverage. Restore ON with an explicit documented change; do not move the baseline to hide missing records. If a legitimate reset is needed, document why, what history becomes unaudited, and obtain approval.

## 5. Audit modes (C2)

```bash
<AUDIT COMMAND> --staged
<AUDIT COMMAND> --history
<AUDIT COMMAND> --working
```

- **`--staged` (pre-commit):** inspects Git's staged snapshot only, requires a **newly added and staged** record covering each tracked path, and rejects modifying/deleting older records. Files in a record must be among files changed in that staged snapshot. No old record can be reused.
- **`--history` (post-commit/CI):** checks every commit on the **first-parent history** after `<BASELINE COMMIT>`, comparing each commit with its first parent. Each commit changing tracked paths must itself add a record. A merge is audited for the overall changes it introduces against the first parent. Already-existing older records do not count.
- **`--working` (diagnostic):** reports unstaged or untracked tracked files that cannot yet be verified as part of a commit; it is not used in the pre-commit hook.
- With no flag, run `--staged` and `--history` together. Broken Git commands, missing `AGENTS.md`, invalid baseline, or malformed record metadata **fail rather than silently passing**.
- The audit tracks `<TRACKED CODE PATHS>` plus central agent-governance files; ordinary `docs/` prose is excluded. New change records themselves are checked for validity and immutability.
- Date field must match filename in Philippine time. The audit checks consistency, **not whether a device clock, claimed authorization, or change description is truthful**.

**Baseline limitations:** History before the baseline is intentionally not checked. `--history` needs an existing full commit SHA that is an ancestor of HEAD. First-parent auditing is designed for a protected mainline; use CI on your protected branch and adopt merge rules that preserve change records. Avoid squashing away records without corresponding coverage.

## 6. Commit check (C3)

The pre-commit hook runs **`--staged`**, not a diff of the entire working directory. This means it checks exactly what the commit would contain. A record left unstaged does **not** count. A commit touching only ordinary `docs/` files does not need a change record, except that any newly added record is still checked for valid content.

Activate after inspecting an existing hook manager, if any:

```bash
git config core.hooksPath .githooks
git config --get core.hooksPath
```

Install the hook using the **runtime selected for the project**. If that runtime or Git is missing, the hook rejects the commit with a clear error. `git commit --no-verify` still bypasses local hooks, so protect branches and run `<AUDIT COMMAND> --history` in CI where possible. CI is not a substitute for file-by-file approval under freeze.

## 7. Verification checklist

- With records ON, staged code without a new staged record **fails**.
- A valid new record staged with the code **passes**.
- Re-editing a previously documented file without a fresh record **fails**.
- Modifying/deleting an existing record **fails**.
- A record describing a file that is not staged **fails**.
- A deleted/renamed tracked path needs coverage (for renames, list both old and new paths).
- Bad timestamps, missing mandatory fields, or unavailable runtime **fail**.
- With records OFF, coverage is deliberately skipped; this is an **administrative bypass**, not an audit guarantee.
- Every new coding session asks **two separate startup questions** in order; the second is withheld until the first is answered, and no mutating operation occurs before both answers.
- Each question offers `ON`, `OFF`, and `Keep current setting`; selecting Keep leaves `AGENTS.md` untouched.
- If a changed selection is not approved for persistence, regular code editing stays blocked and the mismatch is reported.
- When freeze ON, after both startup answers, request a tiny file change; confirm it asks for explicit per-file approval before writing.

## 8. Switch history

| Date (PH) | Switch | Value | Git identity | Reason / approval |
|---|---|---|---|---|
| <SETUP DATE> | CHANGE RECORDS | ON | <git identity> | Kit installed with developer consent |
| <SETUP DATE> | FREEZE | OFF | <git identity> | Development mode; freeze later after scope verification |

## 9. Additional safeguards

- Protect the default branch with pull-request review and mandatory CI checks, when available.
- Limit who can edit `AGENTS.md`, permission files, audit scripts, and hooks (for example, codeowners/reviewers).
- Keep sensitive credentials and private personal data out of change records and console logs.
- Check the **Current** label against code and accepted scope; move stale or unapproved material to **Needs update**.
- Never claim the audit proves code correctness or approval authenticity; it checks only scoped Git changes and record structure.
~~~~

### B6. `docs/05-operations/agents/feature-updates/README.md`

~~~~markdown
# Feature updates: change records

> Created by ghostbyte1014 · Agent Docs Kit

When `CHANGE RECORDS: ON` in `AGENTS.md`, every commit affecting tracked code or central governance files must add its own new record(s). Read [`../CHANGE_FREEZE_GUIDE.md`](../CHANGE_FREEZE_GUIDE.md).

## Rules

- **One new file per topic**, in the same staged commit as the change it describes. Older records never cover future edits to the same path.
- **Name:** `YYYY-MM-DD_HHMM_short-topic.md` (24-hour **Philippine time**, UTC+8). Two created in the same minute use `HHMM-01`, `HHMM-02`. Use the actual current PH date/time; never guess.
- **Date line:** `YYYY-MM-DD HH:MM (Philippine time)`, exactly matching the filename. Valid actual date/time is checked.
- **Files changed:** one exact backticked repository-relative path per line. List only files actually in this staged change; for moves/renames include both the old and new path.
- **AI tool:** actual agent + model if known; `Manual` if no agent was involved.
- **Approved by (device owner):** output of `git config user.name` and `git config user.email`; ask if missing. This is Git identity, not approval proof.
- **Approval evidence:** record `Not required (FREEZE: OFF)` or a short factual summary of the developer's explicit per-file approval when freeze is ON. The audit checks presence, **not authenticity**.
- **Type:** exactly `Fix`, `Polish`, `Feature`, or `New feature (approved outside the documented flow)`.
- **Migration:** write the affected migration and status, or `None`. Do not run remote migrations without specific authorization.
- **Append-only:** never edit or delete existing records, even to fix a typo. Use another new record to document a correction.
- **No sensitive data:** don't include secrets, credentials, private student records, or access tokens.

**Audit baseline:** commit `<BASELINE COMMIT>` (<SETUP DATE>). Only commits after that baseline are checked by `--history`; `--staged` checks newly staged changes regardless of the baseline. Never reset the baseline to conceal a failure.

## Template

Copy into a **new** file, replace every placeholder, and stage it with the change:

```markdown
# <Short title>

- **Date:** YYYY-MM-DD HH:MM (Philippine time)
- **AI tool:** <Actual tool, model if known, or Manual>
- **Approved by (device owner):** <git user.name> (<git user.email>)
- **Approval evidence:** Not required (FREEZE: OFF) | <Explicit developer approval and exact file scope if freeze ON>
- **Type:** Fix | Polish | Feature | New feature (approved outside the documented flow)
- **Migration:** None | <file and applied/to apply>

## Files changed
- `path/to/file`

## What changed and why
<Describe the affected flow and actual modifications.>

## How to verify
<Commands or steps actually used; identify unverified checks.>
```
~~~~

## Part C. Optional enforcement add-ons (ask the developer first)

Install only what the developer chose in Step 2. Adapt paths and commands to their stack, and show them the adapted version before writing it.

### C1. Claude Code lock

Create it **inactive** (freeze is OFF): save as `.claude/settings.off.json`. Turning the freeze ON renames it to `.claude/settings.json`. If the project already has a `.claude/settings.json` with other settings, ask how to merge before doing anything.

Replace the stack-specific `Bash(...)` lines with the risky commands the developer named.

```json
{
  "permissions": {
    "ask": [
      "Edit",
      "Write",
      "MultiEdit",
      "NotebookEdit",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git reset:*)",
      "Bash(git checkout:*)",
      "Bash(npm install:*)"
    ],
    "disableBypassPermissionsMode": "disable"
  }
}
```

### C2. Audit script

Use **one** of the two tested, standard-library implementations below. Both enforce the same contract. Confirm runtime availability and tracked paths before installation; adjust only the `CODE_PATHS` expression after inspecting the project. `PROTECTED_PATHS` safeguards the central governance files. Do not edit the existing repository's records or history to make the audit pass.

**Design:** `--staged` checks tracked paths against records newly added to the **Git index** (not records merely present in the working tree); `--history` checks commits individually after a selected baseline; `--working` identifies unstaged/untracked code without treating older records as coverage. A record's required metadata and exact changed-path lines are also checked. When records are ON, errors fail closed.

Before installing, set `BASELINE` to the full, existing `git rev-parse HEAD` hash **as it was before the kit changes**. If no commit exists, get developer approval to establish an initial commit before enabling history mode. Avoid rebasing or changing the baseline merely to conceal a gap. Use repository-relative paths and run from the repository root.

**Python 3.9+** — `scripts/freeze_audit.py`:

```python
"""Agent Docs Kit — commit-scoped change-record audit.
Created by ghostbyte1014 · Agent Docs Kit
Python 3.9+, standard library only. Run from the Git repository root.
"""
import argparse
import datetime as dt
import pathlib
import re
import subprocess
import sys

BASELINE = '<BASELINE COMMIT>'  # Set when installing. Required only for --history.
RECORDS_DIR = 'docs/05-operations/agents/feature-updates/'
CODE_PATHS = re.compile(r'^(src/|app/|lib/|scripts/|migrations/|supabase/|package\.json$|pyproject\.toml$|requirements\.txt$)')  # ADAPT
PROTECTED_PATHS = re.compile(r'^(AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|\.githooks/|\.claude/settings(?:\.off)?\.json$)')
RECORD_NAME = re.compile(r'^(\d{4}-\d{2}-\d{2})_(\d{4})(?:-\d{2})?_[a-z0-9][a-z0-9-]*\.md$')
VALID_TYPES = {'Fix', 'Polish', 'Feature', 'New feature (approved outside the documented flow)'}


def git(*args):
    result = subprocess.run(['git', *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError(f"git {' '.join(args)} failed: {result.stderr.decode('utf-8', 'replace').strip()}")
    return result.stdout


def paths(*args):
    return [s.decode('utf-8', 'surrogateescape') for s in git(*args).split(b'\0') if s]


def record(path):
    return path.startswith(RECORDS_DIR) and path.endswith('.md') and path != RECORDS_DIR + 'README.md'


def tracked(path):
    return bool(CODE_PATHS.search(path) or PROTECTED_PATHS.search(path))


def index_text(path):
    return git('show', ':' + path).decode('utf-8', 'replace')


def commit_text(commit, path):
    return git('show', f'{commit}:{path}').decode('utf-8', 'replace')


def switch_on(content):
    matches = re.findall(r'^\*\*CHANGE RECORDS:\s*(ON|OFF)\*\*\s*$', content, re.M | re.I)
    if len(matches) != 1:
        raise ValueError('AGENTS.md must have exactly one CHANGE RECORDS: ON/OFF switch')
    return matches[0].upper() == 'ON'


def validate_record(path, content, changed):
    errors = []
    m = RECORD_NAME.fullmatch(path.split('/')[-1])
    if not m:
        return [f'{path}: invalid name (expected YYYY-MM-DD_HHMM_topic.md)'], set()
    date, hm = m.groups()
    try:
        dt.datetime.strptime(date + hm, '%Y-%m-%d%H%M')
    except ValueError:
        errors.append(f'{path}: impossible date/time')
    def field(name):
        match = re.search(r'^- \*\*' + re.escape(name) + r':\*\*\s*(.+?)\s*$', content, re.M)
        value = match.group(1).strip() if match else ''
        if not value or '<' in value or value in {'None | ...', 'TBD'}:
            errors.append(f'{path}: missing/unfilled {name}')
        return value
    if field('Date') != f'{date} {hm[:2]}:{hm[2:]} (Philippine time)':
        errors.append(f'{path}: Date does not match filename (Philippine time)')
    field('AI tool')
    field('Approved by (device owner)')
    field('Approval evidence')
    if field('Type') not in VALID_TYPES:
        errors.append(f'{path}: unsupported Type')
    field('Migration')
    section = re.search(r'^## Files changed\s*$\n(.*?)(?=^## |\Z)', content, re.M | re.S)
    listed = set()
    if section:
        for line in section.group(1).splitlines():
            if not line.strip():
                continue
            match = re.fullmatch(r'\s*- `([^`]+)`\s*', line)
            if not match:
                errors.append(f'{path}: invalid Files changed entry: {line.strip()}')
            else:
                listed.add(match.group(1))
    if not listed:
        errors.append(f'{path}: no files listed in ## Files changed')
    if listed - changed:
        errors.append(f'{path}: files not changed in this commit: {sorted(listed - changed)}')
    for heading in ('What changed and why', 'How to verify'):
        s = re.search(r'^## ' + re.escape(heading) + r'\s*$\n(.*?)(?=^## |\Z)', content, re.M | re.S)
        if not s or not s.group(1).strip() or '<' in s.group(1):
            errors.append(f'{path}: missing/unfilled ## {heading}')
    return errors, listed


def check_change(label, changed_paths, added_records, content_reader, agent_text):
    print(f'Checking {label}')
    if not switch_on(agent_text):
        print('  Change records OFF: enforcement intentionally disabled.')
        return 0
    changed = set(changed_paths)
    altered_records = sorted(p for p in changed if record(p) and p not in added_records)
    errors = [f'Existing change record edited/deleted: {p}' for p in altered_records]
    coverage = set()
    for path in sorted(added_records):
        problems, listed = validate_record(path, content_reader(path), changed)
        errors += problems
        coverage |= listed
    missing = sorted(p for p in changed if tracked(p) and p not in coverage)
    if missing:
        errors.append('Missing NEW change-record coverage in this commit for: ' + ', '.join(missing))
    if errors:
        for err in errors:
            print('  ERROR: ' + err)
        return 1
    print(f'  Passed: {sum(tracked(p) for p in changed)} tracked path(s), {len(added_records)} new record(s).')
    return 0


def diff_paths(*args):
    return paths('diff', *args, '--name-only', '-z', '--no-renames')


def staged():
    changed = diff_paths('--cached')
    added = set(diff_paths('--cached', '--diff-filter=A'))
    agent = index_text('AGENTS.md')
    return check_change('staged files', changed, {p for p in added if record(p)}, index_text, agent)


def history():
    if BASELINE.startswith('<'):
        raise ValueError('Set BASELINE to an existing commit before using --history')
    baseline = git('rev-parse', '--verify', BASELINE + '^{commit}').decode().strip()
    head = git('rev-parse', '--verify', 'HEAD').decode().strip()
    check = subprocess.run(['git', 'merge-base', '--is-ancestor', baseline, head])
    if check.returncode:
        raise ValueError('BASELINE must be an ancestor of HEAD; rebaseline only with approval')
    commits = git('rev-list', '--first-parent', '--reverse', f'{baseline}..HEAD').decode().splitlines()
    failures = 0
    for commit in commits:
        parent = git('rev-parse', commit + '^1').decode().strip()
        changed = diff_paths(parent, commit)
        added = set(diff_paths('--diff-filter=A', parent, commit))
        failures += check_change('commit ' + commit[:12], changed, {p for p in added if record(p)},
                                 lambda p: commit_text(commit, p), commit_text(commit, 'AGENTS.md'))
    if not commits:
        print('No commits after audit baseline.')
    return int(failures > 0)


def working():
    unstaged = diff_paths()
    untracked = paths('ls-files', '--others', '--exclude-standard', '-z')
    outstanding = sorted(p for p in set(unstaged + untracked) if tracked(p))
    if outstanding:
        print('Unstaged/untracked work (cannot be commit-audited until staged):')
        for p in outstanding:
            print('  - ' + p)
        return 1
    print('No unstaged/untracked tracked paths.')
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--staged', action='store_true', help='Validate staged code against newly staged records')
    parser.add_argument('--history', action='store_true', help='Validate each commit after BASELINE')
    parser.add_argument('--working', action='store_true', help='Report unaudited unstaged and untracked work')
    args = parser.parse_args()
    try:
        git('rev-parse', '--show-toplevel')
        if not (args.staged or args.history or args.working):
            args.staged = args.history = True
        return int(bool((staged() if args.staged else 0) |
                        (history() if args.history else 0) |
                        (working() if args.working else 0)))
    except (RuntimeError, ValueError, OSError) as e:
        print(f'Audit FAILED (not skipped): {e}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
```

**Node.js 18+** — `scripts/freezeAudit.cjs`. CommonJS avoids depending on `package.json` `type`:

```javascript
// Agent Docs Kit — commit-scoped change-record audit.
// Created by ghostbyte1014 · Agent Docs Kit
// Node.js 18+, CommonJS (works with either package.json module type).
'use strict';
const { spawnSync } = require('node:child_process');

const BASELINE = '<BASELINE COMMIT>'; // Set at installation. Only --history needs it.
const RECORDS_DIR = 'docs/05-operations/agents/feature-updates/';
const CODE_PATHS = /^(src\/|app\/|lib\/|scripts\/|migrations\/|supabase\/|package\.json$|pyproject\.toml$|requirements\.txt$)/; // ADAPT
const PROTECTED_PATHS = /^(AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|\.githooks\/|\.claude\/settings(?:\.off)?\.json$)/;
const RECORD_NAME = /^(\d{4}-\d{2}-\d{2})_(\d{4})(?:-\d{2})?_[a-z0-9][a-z0-9-]*\.md$/;
const TYPES = new Set(['Fix', 'Polish', 'Feature', 'New feature (approved outside the documented flow)']);

function git(...args) {
  const result = spawnSync('git', args, { encoding: 'buffer' });
  if (result.error || result.status !== 0) {
    throw Error(`git ${args.join(' ')} failed: ${result.error?.message || result.stderr?.toString('utf8').trim()}`);
  }
  return result.stdout;
}
function paths(...args) { return git(...args).toString('utf8').split('\0').filter(Boolean); }
function record(path) { return path.startsWith(RECORDS_DIR) && path.endsWith('.md') && path !== RECORDS_DIR + 'README.md'; }
function tracked(path) { return CODE_PATHS.test(path) || PROTECTED_PATHS.test(path); }
function indexText(path) { return git('show', `:${path}`).toString('utf8'); }
function commitText(commit, path) { return git('show', `${commit}:${path}`).toString('utf8'); }
function switchOn(content) {
  const matches = [...content.matchAll(/^\*\*CHANGE RECORDS:\s*(ON|OFF)\*\*\s*$/gim)];
  if (matches.length !== 1) throw Error('AGENTS.md must have exactly one CHANGE RECORDS: ON/OFF switch');
  return matches[0][1].toUpperCase() === 'ON';
}
function field(content, path, name, errors) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^- \\*\\*${escaped}:\\*\\*\\s*(.+?)\\s*$`, 'm'));
  const value = match?.[1]?.trim() || '';
  if (!value || value.includes('<') || value === 'TBD') errors.push(`${path}: missing/unfilled ${name}`);
  return value;
}
function section(content, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^## ${escaped}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'));
  return match?.[1] || '';
}
function validateRecord(path, content, changed) {
  const errors = [];
  const file = path.split('/').at(-1);
  const m = file.match(RECORD_NAME);
  if (!m) return { errors: [`${path}: invalid name (expected YYYY-MM-DD_HHMM_topic.md)`], listed: new Set() };
  const [, date, hm] = m;
  const iso = `${date}T${hm.slice(0, 2)}:${hm.slice(2)}:00Z`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 16) !== iso.slice(0, 16)) errors.push(`${path}: impossible date/time`);
  if (field(content, path, 'Date', errors) !== `${date} ${hm.slice(0, 2)}:${hm.slice(2)} (Philippine time)`)
    errors.push(`${path}: Date does not match filename (Philippine time)`);
  field(content, path, 'AI tool', errors);
  field(content, path, 'Approved by (device owner)', errors);
  field(content, path, 'Approval evidence', errors);
  if (!TYPES.has(field(content, path, 'Type', errors))) errors.push(`${path}: unsupported Type`);
  field(content, path, 'Migration', errors);
  const listed = new Set();
  const files = section(content, 'Files changed');
  for (const line of files.split('\n').filter(x => x.trim())) {
    const match = line.match(/^\s*- `([^`]+)`\s*$/);
    if (!match) errors.push(`${path}: invalid Files changed entry: ${line.trim()}`);
    else listed.add(match[1]);
  }
  if (!listed.size) errors.push(`${path}: no files listed in ## Files changed`);
  const extra = [...listed].filter(p => !changed.has(p));
  if (extra.length) errors.push(`${path}: files not changed in this commit: ${extra.join(', ')}`);
  for (const heading of ['What changed and why', 'How to verify']) {
    const body = section(content, heading).trim();
    if (!body || body.includes('<')) errors.push(`${path}: missing/unfilled ## ${heading}`);
  }
  return { errors, listed };
}
function checkChange(label, changedFiles, addedRecords, readText, agents) {
  console.log(`Checking ${label}`);
  if (!switchOn(agents)) { console.log('  Change records OFF: enforcement intentionally disabled.'); return 0; }
  const changed = new Set(changedFiles);
  const errors = [...changed].filter(p => record(p) && !addedRecords.has(p)).map(p => `Existing change record edited/deleted: ${p}`);
  const covered = new Set();
  for (const path of [...addedRecords].sort()) {
    const result = validateRecord(path, readText(path), changed);
    errors.push(...result.errors);
    for (const p of result.listed) covered.add(p);
  }
  const missing = [...changed].filter(p => tracked(p) && !covered.has(p)).sort();
  if (missing.length) errors.push('Missing NEW change-record coverage in this commit for: ' + missing.join(', '));
  if (errors.length) { for (const error of errors) console.error('  ERROR: ' + error); return 1; }
  console.log(`  Passed: ${[...changed].filter(tracked).length} tracked path(s), ${addedRecords.size} new record(s).`);
  return 0;
}
function diffPaths(...args) { return paths('diff', ...args, '--name-only', '-z', '--no-renames'); }
function staged() {
  const changed = diffPaths('--cached');
  const added = new Set(diffPaths('--cached', '--diff-filter=A').filter(record));
  return checkChange('staged files', changed, added, indexText, indexText('AGENTS.md'));
}
function history() {
  if (BASELINE.startsWith('<')) throw Error('Set BASELINE to an existing commit before using --history');
  const baseline = git('rev-parse', '--verify', `${BASELINE}^{commit}`).toString('utf8').trim();
  const head = git('rev-parse', '--verify', 'HEAD').toString('utf8').trim();
  const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', baseline, head]);
  if (ancestry.error || ancestry.status !== 0) throw Error('BASELINE must be an ancestor of HEAD; rebaseline only with approval');
  const commits = git('rev-list', '--first-parent', '--reverse', `${baseline}..HEAD`).toString('utf8').split('\n').filter(Boolean);
  let failures = 0;
  for (const commit of commits) {
    const parent = git('rev-parse', `${commit}^1`).toString('utf8').trim();
    const changed = diffPaths(parent, commit);
    const added = new Set(diffPaths('--diff-filter=A', parent, commit).filter(record));
    failures += checkChange('commit ' + commit.slice(0, 12), changed, added, path => commitText(commit, path), commitText(commit, 'AGENTS.md'));
  }
  if (!commits.length) console.log('No commits after audit baseline.');
  return Number(failures > 0);
}
function working() {
  const pending = new Set([...diffPaths(), ...paths('ls-files', '--others', '--exclude-standard', '-z')].filter(tracked));
  if (pending.size) {
    console.log('Unstaged/untracked work (cannot be commit-audited until staged):');
    for (const path of [...pending].sort()) console.log('  - ' + path);
    return 1;
  }
  console.log('No unstaged/untracked tracked paths.');
  return 0;
}
function main() {
  try {
    git('rev-parse', '--show-toplevel');
    const args = process.argv.slice(2);
    if (args.some(a => !['--staged', '--history', '--working'].includes(a))) throw Error('Unknown option; use --staged, --history, or --working');
    const defaults = args.length === 0;
    let failures = 0;
    if (defaults || args.includes('--staged')) failures |= staged();
    if (defaults || args.includes('--history')) failures |= history();
    if (args.includes('--working')) failures |= working();
    process.exitCode = Number(failures > 0);
  } catch (e) { console.error(`Audit FAILED (not skipped): ${e.message}`); process.exitCode = 2; }
}
main();
```

**Run:**

```bash
python3 scripts/freeze_audit.py --staged   # or: node scripts/freezeAudit.cjs --staged
python3 scripts/freeze_audit.py --history  # historical audit since BASELINE
python3 scripts/freeze_audit.py --working  # optional unstaged/untracked diagnostic
```

On Windows, use `python` or `py -3` only if that command is confirmed to resolve to Python 3.9+. For Node projects, an optional package script may call `node scripts/freezeAudit.cjs`; do not alter an existing package script without approval.

### C3. Commit check (pre-commit hook)

Use the exact runtime installed in C2. Create `.githooks/pre-commit` with LF line endings and make it executable in Git. If the repository already uses Husky, lefthook, or another hook manager, integrate the same `--staged` command there instead of overwriting its existing hook.

**Python version** (adapt `python3` to a confirmed interpreter for the developer's OS):

```sh
#!/bin/sh
# Staged change-record check. Created by ghostbyte1014 · Agent Docs Kit
# Fail closed if Python is unavailable. All failures block the commit.
if ! command -v python3 >/dev/null 2>&1; then
  echo "Commit blocked: Python 3 is needed for change-record verification." >&2
  exit 1
fi
python3 scripts/freeze_audit.py --staged || {
  echo "Commit blocked: stage a NEW valid change record with this code change." >&2
  exit 1
}
```

**Node version** (use instead of Python if C2 installed Node):

```sh
#!/bin/sh
# Staged change-record check. Created by ghostbyte1014 · Agent Docs Kit
if ! command -v node >/dev/null 2>&1; then
  echo "Commit blocked: Node.js is needed for change-record verification." >&2
  exit 1
fi
node scripts/freezeAudit.cjs --staged || {
  echo "Commit blocked: stage a NEW valid change record with this code change." >&2
  exit 1
}
```

**Activation** (only after developer approval):

```bash
git update-index --chmod=+x .githooks/pre-commit
git config core.hooksPath .githooks
git config --get core.hooksPath
```

A developer may instead choose an npm `prepare` script or a setup script to activate the hook, but must explicitly approve that automation. Do not silently replace an existing `prepare` script or hook. The hook rejects missing runtime, malformed records, and Git errors; it cannot prevent `git commit --no-verify`. For centralized protection, optionally configure CI to run the selected audit with `--history` on the protected branch, using a valid baseline and a checkout with commit history.

## Part D. First change record (Step 5)

~~~~markdown
# Agent docs kit setup

- **Date:** YYYY-MM-DD HH:MM (Philippine time)
- **AI tool:** <actual tool and model>
- **Approved by (device owner):** <git user.name> (<git user.email>)
- **Approval evidence:** <Exact approval to install the listed files>
- **Type:** Feature
- **Migration:** None

## Files changed
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `docs/README.md`
- `docs/archive/README.md`
- `docs/05-operations/agents/CHANGE_FREEZE_GUIDE.md`
- `docs/05-operations/agents/feature-updates/README.md`
- `docs/01-system/overview/SYSTEM_SCOPE.md`  (only if created; remove this note in the actual record)
- <add every actual add-on file created or existing file modified; remove this template note>

## What changed and why
Installed the Agent Docs Kit v3.2 compiled edition (including Session Gate), including two separate mandatory startup questions, the documentation index, the new-record-per-change workflow, and optional commit-scoped audit (ON for records, OFF for freeze). The developer approved the listed setup files. Optional add-ons installed: <C1/C2/C3 or none>.

## How to verify
- Inspect `AGENTS.md` and the documentation index; check that scope status is truthful. In a new coding chat, verify the agent asks Change Freeze and then, in a separate message, Change Records; until both are answered, verify it does not modify files.
- If C2 installed: with the setup record staged, `<AUDIT COMMAND> --staged` passes; `<AUDIT COMMAND> --history` verifies post-baseline commits.
- If C3 installed: `git config --get core.hooksPath` prints `.githooks`, and an unrecorded staged code change causes the hook to reject a test commit (without pushing).
~~~~

---

## Part E. Validation checklist for kit maintainers

These tests are required before declaring a **new adaptation** of C2/C3 reliable. Run them only in a temporary disposable Git repository; never intentionally insert failures into a production branch.

| Test | Expected result |
|---|---|
| Staged code modification, no newly staged record | **Fail** |
| Valid new record staged with code | Pass |
| An older committed record mentions the same file, but a new edit has no new record | **Fail** |
| Record file exists in working tree but has not been staged | **Fail** |
| Existing committed record is edited or deleted | **Fail** |
| Newly staged record lists a file not changed in the same commit | **Fail** |
| A tracked file is deleted or renamed without record coverage | **Fail** |
| Record missing required fields, with invalid filename/date/type | **Fail** |
| One post-baseline commit bypasses the hook, then history audit runs | **Fail** |
| C2 runtime unavailable and C3 installed | **Fail closed** |
| `CHANGE RECORDS: OFF` is deliberately set in staged `AGENTS.md` | Coverage check intentionally skipped; document the bypass |
| Only an ordinary documentation file changes | Pass without record |
| New coding chat/session loads rules | Asks Change Freeze first, then Change Records in a separate turn; no mutation before both replies |
| Both startup answers are Keep current setting | No switch-file changes; follow persisted rules |
| Startup choice differs from persisted switch and no edit approval | Stay read-only; clearly report mismatch |
| Change Records switched OFF with a new governance record | Required by policy, but **not enforced by C2** when the staged switch is OFF |

**Known limits:** The checks ensure per-commit *record coverage* and metadata format, not feature correctness, truthful timestamps, source-of-truth agreement, or genuine human authorization. The Session Gate is instructional unless supplemented by an external startup guard, and C2 intentionally permits disabling coverage through the staged `CHANGE RECORDS: OFF` switch. Local hooks can be bypassed; CI can be skipped if not required by branch protection; an administrator can disable `CHANGE RECORDS`. Merge and squash behavior should be verified on the team's real Git workflow. Protect the audit implementation, `AGENTS.md`, branch, and CI settings accordingly.
