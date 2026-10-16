// Single source of truth for detecting unreplaced scaffold text.
// Both `audit documentation` and `next` import from here so they never
// disagree about whether a starter document still needs project facts.

export const starterMarkerName = "agent-docs:starter";

// Matched anywhere outside a fenced code block. The explanatory text inside
// the comment may change without breaking detection.
const markerPattern = /<!--\s*agent-docs:starter\b/i;

// Prose that `setup` writes into the starter documents. This fallback exists so
// deleting a marker without replacing the content does not clear the check.
//
// It is applied ONLY to the documents `setup` owns (see starterDocumentPaths).
// Several of these phrases are legitimate elsewhere: "Status: Needs update" is
// one of the statuses the generated docs/README.md tells users to apply, and
// archived material keeps superseded wording that policy says not to edit.
// Matching them in any document turned honest labelling into an audit failure.
const phrasePatterns = Object.freeze([
  /Status:\s*Needs update/i,
  /Describe the system boundary/i,
  /Track requirements/i,
  /Document setup, deployment/i
]);

// The scaffold documents `setup` generates with a starter marker. Paths are
// project-relative with forward slashes, matching the audit's report paths.
export const starterDocumentPaths = Object.freeze([
  "docs/01-system/overview.md",
  "docs/02-project/README.md",
  "docs/05-operations/README.md"
]);

export const normalizeReportPath = (value) => String(value).replaceAll("\\", "/");

export const isStarterDocument = (path) => starterDocumentPaths.includes(normalizeReportPath(path));

export function withoutFencedCode(value) {
  return value.replace(/^(```|~~~)[\s\S]*?^\1\s*$/gm, "");
}

export function starterMarker(instruction) {
  return `<!-- ${starterMarkerName}: ${instruction} Replace the text above with verified project facts, then delete this line. While it is present, 'audit documentation --strict' fails. -->`;
}

// Returns null when the text carries no starter signal, otherwise the reason.
// `path` is the project-relative path; without it only the marker is matched,
// because the prose fallback is meaningful only for an owned starter document.
export function starterTextSignal(value, { stripFences = true, path } = {}) {
  const inspectable = stripFences ? withoutFencedCode(value) : value;
  if (markerPattern.test(inspectable)) {
    return { kind: "marker", detail: `Unreplaced starter scaffold. Replace the starter text with verified project facts, then delete the '<!-- ${starterMarkerName}: ... -->' marker.` };
  }
  if (path === undefined || !isStarterDocument(path)) return null;
  const phrase = phrasePatterns.find((pattern) => pattern.test(inspectable));
  if (phrase) {
    const matched = inspectable.match(phrase)?.[0] ?? "";
    return { kind: "phrase", detail: `Unreplaced starter scaffold text ("${matched.trim()}"). Replace it with verified project facts.` };
  }
  return null;
}

export const containsStarterText = (value, options) => starterTextSignal(value, options) !== null;
