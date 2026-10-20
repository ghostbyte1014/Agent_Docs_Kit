function occurrences(value, marker) {
  return value.split(marker).length - 1;
}

function section(value, start, end) {
  const from = value.indexOf(start);
  if (from < 0) return "";
  const to = end ? value.indexOf(end, from + start.length) : value.length;
  return value.slice(from, to < 0 ? value.length : to);
}

export function reviewGuideErrors(value, catalog) {
  const errors = [];
  for (const kind of ["security", "engineering"]) {
    for (const entry of catalog[kind] ?? []) {
      const marker = `| ${entry.id} ${entry.title} | \`${entry.slug}\` |`;
      const count = occurrences(value, marker);
      if (count !== 1) errors.push(`docs/REVIEW_GUIDE.md must contain '${marker}' exactly once; found ${count}.`);
    }
  }

  const security = section(value, "## Security phases", "## Engineering topics");
  for (const status of ["Pass", "Fail", "Unverified", "N/A"]) {
    if (!security.includes(`| ${status} |`)) errors.push(`docs/REVIEW_GUIDE.md security examples must include status '${status}'.`);
  }
  const engineering = section(value, "## Engineering topics", "## Reviewer handoff");
  for (const status of ["Applied", "Partial", "Recommended", "Unverified", "N/A"]) {
    if (!engineering.includes(`| ${status} |`)) errors.push(`docs/REVIEW_GUIDE.md engineering examples must include status '${status}'.`);
  }
  return errors;
}
