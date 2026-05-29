import type { ReviewCommentGeneratorInput, ReviewCommentReport } from "@pr-review/shared";

import { runCommentPipeline } from "./pipeline/run-comment-pipeline.js";
import type { ReviewCommentGeneratorOptions } from "./pipeline/defaults.js";

/** Orchestrates LLM execution, parsing, and grounding for review comments. */
export async function generateReviewComments(
  input: ReviewCommentGeneratorInput,
  options?: ReviewCommentGeneratorOptions,
): Promise<ReviewCommentReport> {
  return runCommentPipeline(input, options);
}
