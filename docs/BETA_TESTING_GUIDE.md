# Closed-beta testing guide

This is an early-access developer tool being evaluated with a small group. Test it in an empty or disposable copy of a repository first. Review generated files before using it in an important project. This CLI provides structural documentation checks and guided quality reviews; it is not an automatic security scanner or a guarantee that a project is safe.

## Before you start

You need:

- Node.js 22 or newer;
- npm (normally installed with Node.js);
- optionally, Git if you want to inspect changes with version control; and
- a new disposable directory containing no important files.

Running through `npx` can download and cache the package from the npm registry. It avoids a global installation; it does not avoid network access or package retrieval.

Do not test active security techniques against a service, account, network, cloud environment, credential, or production system unless you own it or have explicit authorization for that exact target.

## Five-minute path

Run these from a disposable directory:

```bash
# Read-only prerequisite report
npx @ghostbyte/agent-docs-kit@latest doctor

# Read-only onboarding choices
npx @ghostbyte/agent-docs-kit@latest start

# Read-only preview of target-project writes
npx @ghostbyte/agent-docs-kit@latest setup --dry-run
```

Expected result:

1. `doctor` reports the local Node.js and Git state; it does not install or update either tool.
2. `start` shows new, existing, AI-assisted, and manual paths without changing project files.
3. `setup --dry-run` lists the `.agent-docs/` and `docs/` paths that a real setup would own. Confirm that no files were created.

These CLI actions do not write target-project files. `npx` itself can still update its cache outside the project.

## Fifteen-to-twenty-minute path

### 1. Make a disposable repository

Create a new directory with a distinctive name, enter it, and confirm the printed working directory before proceeding. For example, use `agent-docs-beta-sandbox` below a personal temporary-work directory. Do not run this path from an important repository.

Optionally initialize Git so changes are easy to inspect:

```bash
git init
git status --short
```

### 2. Preview and create the scaffold

```bash
npx @ghostbyte/agent-docs-kit@latest setup --dry-run
npx @ghostbyte/agent-docs-kit@latest setup
```

The second command writes the owned scaffold. Inspect at least these files:

```text
AGENTS.md
.agent-docs/config.json
docs/README.md
docs/01-system/overview.md
docs/02-project/README.md
docs/05-operations/README.md
```

Confirm that the new `AGENTS.md` describes continuous documentation but does not claim to start an AI agent or background process. Existing paths are skipped by default. Do not use `--force` during a first beta run.

### 3. Verify existing agent instructions are protected

For the collision case, use a second disposable directory. Create a root `AGENTS.md` containing a distinctive fictional sentence before running `setup --dry-run` and `setup`. Confirm that the sentence remains byte-for-byte unchanged and that the CLI directs you to merge the policy from `docs/README.md` deliberately. Never perform this test with important repository instructions.

### 4. Add fictional project facts

Replace the starter prompts in the three project-specific Markdown files with simple facts about the disposable sample. Do not paste private source code, credentials, personal data, or vulnerability evidence.

Then ask the read-only workflow guide what comes next:

```bash
npx @ghostbyte/agent-docs-kit@latest next
```

If you initialized Git, optionally create a fictional browser-facing file such as `site/beta-example.html`, stage only that file, and run the advisory change tracer:

```bash
git add site/beta-example.html
npx @ghostbyte/agent-docs-kit@latest suggest reviews --staged
```

Expected result: the command prints a documentation confirmation plus path-based frontend review candidates and does not create a worksheet, install a hook, commit, or push. Review the staged path before continuing; path matching is advisory and can miss semantic risk.

### 5. Run and save a documentation structure check

```bash
npx @ghostbyte/agent-docs-kit@latest audit documentation --strict --report --format markdown
```

Expected result: the command checks required documents, placeholders, headings, configured metadata, and local links, then saves a dated Markdown report because `--report` is explicit. A failure is useful beta feedback; inspect its rule, path, and detail, fix the sample if appropriate, and rerun. A structural pass does not prove that the written facts are correct.

### 6. Create one optional worksheet

Worksheet creation requires the documentation workspace initialized in the earlier setup step. A direct security or engineering worksheet command in an uninitialized disposable project should stop and print the two setup commands rather than creating a report.

```bash
npx @ghostbyte/agent-docs-kit@latest security worksheet api-layer
```

Alternatively, try an engineering topic:

```bash
npx @ghostbyte/agent-docs-kit@latest engineering worksheet testing-types
```

Open the new dated report. Confirm that the overall status and finding begin as `Unverified`, and that evidence, owner, remediation or recommendation, and verification fields are visible. Worksheet creation should not claim that a control passed or a practice was applied.

Run `next` again. An open or structurally invalid worksheet should keep the workflow at the review stage until evidence-supported outcomes are recorded.

## Optional AI-assisted path

Preview before installing the repository-scoped skill:

```bash
npx @ghostbyte/agent-docs-kit@latest skill install --target project --dry-run
npx @ghostbyte/agent-docs-kit@latest skill install --target project
```

Restart a compatible coding agent so it can discover `.agents/skills/manage-project-quality/`. The package does not contain an AI model and does not approve sharing private repository data. Sending repository content to an AI provider may transfer it under that provider's policies, account settings, and organizational controls. Use fictional content for this beta path unless you have explicit approval to share the real repository.

## Safe cleanup

1. Leave the disposable directory and print or otherwise inspect its absolute path.
2. Confirm that its name and contents match the dedicated sandbox you created for this test.
3. Delete only that exact sandbox directory using your file manager or an operating-system command with the full literal path.

Do not use a wildcard, an environment-variable-only path, your home directory, a repository root containing other work, or a broad recursive cleanup command. If there is any doubt about the resolved path, keep the directory and ask for help instead of deleting it.

## Send useful feedback

For general defects and beta feedback, use the [issue tracker](https://github.com/ghostbyte1014/Agent_Docs_Kit/issues) and select the beta feedback template. Include:

1. operating system and Node.js version;
2. whether you understood the tool before running it (Yes / Partly / No);
3. whether you completed the safe first run without help, and where you stopped if not;
4. the workflow you tried: Documentation / Security / Engineering / AI skill;
5. which generated result was useful or confusing;
6. anything that behaved unexpectedly or modified files you did not expect;
7. whether you would use it on a real project and why; and
8. the one highest-value improvement you want next.

Do not attach credentials, private code, personal data, or unredacted vulnerability evidence. Report exploitable vulnerabilities privately through GitHub private vulnerability reporting as described in [the security policy](../SECURITY.md).

## What success looks like

The beta is successful when you can explain the automation boundary, preview every project write, distinguish new and preserved `AGENTS.md` behavior, understand the advisory review suggestions, understand one audit result, recognize that worksheets require investigation, and report where the workflow was unclear. You do not need to complete all 33 catalog areas.

## Optional invite text for owner approval

> I'm opening a small beta of Agent Docs & Quality Kit, a CLI I built to organize project documentation and guide evidence-based security and engineering reviews. It includes automated documentation structure checks, but it does not run automatic vulnerability scans. If you have Node.js 22+ and a disposable project to try, I'd appreciate feedback on whether the setup is clear and the generated outputs are genuinely useful. Website: https://agent-docs-kit.ghostbyte1014.workers.dev/
