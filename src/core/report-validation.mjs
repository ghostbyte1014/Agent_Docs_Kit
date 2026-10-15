const allowedStatuses = Object.freeze({
  security: new Set(["Pass", "Fail", "Unverified", "N/A"]),
  engineering: new Set(["Applied", "Partial", "Recommended", "Unverified", "N/A"]),
  documentation: new Set(["Pass", "Fail", "Unverified", "N/A"]),
  generic: new Set(["Pass", "Fail", "Unverified", "N/A", "Applied", "Partial", "Recommended"])
});

const placeholders = /^(?:|_|-+|none|not verified|unassigned|file\/line(?:, command output, or approved observation|, metric, trace, or test output))$/i;

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

function reportTables(text) {
  const tables = [];
  let header;
  let kind = "generic";
  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (!line.startsWith("|")) {
      header = undefined;
      continue;
    }
    if (/^\|[-: |]+\|$/.test(line)) continue;
    const cells = splitRow(line);
    if (/^\|[-: |]+\|$/.test(lines[index + 1] ?? "")) {
      header = cells.map((cell) => cell.toLowerCase());
      if (!header.includes("status")) {
        header = undefined;
        continue;
      }
      kind = header.includes("control id") ? "security" : header.includes("practice id") ? "engineering" : "generic";
      tables.push({ header, kind, rows: [] });
      continue;
    }
    if (header) tables.at(-1).rows.push({ line: index + 1, cells });
  }
  return tables;
}

export function validateReport(text) {
  const errors = [];
  const tables = reportTables(text);
  if (!tables.length) return ["No findings table with a Status column was found."];

  for (const table of tables) {
    const allowed = allowedStatuses[table.kind] ?? allowedStatuses.generic;
    const statusIndex = table.header.indexOf("status");
    const idIndex = table.header.findIndex((cell) => cell === "control id" || cell === "practice id");
    for (const row of table.rows) {
      const status = row.cells[statusIndex];
      if (!status) {
        errors.push(`Line ${row.line}: status is empty.`);
        continue;
      }
      if (!allowed.has(status)) {
        errors.push(`Line ${row.line}: invalid status '${status}'.`);
        continue;
      }
      if (status !== "Unverified") {
        if (table.kind === "security" && !/^SEC-\d{2}-\d{2}$/.test(row.cells[idIndex] ?? "")) {
          errors.push(`Line ${row.line}: status '${status}' requires a valid SEC-NN-NN control ID.`);
        }
        if (table.kind === "engineering" && !/^ENG-\d{2}-\d{2}$/.test(row.cells[idIndex] ?? "")) {
          errors.push(`Line ${row.line}: status '${status}' requires a valid ENG-NN-NN practice ID.`);
        }
      }
      if (status === "N/A") {
        const evidenceColumn = table.header.findIndex((cell) => cell === "evidence" || cell.includes("evidence"));
        if (evidenceColumn < 0 || placeholders.test(row.cells[evidenceColumn] ?? "")) errors.push(`Line ${row.line}: status 'N/A' requires an evidence rationale.`);
      } else if (status !== "Unverified") {
        for (const name of ["evidence", "owner", "verification"]) {
          const column = table.header.findIndex((cell) => cell === name || cell.includes(name));
          if (column >= 0 && placeholders.test(row.cells[column] ?? "")) errors.push(`Line ${row.line}: status '${status}' requires ${name}.`);
        }
      }
    }
  }
  return errors;
}

export function worksheetReportState(text) {
  const tables = reportTables(text);
  const kinds = new Set(tables.map((table) => table.kind).filter((kind) => kind !== "generic"));
  const kind = kinds.size === 1 ? [...kinds][0] : undefined;
  const errors = validateReport(text);
  if (!kind) errors.push("Worksheet must contain one security or engineering findings table.");

  const overall = text.match(/^- Overall status:\s*(.*?)\s*$/mi)?.[1];
  if (!overall) errors.push("Worksheet is missing an Overall status field.");
  else if (kind && !allowedStatuses[kind].has(overall)) errors.push(`Invalid overall status '${overall}' for a ${kind} worksheet.`);

  const statuses = tables.flatMap((table) => {
    const statusIndex = table.header.indexOf("status");
    return table.rows.map((row) => row.cells[statusIndex]).filter(Boolean);
  });
  const open = overall === "Unverified" || statuses.includes("Unverified");
  return { kind, overall, statuses, open, errors: [...new Set(errors)] };
}
