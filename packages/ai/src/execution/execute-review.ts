import type { ReviewExecutionInput, ReviewExecutionReport } from "@pr-review/shared";

import type { AgentGeneratorOptions } from "../agents/agent-defaults.js";
import type { ReviewExecutionLocalOptions } from "./pipeline/defaults.js";
import { runReviewExecutionPipeline } from "./pipeline/run-review-execution-pipeline.js";

export type ExecuteReviewOptions = ReviewExecutionLocalOptions & AgentGeneratorOptions;

export async function executeReview(
  input: ReviewExecutionInput,
  options?: ExecuteReviewOptions,
): Promise<ReviewExecutionReport> {
  return runReviewExecutionPipeline(input, options);
}
