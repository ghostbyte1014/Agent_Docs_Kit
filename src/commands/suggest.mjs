import { execFileSync } from "node:child_process";
import { relative, resolve } from "node:path";
import { loadCatalog } from "../core/catalog.mjs";
import { documentationInitializationState } from "../core/config.mjs";
import { npxCommand } from "./workflow.mjs";

const reviewRules = {
  security: [
    { slug: "design-architecture", reason: "architecture, trust-boundary, or threat-model files changed", match: /(?:^|\/)(?:architecture|design|threat-model|trust-boundar(?:y|ies))(?:\/|\.|-|$)/ },
    { slug: "local-development", reason: "local environment, dependency, or development-container files changed", match: /(?:^|\/)(?:\.env(?:\.|$)|\.devcontainer\/|package(?:-lock)?\.json$|npm-shrinkwrap\.json$|requirements[^/]*\.txt$|pyproject\.toml$|poetry\.lock$|cargo\.(?:toml|lock)$)/ },
    { slug: "database-backend", reason: "database, migration, model, or schema files changed", match: /(?:^|\/)(?:db|database|migrations?|models?|schemas?)(?:\/|\.|-|$)|\.(?:sql|prisma)$/ },
    { slug: "api-layer", reason: "API contracts, routes, or controllers changed", match: /(?:^|\/)(?:api|apis|routes?|controllers?|openapi|graphql)(?:\/|\.|-|$)|(?:openapi|swagger)\.(?:json|ya?ml)$/ },
    { slug: "frontend-ui", reason: "browser-facing UI files changed", match: /(?:^|\/)(?:site|frontend|client|public|web)(?:\/|$)|\.(?:html|css|jsx|tsx|vue|svelte)$/ },
    { slug: "application-security-testing", reason: "authentication, authorization, cryptography, session, or security-test files changed", match: /(?:^|\/)(?:auth|authentication|authorization|permissions?|crypto|sessions?)(?:\/|\.|-|$)|(?:^|\/)(?:test|tests)\/.*(?:auth|security|permission)|(?:^|\/)security(?:\/|\.(?:[cm]?[jt]sx?|py|go|rs|java|rb|php)$)/ },
    { slug: "cicd-release-engineering", reason: "CI/CD, release automation, or package publication files changed", match: /(?:^|\/)(?:\.github\/workflows|\.gitlab-ci|ci|cd)(?:\/|\.|-|$)|(?:^|\/)(?:publish|release)(?:\/|\.|-|$)/ },
    { slug: "cloud-infrastructure", reason: "cloud or infrastructure-as-code files changed", match: /(?:^|\/)(?:infra|infrastructure|terraform|pulumi|cloudformation|k8s|kubernetes|helm)(?:\/|\.|-|$)|\.(?:tf|tfvars)$/ },
    { slug: "edge-cdn-dns", reason: "edge, CDN, DNS, or Cloudflare configuration changed", match: /(?:^|\/)(?:edge|cdn|dns|cloudflare|wrangler)(?:\/|\.|-|$)|(?:^|\/)wrangler\.jsonc?$/ },
    { slug: "release-rollout", reason: "release, rollout, deployment, or changelog files changed", match: /(?:^|\/)(?:release|rollout|deploy|deployment)(?:\/|\.|-|$)|(?:^|\/)changelog\.md$/ },
    { slug: "post-release-monitoring-ir", reason: "monitoring, alerting, or incident-response files changed", match: /(?:^|\/)(?:monitoring|alerts?|incidents?|incident-response)(?:\/|\.|-|$)/ },
    { slug: "ongoing-operations", reason: "operations, maintenance, or runbook files changed", match: /(?:^|\/)(?:operations?|maintenance|runbooks?)(?:\/|\.|-|$)/ }
  ],
  engineering: [
    { slug: "query-performance", reason: "query, database, or SQL files changed", match: /(?:^|\/)(?:queries|query|db|database)(?:\/|\.|-|$)|\.sql$/ },
    { slug: "networking-fundamentals", reason: "network, proxy, socket, HTTP, or TLS files changed", match: /(?:^|\/)(?:network|networking|proxy|sockets?|http|tls)(?:\/|\.|-|$)/ },
    { slug: "rate-limiting-algorithms", reason: "rate-limit, throttle, or quota behavior changed", match: /(?:^|\/)(?:rate-limit|rate-limiting|throttle|quota)(?:\/|\.|-|$)/ },
    { slug: "production-debugging", reason: "debugging or diagnostic tooling changed", match: /(?:^|\/)(?:debug|debugging|diagnostics?)(?:\/|\.|-|$)/ },
    { slug: "data-modeling", reason: "data model, schema, or migration files changed", match: /(?:^|\/)(?:models?|schemas?|migrations?)(?:\/|\.|-|$)|\.(?:sql|prisma)$/ },
    { slug: "cloud-cost-saving", reason: "cloud resource or autoscaling configuration changed", match: /(?:^|\/)(?:infra|infrastructure|terraform|pulumi|cloudformation|autoscal(?:e|ing)|costs?)(?:\/|\.|-|$)|\.(?:tf|tfvars)$/ },
    { slug: "testing-types", reason: "test suites, fixtures, or test configuration changed", match: /(?:^|\/)(?:test|tests|spec|specs|fixtures)(?:\/|\.|-|$)|(?:^|\/)(?:vitest|jest|playwright|cypress)\.config\./ },
    { slug: "message-queues", reason: "queue, broker, producer, or consumer files changed", match: /(?:^|\/)(?:queues?|brokers?|kafka|rabbitmq|producers?|consumers?)(?:\/|\.|-|$)/ },
    { slug: "api-design-compatibility", reason: "public API, CLI, route, or contract files changed", match: /(?:^|\/)(?:src\/api|src\/cli|api|apis|routes?|openapi|graphql)(?:\/|\.|-|$)|(?:openapi|swagger)\.(?:json|ya?ml)$/ },
    { slug: "reliability-slos", reason: "reliability, retry, health-check, or SLO files changed", match: /(?:^|\/)(?:reliability|slos?|retries|retry|health-checks?|circuit-breakers?)(?:\/|\.|-|$)/ },
    { slug: "observability-telemetry", reason: "logging, metrics, tracing, or telemetry files changed", match: /(?:^|\/)(?:observability|telemetry|metrics|tracing|logging)(?:\/|\.|-|$)/ },
    { slug: "deployment-change-safety", reason: "deployment, release, or CI workflow files changed", match: /(?:^|\/)(?:\.github\/workflows|\.gitlab-ci|deploy|deployment|release|rollout)(?:\/|\.|-|$)/ },
    { slug: "capacity-concurrency", reason: "worker, pool, concurrency, or capacity files changed", match: /(?:^|\/)(?:workers?|pools?|concurrency|capacity)(?:\/|\.|-|$)/ }
  ]
};

function normalizePath(path) {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function parseNullDelimited(output) {
  return output.toString("utf8").split("\0").filter(Boolean).map(normalizePath);
}

function gitFiles(root, arguments_, runGit) {
  try {
    return parseNullDelimited(runGit("git", arguments_, {
      cwd: root,
      encoding: "buffer",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"]
    }));
  } catch (error) {
    const detail = error?.stderr?.toString("utf8").trim() || error?.message || "Git command failed.";
    throw new Error(`Unable to inspect Git changes in '${root}': ${detail}`);
  }
}

export function traceChangedFiles(options = {}) {
  if (options.changedFiles) return [...new Set(options.changedFiles.map(normalizePath))].sort();
  const root = resolve(options.cwd ?? process.cwd());
  const runGit = options.runGit ?? execFileSync;
  if (options.base) {
    if (options.base.startsWith("-") || !/^[A-Za-z0-9._/@{}^~:+-]+$/.test(options.base)) {
      throw new Error("Invalid --base Git reference.");
    }
    return [...new Set(gitFiles(root, ["diff", "--name-only", "--diff-filter=ACMRD", "-z", `${options.base}...HEAD`, "--"], runGit))].sort();
  }
  const staged = gitFiles(root, ["diff", "--cached", "--name-only", "--diff-filter=ACMRD", "-z", "--"], runGit);
  if (options.staged) return [...new Set(staged)].sort();
  const unstaged = gitFiles(root, ["diff", "--name-only", "--diff-filter=ACMRD", "-z", "--"], runGit);
  const untracked = gitFiles(root, ["ls-files", "--others", "--exclude-standard", "-z", "--"], runGit);
  return [...new Set([...staged, ...unstaged, ...untracked])].sort();
}

function candidatesFor(kind, files, catalog) {
  return reviewRules[kind].flatMap((rule) => {
    const matchedFiles = files.filter((file) => rule.match.test(file.toLowerCase()));
    if (!matchedFiles.length) return [];
    const entry = catalog[kind].find((candidate) => candidate.slug === rule.slug);
    const worksheet = kind === "security" ? "security worksheet" : "engineering worksheet";
    return [{ ...entry, reason: rule.reason, matchedFiles, command: `${npxCommand} ${worksheet} ${entry.slug}` }];
  });
}

function printCandidates(kind, candidates, documentationInitialized) {
  console.log(`\n${kind.toUpperCase()} REVIEW CANDIDATES`);
  if (!candidates.length) {
    console.log("  None suggested by the changed-path rules.");
    return;
  }
  for (const candidate of candidates) {
    console.log(`  ${candidate.id} ${candidate.title}`);
    console.log(`     Why: ${candidate.reason}.`);
    console.log(`     Matched: ${candidate.matchedFiles.join(", ")}`);
    console.log(`     ${documentationInitialized ? "If relevant" : "After documentation setup, if relevant"}: ${candidate.command}`);
  }
}

export async function suggestReviews(options = {}) {
  if (options.staged && options.base) throw new Error("Choose either --staged or --base, not both.");
  const root = resolve(options.cwd ?? process.cwd());
  const files = traceChangedFiles({ ...options, cwd: root });
  const catalog = await loadCatalog();
  const documentation = await documentationInitializationState(root);
  const result = {
    root,
    files,
    documentationInitialized: documentation.initialized,
    security: candidatesFor("security", files, catalog),
    engineering: candidatesFor("engineering", files, catalog)
  };

  console.log(`Review suggestion (advisory)\n\nChanged files considered: ${files.length}`);
  if (files.length) for (const file of files) console.log(`  ${relative(root, resolve(root, file))}`);
  else console.log("  No changed files were found for the selected comparison.");
  console.log("\nDOCUMENTATION CONFIRMATION");
  if (documentation.initialized) console.log("  Confirm that affected project documentation was updated, or record why no documentation change is necessary.");
  else {
    console.log("  Documentation is not initialized. Complete this prerequisite before creating a security or engineering worksheet:");
    console.log("  npx @ghostbyte/agent-docs-kit@latest setup --dry-run");
    console.log("  npx @ghostbyte/agent-docs-kit@latest setup");
  }
  printCandidates("security", result.security, result.documentationInitialized);
  printCandidates("engineering", result.engineering, result.documentationInitialized);
  console.log("\nNo worksheet was created and no audit was performed. Path matching can miss risks; review the actual change before deciding.");
  return result;
}
