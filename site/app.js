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
codeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    codeTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    codePanels.forEach((panel) => { panel.hidden = panel.dataset.codePanel !== tab.dataset.codeTab; });
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const previous = button.textContent;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy failed";
    }
    window.setTimeout(() => { button.textContent = previous; }, 1600);
  });
});
