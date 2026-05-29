import type { RiskReviewGeneratorInput } from "@pr-review/shared";

import type { LLMCompletionResponse } from "../../providers/llm-provider.js";
import type { ResolvedRiskGeneratorOptions, RiskReviewGeneratorOptions } from "./defaults.js";

export interface RiskPipelineState {
  input: RiskReviewGeneratorInput;
  options: ResolvedRiskGeneratorOptions;
  provider: import("../../providers/llm-provider.js").LLMProvider;
  completion: LLMCompletionResponse | null;
  report: import("@pr-review/shared").RiskReviewReport | null;
}
