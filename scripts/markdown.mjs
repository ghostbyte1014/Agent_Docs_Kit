// Minimal Markdown -> HTML renderer for the kit's own docs (headings, paragraphs,
// fenced code, ordered/unordered lists, pipe tables, bold/code/link inline spans).
// Kept dependency-free on purpose: the project ships zero runtime dependencies,
// and this only needs to cover the handful of constructs actually used in docs/*.md.

export const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function normalizeHref(href) {
  const decoded = href.replaceAll("&amp;", "&");
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded) && !/^(?:https?:|mailto:)/i.test(decoded)) return undefined;
  const external = /^(?:https?:|\/\/)/i.test(decoded);
  const rewritten = external ? decoded : decoded.replace(/\.md(?=([?#]|$))/i, ".html");
  return escapeHtml(rewritten);
}

function renderInline(text) {
  let escaped = escapeHtml(text);
  escaped = escaped.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const safeHref = normalizeHref(href);
    if (!safeHref) return label;
    const external = /^(?:https?:|\/\/)/i.test(safeHref);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${safeHref}"${attrs}>${label}</a>`;
  });
  return escaped;
}

function renderTable(lines) {
  const [headerLine, , ...bodyLines] = lines;
  const split = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
  const headers = split(headerLine);
  const rows = bodyLines.map(split);
  const head = `<tr>${headers.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr>`;
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("");
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

export function renderMarkdown(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) { index += 1; continue; }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      index += 1;
      continue;
    }

    const fence = line.match(/^```(\S*)\s*$/);
    if (fence) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) { codeLines.push(lines[index]); index += 1; }
      index += 1;
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : "";
      html.push(`<pre><code${language}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^\s*\|.+\|\s*$/.test(line) && /^\s*\|[-:| ]+\|\s*$/.test(lines[index + 1] ?? "")) {
      const tableLines = [line, lines[index + 1]];
      index += 2;
      while (index < lines.length && /^\s*\|.+\|\s*$/.test(lines[index])) { tableLines.push(lines[index]); index += 1; }
      html.push(renderTable(tableLines));
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      const items = [ordered[1]];
      index += 1;
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) { items.push(lines[index].replace(/^\d+\.\s+/, "")); index += 1; }
      html.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      const items = [unordered[1]];
      index += 1;
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) { items.push(lines[index].replace(/^[-*]\s+/, "")); index += 1; }
      html.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,6}\s|```|\d+\.\s|[-*]\s)/.test(lines[index])) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    html.push(`<p>${renderInline(paragraphLines.join(" ").trim())}</p>`);
  }
  return html.join("\n");
}
