import type { BuildContextOptions, PullRequestData, ReviewContext } from "@pr-review/shared";

import { runPipeline } from "./pipeline/run-pipeline.js";

/**
 * Transforms normalized PR data into AI-friendly engineering context.
 *
 * Architecture:
 * - Single public entry point for apps/server and packages/ai
 * - Pipeline stages are pure, composable, and testable in isolation
 * - No network I/O, no LLM calls — patch-only context in MVP
 */
export function buildReviewContext(
  input: PullRequestData,
  options?: BuildContextOptions,
): ReviewContext {
  if (!input.changedFiles) {
    throw new Error("PullRequestData.changedFiles is required");
  }

  return runPipeline(input, options);
}
