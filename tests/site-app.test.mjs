import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../site/app.js", import.meta.url), "utf8");

function loadCopyButton(writeText) {
  const attributes = new Map();
  const code = { textContent: "  prompt to copy  " };
  let click;
  let timeout;
  let selectedNode;
  let selectionCleared = false;
  let selectedRange;
  const range = { selectNodeContents(node) { selectedNode = node; } };
  const selection = {
    removeAllRanges() { selectionCleared = true; },
    addRange(value) { selectedRange = value; }
  };
  const container = { querySelector(selector) { return selector === "code" ? code : undefined; } };
  const button = {
    textContent: "Copy prompt",
    closest(selector) { return selector === ".install-code" ? container : undefined; },
    setAttribute(name, value) { attributes.set(name, value); },
    addEventListener(name, listener) { if (name === "click") click = listener; }
  };
  const context = {
    document: {
      documentElement: { classList: { add() {} } },
      querySelectorAll(selector) { return selector === "[data-copy-visible]" ? [button] : []; },
      createRange() { return range; }
    },
    navigator: { clipboard: { writeText } },
    window: {
      getSelection() { return selection; },
      setTimeout(callback, delay) { timeout = { callback, delay }; }
    }
  };
  vm.runInNewContext(source, context, { filename: "site/app.js" });
  return {
    attributes,
    button,
    click: () => click(),
    code,
    get timeout() { return timeout; },
    get selectedNode() { return selectedNode; },
    get selectionCleared() { return selectionCleared; },
    get selectedRange() { return selectedRange; },
    range
  };
}

test("copy button writes visible prompt text and restores its accessible label", async () => {
  const writes = [];
  const fixture = loadCopyButton(async (value) => writes.push(value));
  assert.equal(fixture.attributes.get("aria-live"), "polite");
  await fixture.click();
  assert.deepEqual(writes, ["prompt to copy"]);
  assert.equal(fixture.button.textContent, "Copied");
  assert.equal(fixture.timeout.delay, 1600);
  fixture.timeout.callback();
  assert.equal(fixture.button.textContent, "Copy prompt");
});

test("copy button selects visible text when clipboard access is rejected", async () => {
  const fixture = loadCopyButton(async () => { throw new Error("clipboard denied"); });
  await fixture.click();
  assert.equal(fixture.selectedNode, fixture.code);
  assert.equal(fixture.selectionCleared, true);
  assert.equal(fixture.selectedRange, fixture.range);
  assert.equal(fixture.button.textContent, "Selected—copy manually");
  assert.equal(fixture.attributes.get("aria-live"), "polite");
  fixture.timeout.callback();
  assert.equal(fixture.button.textContent, "Copy prompt");
});
