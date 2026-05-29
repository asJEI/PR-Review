/**
 * Export focused diff snippets as UTF-8 JSON.
 *
 * Usage:
 *   node packages/focused-diff/scripts/export-focused-diffs.mjs <pr-url> [output.json]
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildReviewContext } from "../../context-builder/dist/index.js";
import { compressReviewContext } from "../../context-compressor/dist/index.js";
import { scoreRelevance } from "../../context-relevance/dist/index.js";
import { extractFocusedDiffs } from "../dist/index.js";
import { getPullRequest } from "../../github/dist/index.js";

const prUrl = process.argv[2];
const outputArg = process.argv[3];

if (!prUrl) {
  console.error(
    "Usage: node packages/focused-diff/scripts/export-focused-diffs.mjs <pr-url> [output.json]",
  );
  process.exit(1);
}

const outputPath = resolve(process.cwd(), outputArg ?? "focused-diffs.json");

const prData = await getPullRequest(prUrl);
const reviewContext = buildReviewContext(prData);
const compressed = compressReviewContext(reviewContext, {
  maxEstimatedTokens: Number(process.env.MAX_ESTIMATED_TOKENS ?? 6000),
});
const report = scoreRelevance(
  { reviewContext, compressedContext: compressed },
  { totalContextBudget: Number(process.env.TOTAL_CONTEXT_BUDGET ?? 6000) },
);

const focusedDiffReport = extractFocusedDiffs({
  reviewContext,
  compressedContext: compressed,
  relevanceReport: report,
});

writeFileSync(outputPath, `\uFEFF${JSON.stringify(focusedDiffReport, null, 2)}`, "utf8");
console.error(`Wrote UTF-8 focused diffs to ${outputPath}`);
