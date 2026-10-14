import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { publicDocs } from "./public-docs.mjs";
import { escapeHtml, renderMarkdown } from "./markdown.mjs";

const docLabels = {
  "ARCHITECTURE.md": "Architecture",
  "CONTENT_MAINTENANCE.md": "Content maintenance",
  "GITHUB_AND_NPM_SETUP.md": "GitHub and npm setup",
  "PURPOSE.md": "Purpose",
  "RELEASE_PROCESS.md": "Release process",
  "SECURITY_MODEL.md": "Security model"
};

function docPage(name, title, bodyHtml) {
  const safeTitle = escapeHtml(title);
  const securityCurrent = name === "SECURITY_MODEL.md" ? ' class="is-current"' : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${safeTitle} — Agent Docs & Quality Kit documentation.">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'">
  <title>${safeTitle} — Agent Docs &amp; Quality Kit</title>
  <link rel="stylesheet" href="../styles.css">
</head>
<body class="doc-page">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="doc-nav-wrap">
    <div class="shell doc-nav">
      <a class="brand" href="../index.html" aria-label="Agent Docs and Quality Kit home">
        <span class="brand-mark" aria-hidden="true">AQ</span>
        <span>Agent Docs &amp; Quality</span>
      </a>
      <a class="doc-back" href="../index.html">&larr; Back to overview</a>
    </div>
  </header>
  <main id="main">
    <div class="shell">
      <article class="doc-body">
        <p class="doc-eyebrow">Documentation</p>
        ${bodyHtml}
        <nav class="doc-footer-nav" aria-label="Legal and trust pages"><a href="../privacy.html">Privacy</a><a href="../terms.html">Terms of use</a><a href="SECURITY_MODEL.html"${securityCurrent}>Security model</a></nav>
      </article>
    </div>
  </main>
</body>
</html>
`;
}

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "build/site");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "site"), output, { recursive: true });
await mkdir(resolve(output, "docs"));
for (const name of publicDocs) {
  const source = await readFile(resolve(root, "docs", name), "utf8");
  const title = source.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? docLabels[name];
  const html = docPage(name, title, renderMarkdown(source));
  await writeFile(resolve(output, "docs", name.replace(/\.md$/, ".html")), html, "utf8");
}
await cp(resolve(root, "README.md"), resolve(output, "README.md"));
await cp(resolve(root, "LICENSE"), resolve(output, "LICENSE"));
await writeFile(resolve(output, ".nojekyll"), "", "utf8");
console.log(`Built site at ${output}`);
