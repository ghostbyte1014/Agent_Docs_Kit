import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "build/site");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "site"), output, { recursive: true });
await cp(resolve(root, "docs"), resolve(output, "docs"), { recursive: true });
await cp(resolve(root, "README.md"), resolve(output, "README.md"));
await cp(resolve(root, "LICENSE"), resolve(output, "LICENSE"));
await writeFile(resolve(output, ".nojekyll"), "", "utf8");
console.log(`Built site at ${output}`);
