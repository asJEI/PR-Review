import type { RelevanceInput, RelevanceOptions, RelevanceReport } from "@pr-review/shared";

import { runRelevancePipeline } from "./pipeline/run-relevance-pipeline.js";

/**
 * Ranks files, symbols, and modules by engineering relevance for AI review agents.
 * Rule-based, explainable scoring — no LLM calls.
 */
export function scoreRelevance(
  input: RelevanceInput,
  options?: RelevanceOptions,
): RelevanceReport {
  if (!input.reviewContext.files) {
    throw new Error("RelevanceInput.reviewContext.files is required");
  }

  return runRelevancePipeline(input, options);
}
