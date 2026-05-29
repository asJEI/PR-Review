import type { RiskReviewReport, RiskReviewGeneratorInput } from "@pr-review/shared";

import { runRiskPipeline } from "./pipeline/run-risk-pipeline.js";
import type { RiskReviewGeneratorOptions } from "./pipeline/defaults.js";

/** Orchestrates LLM execution, parsing, confidence scoring, and grounding for risk reviews. */
export async function generateRiskReview(
  input: RiskReviewGeneratorInput,
  options?: RiskReviewGeneratorOptions,
): Promise<RiskReviewReport> {
  return runRiskPipeline(input, options);
}
