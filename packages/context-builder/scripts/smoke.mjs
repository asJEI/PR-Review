/**
 * Smoke test: getPullRequest → buildReviewContext
 *
 * Usage:
 *   node packages/context-builder/scripts/smoke.mjs <pr-url> [--out file.json]
 *
 * On Windows, prefer --out over shell redirect (`> file.json`) to keep UTF-8.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildReviewContext } from "../dist/index.js";
import { getPullRequest } from "../../github/dist/index.js";

const args = process.argv.slice(2);
let outputPath = null;
let prUrl = null;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--out") {
    outputPath = resolve(process.cwd(), args[index + 1] ?? "review-context.json");
    index += 1;
    continue;
  }

  if (!prUrl) {
    prUrl = arg;
  }
}

if (!prUrl) {
  console.error(
    "Usage: node packages/context-builder/scripts/smoke.mjs <pr-url> [--out file.json]",
  );
  process.exit(1);
}

const prData = await getPullRequest(prUrl);
const context = buildReviewContext(prData);

const payload = {
  title: context.metadata.title,
  stats: context.stats,
  semanticSummary: context.semanticSummary,
  changeGroups: context.changeGroups.map((g) => ({
    label: g.label,
    files: g.files,
  })),
  modules: context.modules.map((m) => ({
    module: m.module,
    relatedFiles: m.relatedFiles,
    affectedFunctions: m.affectedFunctions,
    semanticSummary: m.semanticSummary,
    riskContext: m.riskContext,
  })),
  files: context.files.map((f) => ({
    filename: f.filename,
    symbols: f.symbols.map((s) => s.name),
    importCount: f.imports.length,
    hunkCount: f.hunks.length,
  })),
};

const json = JSON.stringify(payload, null, 2);

if (outputPath) {
  writeFileSync(outputPath, `\uFEFF${json}`, "utf8");
  console.error(`Wrote UTF-8 summary to ${outputPath}`);
} else {
  process.stdout.write(json);
  process.stdout.write("\n");
}
