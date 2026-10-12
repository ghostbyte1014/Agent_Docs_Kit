# Agent Docs Kit (v3.2)

> **Turnkey documentation, change-auditing, and session-governance foundation for AI-assisted coding projects.**  
> *Created by [ghostbyte1014](https://github.com/ghostbyte1014) · Version v3.2 (Transparent Governance)*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version: v3.2](https://img.shields.io/badge/Version-v3.2-brightgreen.svg)](AGENT_DOCS_KIT_v3.2.md)
[![Session Gate: Enforced](https://img.shields.io/badge/Session_Gate-Enforced-orange.svg)](AGENT_DOCS_KIT_v3.2.md)

<p align="center">
  <a href="https://raw.githubusercontent.com/ghostbyte1014/Agent_Docs_Kit/main/AGENT_DOCS_KIT_v3.2.md" download="AGENT_DOCS_KIT_v3.2.md">
    <img src="https://img.shields.io/badge/⬇️_One--Click_Download-AGENT__DOCS__KIT__v3.2.md-159957?style=for-the-badge&logo=markdown&logoColor=white" alt="Download AGENT_DOCS_KIT_v3.2.md">
  </a>
  <a href="AGENT_DOCS_KIT_v3.2.md">
    <img src="https://img.shields.io/badge/📖_Read_Online-Full_Kit_v3.2-155799?style=for-the-badge&logo=readme&logoColor=white" alt="Read Online">
  </a>
</p>

---

## 📥 Quick Download

| Action | Resource | Description |
|:---|:---|:---|
| ⬇️ **One-Click Download** | [**`AGENT_DOCS_KIT_v3.2.md`**](https://raw.githubusercontent.com/ghostbyte1014/Agent_Docs_Kit/main/AGENT_DOCS_KIT_v3.2.md) | Single compiled markdown kit ready to drop into your project |
| 📖 **Read Online** | [**View in Browser**](AGENT_DOCS_KIT_v3.2.md) | Read the complete compiled documentation online |
| 📦 **Download Repository** | [**Download .zip**](https://github.com/ghostbyte1014/Agent_Docs_Kit/archive/refs/heads/main.zip) | Complete project bundle including `README`, `LICENSE`, and kit |

---

## Overview

**Agent Docs Kit** is a self-contained governance framework designed to give human developers complete visibility and control when working with AI coding agents (such as Claude Code, Codex, Gemini CLI, Cursor, Copilot, Antigravity, and others).

It prevents silent or unauthorized repository mutations by enforcing structured documentation, verifiable audit trails, per-file change approvals, and a mandatory startup **Session Gate**.

---

## Key Features

* 📂 **Structured Documentation Layout:** Consistent `docs/` hierarchy with document status labeling (`Current`, `Reference`, `Needs update`, `Archived`) tied to an authoritative scope baseline.
* 🚪 **Mandatory Session Gate:** When an agent starts a new coding session, it must ask **two sequential startup questions** (`Change Freeze` first, then `Change Records`) before any write or mutating operations are permitted.
* 🔒 **Change Freeze Guardrails:** A switchable policy (`FREEZE: ON/OFF`) requiring explicit developer permission before modifying each tracked file.
* 📝 **Commit-Scoped Audit Records:** Immutable, Philippine-time (UTC+8) change records logging what changed, why, which files were touched, and who approved the change.
* 🛠️ **Enforcement Add-ons:** Ready-to-use Git pre-commit hooks and audit scripts (supporting both **Node.js 18+** and **Python 3.9+**) to block commits that lack verified records.

---

## Evolution Milestones (v1.0 – v3.2)

| Version Family | Milestone | Description |
|---|---|---|
| **v1 — Documentation & Change Control** | v1.0 – v1.2 | Standard `docs/` layout, scope definition, `AGENTS.md` rules, `FREEZE` & `CHANGE RECORDS` policy switches. |
| **v2 — Reliability & Git Enforcement** | v2.0 – v2.2 | Commit traceability, audit scripts (Node/Python), append-only validation, Git pre-commit hook integration. |
| **v3 — Session Control & Governance** | v3.0 – v3.2 | Mandatory 2-question startup Session Gate, persistent switch handling, cross-tool transparent governance. |

---

## Getting Started

To install Agent Docs Kit into any software project:

1. Open the complete compiled kit: [**`AGENT_DOCS_KIT_v3.2.md`**](AGENT_DOCS_KIT_v3.2.md).
2. Provide the file to your AI coding agent (e.g., Claude Code, Cursor, Gemini, Copilot).
3. Instruct the agent:
   > *"Read AGENT_DOCS_KIT_v3.2.md and follow Step 1 through Step 6 to set up this project."*
4. The agent will inspect your repository, ask you the configuration questions, and generate the necessary files from the included templates.

---

## Package Updates & Creator Note

* **Creator & Package Maintainer:** `ghostbyte1014`
* **Independent / Custom Updates:** Developers and AI agents are free to adapt, customize, or extend the kit for their project's needs. Because custom changes diverge from the maintainer's planned release progression, **local modifications are non-linear**.
* **Official Linear Updates:** If you prefer clean, linear updates maintained by the creator, request the next update package from **ghostbyte1014**.

---

## License

This project is licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.  
*Please preserve the `Created by ghostbyte1014` attribution.*
