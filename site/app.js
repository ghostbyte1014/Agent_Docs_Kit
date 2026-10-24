document.documentElement.classList.add("js");

function visibleCopyText(button) {
  const container = button.closest(".install-code");
  return container?.querySelector("code")?.textContent?.trim() ?? "";
}

document.querySelectorAll("[data-copy-visible]").forEach((button) => {
  button.setAttribute("aria-live", "polite");
  button.addEventListener("click", async () => {
    const previous = button.textContent;
    try {
      await navigator.clipboard.writeText(visibleCopyText(button));
      button.textContent = "Copied";
    } catch {
      const code = button.closest(".install-code")?.querySelector("code");
      const selection = window.getSelection();
      if (code && selection) {
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = "Selected—copy manually";
      } else {
        button.textContent = "Copy failed";
      }
    }
    window.setTimeout(() => { button.textContent = previous; }, 1600);
  });
});
