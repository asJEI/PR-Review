/**
 * Export review prompts as UTF-8 JSON.
 *
 * Usage:
 *   node packages/prompt-builder/scripts/export-prompts.mjs <pr-url> [output.json]
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildReviewContext } from "../../context-builder/dist/index.js";
import { compressReviewContext } from "../../context-compressor/dist/index.js";
import { scoreRelevance } from "../../context-relevance/dist/index.js";
import { extractFocusedDiffs } from "../../focused-diff/dist/index.js";
import { buildReviewPrompts } from "../dist/index.js";
import { getPullRequest } from "../../github/dist/index.js";

const prUrl = process.argv[2];
const outputArg = process.argv[3];

if (!prUrl) {
  console.error(
    "Usage: node packages/prompt-builder/scripts/export-prompts.mjs <pr-url> [output.json]",
  );
  process.exit(1);
}

const outputPath = resolve(process.cwd(), outputArg ?? "review-prompts.json");

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

const prompts = buildReviewPrompts(
  { compressedContext: compressed, relevanceReport: report, reviewContext, focusedDiffReport },
  {
    totalTokenBudget: Number(process.env.PROMPT_TOKEN_BUDGET ?? 12000),
  },
);

writeFileSync(outputPath, `\uFEFF${JSON.stringify(prompts, null, 2)}`, "utf8");
console.error(`Wrote UTF-8 review prompts to ${outputPath}`);
