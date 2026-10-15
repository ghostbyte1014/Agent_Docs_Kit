const booleanFlags = new Set(["dry-run", "force", "report", "strict", "staged", "help", "version"]);
const valueFlags = new Set(["cwd", "style", "target", "phase", "topic", "format", "type", "name", "base"]);
const allowedStyles = new Set(["standard", "learning"]);
const allowedFormats = new Set(["text", "markdown", "json"]);

export function parseArguments(argv) {
  const positionals = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const [rawKey, inline] = token.slice(2).split("=", 2);
    if (!booleanFlags.has(rawKey) && !valueFlags.has(rawKey)) {
      throw new Error(`Unknown option '--${rawKey}'. Run 'agent-docs --help'.`);
    }
    if (inline !== undefined) {
      if (booleanFlags.has(rawKey)) throw new Error(`Option '--${rawKey}' does not accept a value.`);
      flags[rawKey] = inline;
    } else if (valueFlags.has(rawKey) && argv[index + 1] && !argv[index + 1].startsWith("--")) {
      flags[rawKey] = argv[++index];
    } else if (valueFlags.has(rawKey)) {
      throw new Error(`Option '--${rawKey}' requires a value.`);
    } else {
      flags[rawKey] = true;
    }
  }
  return { positionals, flags };
}

export function optionsFromFlags(flags) {
  const style = flags.style;
  const format = flags.format ?? "text";
  if (style !== undefined && !allowedStyles.has(style)) throw new Error(`Invalid style '${style}'. Use standard or learning.`);
  if (!allowedFormats.has(format)) throw new Error(`Invalid format '${format}'. Use text, markdown, or json.`);
  if (flags.target && !["project", "codex"].includes(flags.target)) {
    throw new Error(`Invalid target '${flags.target}'. Use project or codex.`);
  }
  if (flags.name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(flags.name)) {
    throw new Error(`Invalid name '${flags.name}'. Use a lowercase hyphenated slug.`);
  }
  return {
    cwd: flags.cwd,
    dryRun: Boolean(flags["dry-run"]),
    force: Boolean(flags.force),
    style,
    format,
    report: Boolean(flags.report),
    strict: Boolean(flags.strict),
    staged: Boolean(flags.staged),
    base: flags.base,
    name: flags.name
  };
}
