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
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const next = workflowTabs[(index + offset + workflowTabs.length) % workflowTabs.length];
    selectWorkflow(next.dataset.tab, true);
  });
});

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

const commandPrefixes = {
  npx: "npx @ghostbyte/agent-docs-kit@latest",
  global: "agent-docs"
};

const commandExamples = {
  setup: ["start existing", "", "next", "", "list documentation", "", "documentation guide system-documentation", "", "audit documentation --strict"],
  security: ["list security", "security worksheet api-layer --style learning"],
  engineering: ["list engineering", "engineering worksheet testing-types"],
  skill: ["skill install --target project", "", "# Creates:", "# .agents/skills/manage-project-quality"]
};

const commandModeHelp = {
  npx: "No installation required. npx downloads and runs the published package when you invoke it.",
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

document.querySelectorAll("[data-copy], [data-copy-command]").forEach((button) => {
  button.addEventListener("click", async () => {
    const previous = button.textContent;
    try {
      await navigator.clipboard.writeText(button.dataset.copy.replaceAll("\\n", "\n"));
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy failed";
    }
    window.setTimeout(() => { button.textContent = previous; }, 1600);
  });
});
