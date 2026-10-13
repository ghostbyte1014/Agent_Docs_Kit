#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const statuses = {
  security: new Set(["Pass", "Fail", "Unverified", "N/A"]),
  engineering: new Set(["Applied", "Partial", "Recommended", "Unverified", "N/A"]),
  documentation: new Set(["Pass", "Fail", "Unverified", "N/A"]),
  generic: new Set(["Pass", "Fail", "Unverified", "N/A", "Applied", "Partial", "Recommended"])
};
const placeholders = /^(?:|_|-+|none|not verified|unassigned)$/i;

function splitRow(line) {
  const cells = [];
  let cell = "";
  for (let index = 1; index < line.length - 1; index += 1) {
    if (line[index] === "|" && line[index - 1] !== "\\") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += line[index];
    }
  }
  cells.push(cell.trim());
  return cells;
}

export function validateReport(text) {
  const errors = [];
  let header;
  let allowed = statuses.generic;
  let foundFindings = false;
  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (!line.startsWith("|")) { header = undefined; continue; }
    if (/^\|[-: |]+\|$/.test(line)) continue;
    const cells = splitRow(line);
    if (/^\|[-: |]+\|$/.test(lines[index + 1] ?? "")) {
      header = cells.map((cell) => cell.toLowerCase());
      if (!header.includes("status")) { header = undefined; continue; }
      foundFindings = true;
      allowed = header.includes("control id") ? statuses.security : header.includes("practice id") ? statuses.engineering : statuses.generic;
      continue;
    }
    if (!header) continue;
    const statusIndex = header.indexOf("status");
    const status = cells[statusIndex];
    if (!status) { errors.push(`Line ${index + 1}: status is empty.`); continue; }
    if (!allowed.has(status)) { errors.push(`Line ${index + 1}: invalid status '${status}'.`); continue; }
    if (!["Unverified", "N/A"].includes(status)) {
      for (const name of ["evidence", "owner", "verification"]) {
        const column = header.findIndex((cell) => cell === name || cell.includes(name));
        if (column >= 0 && placeholders.test(cells[column] ?? "")) errors.push(`Line ${index + 1}: status '${status}' requires ${name}.`);
      }
    }
  }
  if (!foundFindings) errors.push("No findings table with a Status column was found.");
  return errors;
}

export async function checkReport(file) {
  const errors = validateReport(await readFile(file, "utf8"));
  if (errors.length) throw new Error(errors.join("\n"));
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: node check-report.mjs <report.md>");
  try { await checkReport(file); console.log("Report structure check passed."); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
