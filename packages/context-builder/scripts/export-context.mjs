/**
 * Export ReviewContext to a UTF-8 JSON file.
 *
 * Usage:
 *   node packages/context-builder/scripts/export-context.mjs <pr-url> [output.json]
 *
 * Avoid shell redirect on Windows (e.g. `> out.json`) — PowerShell may use GBK
 * and corrupt Chinese text. This script always writes UTF-8 with BOM.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildReviewContext } from "../dist/index.js";
import { getPullRequest } from "../../github/dist/index.js";

const prUrl = process.argv[2];
const outputArg = process.argv[3];

if (!prUrl) {
  console.error(
    "Usage: node packages/context-builder/scripts/export-context.mjs <pr-url> [output.json]",
  );
  process.exit(1);
}

const outputPath = resolve(
  process.cwd(),
  outputArg ?? "review-context.json",
);

const prData = await getPullRequest(prUrl);
const context = buildReviewContext(prData, {
  maxEstimatedTokens: Number(process.env.MAX_ESTIMATED_TOKENS ?? 12_000),
});

const json = JSON.stringify(context, null, 2);
writeFileSync(outputPath, `\uFEFF${json}`, "utf8");

console.error(`Wrote UTF-8 context to ${outputPath}`);
