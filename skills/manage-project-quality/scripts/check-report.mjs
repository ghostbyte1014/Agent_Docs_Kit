#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) throw new Error("Usage: node check-report.mjs <report.md>");
const text = await readFile(file, "utf8");
const allowed = new Set(["Pass", "Fail", "Unverified", "N/A", "Applied", "Partial", "Recommended"]);
const errors = [];
for (const [index, line] of text.split(/\r?\n/).entries()) {
  if (!line.startsWith("|") || /^\|[-: |]+\|$/.test(line)) continue;
  const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
  const status = cells.find((cell) => allowed.has(cell));
  if (status && status !== "Unverified" && !cells.some((cell, cellIndex) => cellIndex > 1 && cell.length > 3)) {
    errors.push(`Line ${index + 1}: status '${status}' has no supporting detail.`);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Report structure check passed.");
}
