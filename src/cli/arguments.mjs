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
    if (inline !== undefined) {
      flags[rawKey] = inline;
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      flags[rawKey] = argv[++index];
    } else {
      flags[rawKey] = true;
    }
  }
  return { positionals, flags };
}

export function optionsFromFlags(flags) {
  return {
    cwd: flags.cwd,
    dryRun: Boolean(flags["dry-run"]),
    force: Boolean(flags.force),
    style: flags.style ?? "standard",
    report: Boolean(flags.report)
  };
}
