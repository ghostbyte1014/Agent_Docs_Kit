import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { parseArguments, optionsFromFlags } from "./arguments.mjs";
import { helpText } from "./help.mjs";
import { setupProject } from "../commands/setup.mjs";
import { auditDocumentation, auditSecurity, reviewEngineering } from "../commands/audit.mjs";
import { listCatalog } from "../commands/list.mjs";
import { installSkill } from "../commands/skill.mjs";
import { doctor } from "../commands/doctor.mjs";
import { validatePackage } from "../commands/validate.mjs";
import { openWebsite } from "../commands/website.mjs";
import { createTemplate, listTemplates } from "../commands/template.mjs";
import { showDocumentationGuide } from "../commands/guide.mjs";
import { nextWorkflow, startWorkflow } from "../commands/workflow.mjs";
import { readFile } from "node:fs/promises";
import { resolveFromPackage } from "../core/paths.mjs";

function assertInvocation(positionals, flags, { counts, allowedFlags = [], usage, exclusive = [] }) {
  if (!counts.includes(positionals.length)) throw new Error(`Invalid arguments. Usage: ${usage}`);
  const allowed = new Set(allowedFlags);
  const unexpected = Object.keys(flags).filter((flag) => !allowed.has(flag));
  if (unexpected.length) throw new Error(`Option '--${unexpected[0]}' is not valid here. Usage: ${usage}`);
  for (const [positionalIndex, flag] of exclusive) {
    if (positionals[positionalIndex] && flags[flag]) throw new Error(`Choose either '${positionals[positionalIndex]}' or '--${flag}', not both.`);
  }
}

async function menu() {
  const ui = createInterface({ input: stdin, output: stdout });
  try {
    console.log(`\nAgent Docs & Quality Kit\n\nStart and continue\n1. Choose a starting path\n2. Continue from the current project state\n\nFocused workflows\n3. Set up documentation\n4. Audit documentation\n5. Create security worksheet\n6. Create engineering worksheet\n7. Install project skill\n\nReference and maintenance\n8. List documentation templates\n9. Validate package\n10. Open documentation website\n0. Exit`);
    const choice = await ui.question("\nChoose an action: ");
    if (choice === "1") {
      console.log("\n1. New or empty project\n2. Existing project\n3. AI-assisted workflow\n4. Manual workflow");
      const path = await ui.question("Choose a starting path: ");
      return startWorkflow({ "1": "new", "2": "existing", "3": "agent", "4": "manual" }[path]);
    }
    if (choice === "2") return nextWorkflow();
    if (choice === "3") return setupProject();
    if (choice === "4") return auditDocumentation();
    if (choice === "5") {
      await listCatalog("security");
      return auditSecurity(await ui.question("Phase id or slug: "));
    }
    if (choice === "6") {
      await listCatalog("engineering");
      return reviewEngineering(await ui.question("Topic id or slug: "));
    }
    if (choice === "7") return installSkill("project");
    if (choice === "8") return listTemplates();
    if (choice === "9") return validatePackage();
    if (choice === "10") return openWebsite();
    if (choice !== "0") throw new Error("Unknown menu choice.");
  } finally {
    ui.close();
  }
}

export async function main(argv) {
  const { positionals, flags } = parseArguments(argv);
  const [command, subject, selector] = positionals;
  if (flags.version || command === "version") {
    if (!flags.version) assertInvocation(positionals, flags, { counts: [1], usage: "agent-docs version" });
    const metadata = JSON.parse(await readFile(resolveFromPackage("package.json"), "utf8"));
    return console.log(metadata.version);
  }
  if (flags.help || command === "help") return console.log(helpText);
  const options = optionsFromFlags(flags);
  if (!command) {
    assertInvocation(positionals, flags, { counts: [0], usage: "agent-docs" });
    if (!stdin.isTTY) {
      console.log(helpText);
      return;
    }
    return menu();
  }
  if (command === "start") {
    assertInvocation(positionals, flags, { counts: [1, 2], usage: "agent-docs start [new|existing|agent|manual]" });
    return startWorkflow(subject);
  }
  if (command === "next") {
    assertInvocation(positionals, flags, { counts: [1], allowedFlags: ["cwd"], usage: "agent-docs next [--cwd <path>]" });
    return nextWorkflow(options);
  }
  if (command === "setup") {
    assertInvocation(positionals, flags, { counts: [1], allowedFlags: ["cwd", "dry-run", "force"], usage: "agent-docs setup [--cwd <path>] [--dry-run] [--force]" });
    return setupProject(options);
  }
  if (command === "audit" && subject === "documentation") {
    assertInvocation(positionals, flags, { counts: [2], allowedFlags: ["cwd", "dry-run", "force", "report", "strict", "format"], usage: "agent-docs audit documentation [--strict] [--report] [--format text|markdown|json]" });
    const result = await auditDocumentation(options);
    if (options.strict && !result.pass) process.exitCode = 1;
    return result;
  }
  if ((command === "audit" && subject === "security") || (command === "security" && subject === "worksheet")) {
    assertInvocation(positionals, flags, { counts: [2, 3], allowedFlags: ["cwd", "dry-run", "force", "style", "phase"], usage: "agent-docs security worksheet <phase>", exclusive: [[2, "phase"]] });
    return auditSecurity(selector ?? flags.phase, options);
  }
  if ((command === "review" && subject === "engineering") || (command === "engineering" && subject === "worksheet")) {
    assertInvocation(positionals, flags, { counts: [2, 3], allowedFlags: ["cwd", "dry-run", "force", "style", "topic"], usage: "agent-docs engineering worksheet <topic>", exclusive: [[2, "topic"]] });
    return reviewEngineering(selector ?? flags.topic, options);
  }
  if (command === "list") {
    assertInvocation(positionals, flags, { counts: [2], usage: "agent-docs list documentation|security|engineering" });
    return listCatalog(subject);
  }
  if (command === "documentation" && subject === "guide") {
    assertInvocation(positionals, flags, { counts: [3], usage: "agent-docs documentation guide <area>" });
    return showDocumentationGuide(selector);
  }
  if (command === "skill" && subject === "install") {
    assertInvocation(positionals, flags, { counts: [2], allowedFlags: ["cwd", "dry-run", "force", "target"], usage: "agent-docs skill install --target project|codex" });
    return installSkill(flags.target ?? "project", options);
  }
  if (command === "template" && subject === "list") {
    assertInvocation(positionals, flags, { counts: [2], usage: "agent-docs template list" });
    return listTemplates();
  }
  if (command === "template" && subject === "create") {
    assertInvocation(positionals, flags, { counts: [2, 3], allowedFlags: ["cwd", "dry-run", "force", "type", "name"], usage: "agent-docs template create <type> [--name <slug>]", exclusive: [[2, "type"]] });
    return createTemplate(selector ?? flags.type, options);
  }
  if (command === "validate") {
    assertInvocation(positionals, flags, { counts: [1], usage: "agent-docs validate" });
    return validatePackage();
  }
  if (command === "website") {
    assertInvocation(positionals, flags, { counts: [1], usage: "agent-docs website" });
    return openWebsite();
  }
  if (command === "doctor") {
    assertInvocation(positionals, flags, { counts: [1], usage: "agent-docs doctor" });
    if (!doctor()) process.exitCode = 1;
    return;
  }
  throw new Error(`Unknown command.\n\n${helpText}`);
}
