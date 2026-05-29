/**
 * Export review comments as UTF-8 JSON.
 *
 * Usage:
 *   node packages/ai/scripts/export-review-comments.mjs <pr-url> [output.json]
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { hasLlmApiKey, loadEnv } from "../../../scripts/load-env.mjs";
import { buildReviewContext } from "../../context-builder/dist/index.js";
import { compressReviewContext } from "../../context-compressor/dist/index.js";
import { scoreRelevance } from "../../context-relevance/dist/index.js";
import { extractFocusedDiffs } from "../../focused-diff/dist/index.js";
import { buildReviewPrompts } from "../../prompt-builder/dist/index.js";
import { generateRiskReview, generateReviewComments } from "../dist/index.js";
import { getPullRequest } from "../../github/dist/index.js";

const prUrl = process.argv[2];
const outputArg = process.argv[3];

if (!prUrl) {
  console.error(
    "Usage: node packages/ai/scripts/export-review-comments.mjs <pr-url> [output.json]",
  );
  process.exit(1);
}

loadEnv();

if (!hasLlmApiKey()) {
  console.error(
    "Warning: No LLM API key found; export-review-comments will use MockProvider. Set keys in .env or environment.",
  );
}

const outputPath = resolve(process.cwd(), outputArg ?? "review-comments.json");

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
const prompts = buildReviewPrompts({
  compressedContext: compressed,
  relevanceReport: report,
  reviewContext,
  focusedDiffReport,
});

const riskReport = await generateRiskReview({
  riskPrompt: prompts.riskPrompt,
  compressedContext: compressed,
  relevanceReport: report,
  reviewContext,
});

const commentReport = await generateReviewComments({
  reviewPrompt: prompts.reviewPrompt,
  compressedContext: compressed,
  relevanceReport: report,
  reviewContext,
  riskReport,
});

writeFileSync(outputPath, `\uFEFF${JSON.stringify(commentReport, null, 2)}`, "utf8");
console.error(`Wrote UTF-8 review comments to ${outputPath}`);
