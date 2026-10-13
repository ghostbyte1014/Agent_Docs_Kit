import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const excluded = new Set([".agents", ".codex", ".git", ".npm-cache", "build", "node_modules"]);
const cache = new Map();

async function files(directory) {
  const found = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.isDirectory() && excluded.has(item.name)) continue;
    const path = resolve(directory, item.name);
    if (item.isDirectory()) found.push(...await files(path));
    else if (item.isFile() && extname(path).toLowerCase() === ".md") found.push(path);
  }
  return found;
}

function slug(value) {
  return value.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-");
}

const errors = [];
for (const file of await files(root)) {
  const value = await readFile(file, "utf8");
  cache.set(file, value);
  const inspectable = value.replace(/^(```|~~~)[\s\S]*?^\1\s*$/gm, "");
  for (const match of inspectable.matchAll(/\[[^\]]+\]\((<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\)/g)) {
    const raw = match[1].trim().replace(/^<|>$/g, "");
    if (!raw || /^(?:https?:|mailto:)/i.test(raw)) continue;
    const [pathPart, fragment] = raw.split("#", 2);
    let decodedPath;
    let decodedFragment;
    try {
      decodedPath = pathPart ? decodeURIComponent(pathPart) : "";
      decodedFragment = fragment ? decodeURIComponent(fragment).toLowerCase() : "";
    } catch {
      errors.push(`${relative(root, file)} -> invalid URL encoding ${raw}`);
      continue;
    }
    const target = decodedPath ? resolve(dirname(file), decodedPath) : file;
    let targetValue;
    try {
      if (!cache.has(target)) cache.set(target, await readFile(target, "utf8"));
      targetValue = cache.get(target);
    }
    catch { errors.push(`${relative(root, file)} -> missing ${raw}`); continue; }
    if (fragment && extname(target).toLowerCase() === ".md") {
      const anchors = new Set([...targetValue.matchAll(/^#{1,6}\s+(.+)$/gm)].map(([, heading]) => slug(heading)));
      if (!anchors.has(decodedFragment)) errors.push(`${relative(root, file)} -> missing anchor ${raw}`);
    }
  }
}

if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log("PASS internal Markdown links and anchors");
