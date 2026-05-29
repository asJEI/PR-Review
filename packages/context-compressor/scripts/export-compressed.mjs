/**
 * Export compressed ReviewContext as UTF-8 JSON.
 *
 * Usage:
 *   node packages/context-compressor/scripts/export-compressed.mjs <pr-url> [output.json]
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildReviewContext } from "../../context-builder/dist/index.js";
import { compressReviewContext } from "../dist/index.js";
import { getPullRequest } from "../../github/dist/index.js";

const prUrl = process.argv[2];
const outputArg = process.argv[3];

if (!prUrl) {
  console.error(
    "Usage: node packages/context-compressor/scripts/export-compressed.mjs <pr-url> [output.json]",
  );
  process.exit(1);
}

const outputPath = resolve(process.cwd(), outputArg ?? "compressed-review-context.json");

const prData = await getPullRequest(prUrl);
const reviewContext = buildReviewContext(prData);
const compressed = compressReviewContext(reviewContext, {
  maxEstimatedTokens: Number(process.env.MAX_ESTIMATED_TOKENS ?? 6000),
});

writeFileSync(outputPath, `\uFEFF${JSON.stringify(compressed, null, 2)}`, "utf8");
console.error(`Wrote UTF-8 compressed context to ${outputPath}`);
