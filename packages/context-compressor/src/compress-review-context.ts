import type { CompressionOptions, CompressedReviewContext, ReviewContext } from "@pr-review/shared";

import { runCompressionPipeline } from "./pipeline/run-compression-pipeline.js";

/**
 * Transforms ReviewContext into compact, high-signal engineering context
 * for downstream AI review agents. No LLM calls; rule-based only.
 */
export function compressReviewContext(
  input: ReviewContext,
  options?: CompressionOptions,
): CompressedReviewContext {
  if (!input.modules) {
    throw new Error("ReviewContext.modules is required");
  }

  return runCompressionPipeline(input, options);
}
