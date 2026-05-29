import type { SummaryGeneratorInput } from "@pr-review/shared";

import type { ReviewLLMClient } from "../../providers/review-llm-client.js";
import type { ResolvedSummaryGeneratorOptions } from "./defaults.js";
import type { PrSummary } from "@pr-review/shared";

export interface SummaryPipelineState {
  input: SummaryGeneratorInput;
  options: ResolvedSummaryGeneratorOptions;
  llmClient: ReviewLLMClient;
  summary: PrSummary | null;
}
