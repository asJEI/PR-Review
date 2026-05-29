import type { PrSummary, SummaryGeneratorInput } from "@pr-review/shared";

import { runSummaryPipeline } from "./pipeline/run-summary-pipeline.js";
import type { SummaryGeneratorOptions } from "./pipeline/defaults.js";

/** Orchestrates LLM execution, parsing, and grounding for PR summaries. */
export async function generatePrSummary(
  input: SummaryGeneratorInput,
  options?: SummaryGeneratorOptions,
): Promise<PrSummary> {
  return runSummaryPipeline(input, options);
}
