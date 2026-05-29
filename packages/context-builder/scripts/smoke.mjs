/**
 * Smoke test: getPullRequest → buildReviewContext
 * Usage: node packages/context-builder/scripts/smoke.mjs <pr-url>
 * Requires: pnpm run build, GITHUB_TOKEN recommended
 */
import { buildReviewContext } from "../dist/index.js";
import { getPullRequest } from "../../github/dist/index.js";

const prUrl = process.argv[2];

if (!prUrl) {
  console.error("Usage: node packages/context-builder/scripts/smoke.mjs <pr-url>");
  process.exit(1);
}

const prData = await getPullRequest(prUrl);
const context = buildReviewContext(prData);

console.log(
  JSON.stringify(
    {
      title: context.metadata.title,
      stats: context.stats,
      semanticSummary: context.semanticSummary,
      changeGroups: context.changeGroups.map((g) => ({
        label: g.label,
        files: g.files,
      })),
      files: context.files.map((f) => ({
        filename: f.filename,
        symbols: f.symbols.map((s) => s.name),
        importCount: f.imports.length,
        hunkCount: f.hunks.length,
      })),
    },
    null,
    2,
  ),
);
