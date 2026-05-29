import type { RiskReviewGeneratorInput } from "@pr-review/shared";

import { ReviewLLMClient } from "../../providers/review-llm-client.js";
import {
  resolveRiskGeneratorOptions,
  resolveRiskProvider,
  type RiskReviewGeneratorOptions,
} from "./defaults.js";
import type { RiskPipelineState } from "./types.js";

export function initRiskState(
  input: RiskReviewGeneratorInput,
  options?: RiskReviewGeneratorOptions,
): RiskPipelineState {
  if (!input.riskPrompt.trim()) {
    throw new Error("RiskReviewGeneratorInput.riskPrompt is required");
  }
  if (!input.compressedContext.modules) {
    throw new Error("RiskReviewGeneratorInput.compressedContext.modules is required");
  }

  const resolvedOptions = resolveRiskGeneratorOptions(options);
  const provider = resolveRiskProvider(options);

  return {
    input,
    options: resolvedOptions,
    llmClient:
      options?.llmClient ??
      new ReviewLLMClient({
        provider,
        model: resolvedOptions.model,
        temperature: resolvedOptions.temperature,
      }),
    report: null,
  };
}

export { getBaseProviderId } from "../../providers/provider-utils.js";
