import { readFile } from "node:fs/promises";

const catalog = JSON.parse(await readFile(new URL("../content/catalog.json", import.meta.url), "utf8"));
const asOfFlag = process.argv.indexOf("--as-of");
const now = new Date();
const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const today = asOfFlag >= 0 ? process.argv[asOfFlag + 1] : localToday;
const parsedToday = new Date(`${today}T00:00:00Z`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || Number.isNaN(parsedToday.getTime()) || parsedToday.toISOString().slice(0, 10) !== today) throw new Error("Use a valid --as-of YYYY-MM-DD date.");
const overdue = [];
for (const kind of ["documentation", "security", "engineering"]) {
  for (const entry of catalog[kind]) {
    if (entry.reviewDue < today) overdue.push(`${kind}:${entry.id} ${entry.slug} (due ${entry.reviewDue})`);
  }
}
if (overdue.length) {
  console.error(`Review controls overdue as of ${today}:\n${overdue.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`PASS review dates (${catalog.documentation.length + catalog.security.length + catalog.engineering.length} areas checked as of ${today})`);
}
