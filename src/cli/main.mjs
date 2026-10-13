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
import { readFile } from "node:fs/promises";
import { resolveFromPackage } from "../core/paths.mjs";

async function menu() {
  const ui = createInterface({ input: stdin, output: stdout });
  try {
    console.log(`\nAgent Docs & Quality Kit\n\n1. Set up documentation\n2. Audit documentation\n3. Start security audit\n4. Start engineering review\n5. Install project skill\n6. Validate package\n0. Exit`);
    const choice = await ui.question("\nChoose an action: ");
    if (choice === "1") return setupProject();
    if (choice === "2") return auditDocumentation();
    if (choice === "3") {
      await listCatalog("security");
      return auditSecurity(await ui.question("Phase id or slug: "));
    }
    if (choice === "4") {
      await listCatalog("engineering");
      return reviewEngineering(await ui.question("Topic id or slug: "));
    }
    if (choice === "5") return installSkill("project");
    if (choice === "6") return validatePackage();
    if (choice !== "0") throw new Error("Unknown menu choice.");
  } finally {
    ui.close();
  }
}

export async function main(argv) {
  const { positionals, flags } = parseArguments(argv);
  const [command, subject, selector] = positionals;
  const options = optionsFromFlags(flags);
  if (flags.version || command === "version") {
    const metadata = JSON.parse(await readFile(resolveFromPackage("package.json"), "utf8"));
    return console.log(metadata.version);
  }
  if (flags.help || command === "help") return console.log(helpText);
  if (!command) {
    if (!stdin.isTTY) {
      console.log(helpText);
      return;
    }
    return menu();
  }
  if (command === "setup") return setupProject(options);
  if (command === "audit" && subject === "documentation") return auditDocumentation(options);
  if (command === "audit" && subject === "security") return auditSecurity(selector ?? flags.phase, options);
  if (command === "review" && subject === "engineering") return reviewEngineering(selector ?? flags.topic, options);
  if (command === "list") return listCatalog(subject);
  if (command === "skill" && subject === "install") return installSkill(flags.target ?? "project", options);
  if (command === "validate") return validatePackage();
  if (command === "doctor") {
    if (!doctor()) process.exitCode = 1;
    return;
  }
  throw new Error(`Unknown command.\n\n${helpText}`);
}
