import type { RiskReviewGeneratorInput, RiskReviewReport } from "@pr-review/shared";

import type { ReviewLLMClient } from "../../providers/review-llm-client.js";
import type { ResolvedRiskGeneratorOptions } from "./defaults.js";

export interface RiskPipelineState {
  input: RiskReviewGeneratorInput;
  options: ResolvedRiskGeneratorOptions;
  llmClient: ReviewLLMClient;
  report: RiskReviewReport | null;
}
