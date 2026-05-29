/**
 * Export relevance report as UTF-8 JSON.
 *
 * Usage:
 *   node packages/context-relevance/scripts/export-relevance.mjs <pr-url> [output.json]
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildReviewContext } from "../../context-builder/dist/index.js";
import { compressReviewContext } from "../../context-compressor/dist/index.js";
import { scoreRelevance } from "../dist/index.js";
import { getPullRequest } from "../../github/dist/index.js";

const prUrl = process.argv[2];
const outputArg = process.argv[3];

if (!prUrl) {
  console.error(
    "Usage: node packages/context-relevance/scripts/export-relevance.mjs <pr-url> [output.json]",
  );
  process.exit(1);
}

const outputPath = resolve(process.cwd(), outputArg ?? "relevance-report.json");

const prData = await getPullRequest(prUrl);
const reviewContext = buildReviewContext(prData);
const compressed = compressReviewContext(reviewContext);
const report = scoreRelevance({ reviewContext, compressedContext: compressed });

writeFileSync(outputPath, `\uFEFF${JSON.stringify(report, null, 2)}`, "utf8");
console.error(`Wrote UTF-8 relevance report to ${outputPath}`);
