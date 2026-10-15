document.documentElement.classList.add("js");

const workflowTabs = [...document.querySelectorAll("[data-tab]")];
const workflowPanels = [...document.querySelectorAll("[data-panel]")];

function selectWorkflow(name, focus = false) {
  workflowTabs.forEach((tab) => {
    const selected = tab.dataset.tab === name;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  workflowPanels.forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
}

workflowTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectWorkflow(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = event.key === "Home" ? 0 : event.key === "End" ? workflowTabs.length - 1 : index + (event.key === "ArrowRight" ? 1 : -1);
    nextIndex = (nextIndex + workflowTabs.length) % workflowTabs.length;
    const next = workflowTabs[nextIndex];
    selectWorkflow(next.dataset.tab, true);
  });
});
if (workflowTabs.length) selectWorkflow(workflowTabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.tab ?? workflowTabs[0].dataset.tab);

const codeTabs = [...document.querySelectorAll("[data-code-tab]")];
const codePanels = [...document.querySelectorAll("[data-code-panel]")];

function selectCodeTab(name, focus = false) {
  codeTabs.forEach((tab) => {
    const selected = tab.dataset.codeTab === name;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  codePanels.forEach((panel) => { panel.hidden = panel.dataset.codePanel !== name; });
}

codeTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectCodeTab(tab.dataset.codeTab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = event.key === "Home" ? 0 : event.key === "End" ? codeTabs.length - 1 : index + (event.key === "ArrowRight" ? 1 : -1);
    nextIndex = (nextIndex + codeTabs.length) % codeTabs.length;
    selectCodeTab(codeTabs[nextIndex].dataset.codeTab, true);
  });
});
if (codeTabs.length) selectCodeTab(codeTabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.codeTab ?? codeTabs[0].dataset.codeTab);

const commandPrefixes = {
  npx: "npx @ghostbyte/agent-docs-kit@latest",
  global: "agent-docs"
};

const commandExamples = {
  setup: ["start existing", "", "setup --dry-run", "audit documentation --strict"],
  security: ["list security", "security worksheet api-layer --style learning"],
  engineering: ["list engineering", "engineering worksheet testing-types"],
  skill: ["skill install --target project", "", "# Creates:", "# .agents/skills/manage-project-quality"]
};

const commandModeHelp = {
  npx: "No global installation required. npx downloads and runs the published package when you invoke it.",
  global: "Use the shorter agent-docs command after installing the package globally. Check its version periodically for updates."
};

const commandModeButtons = [...document.querySelectorAll("[data-command-mode]")];
const commandModeHelpElement = document.querySelector("[data-command-mode-help]");

function formatCommand(suffix = "", mode = "npx") {
  return `${commandPrefixes[mode]}${suffix ? ` ${suffix}` : ""}`;
}

function savedCommandMode() {
  try {
    const saved = window.localStorage.getItem("agent-docs-command-mode");
    return saved === "global" ? "global" : "npx";
  } catch {
    return "npx";
  }
}

function selectCommandMode(mode) {
  commandModeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.commandMode === mode));
  });

  document.querySelectorAll("[data-command]").forEach((element) => {
    element.textContent = formatCommand(element.dataset.command, mode);
  });

  document.querySelectorAll("[data-command-example]").forEach((element) => {
    const lines = commandExamples[element.dataset.commandExample] ?? [];
    element.textContent = lines.map((line) => line && !line.startsWith("#") ? formatCommand(line, mode) : line).join("\n");
  });

  document.querySelectorAll("[data-copy-command]").forEach((button) => {
    button.dataset.copy = formatCommand(button.dataset.copyCommand, mode);
  });

  if (commandModeHelpElement) commandModeHelpElement.textContent = commandModeHelp[mode];
  try { window.localStorage.setItem("agent-docs-command-mode", mode); } catch {}
}

commandModeButtons.forEach((button) => {
  button.addEventListener("click", () => selectCommandMode(button.dataset.commandMode));
});
selectCommandMode(savedCommandMode());

function visibleCopyText(button) {
  if (button.hasAttribute("data-copy-visible")) {
    const container = button.closest(".code-panel, .install-code");
    return container?.querySelector("pre code, code")?.textContent?.trim() ?? "";
  }
  return (button.dataset.copy ?? "").replaceAll("\\n", "\n");
}

document.querySelectorAll("[data-copy], [data-copy-command], [data-copy-visible]").forEach((button) => {
  button.addEventListener("click", async () => {
    const previous = button.textContent;
    try {
      await navigator.clipboard.writeText(visibleCopyText(button));
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy failed";
    }
    window.setTimeout(() => { button.textContent = previous; }, 1600);
  });
});
