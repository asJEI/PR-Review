import type { RiskReviewGeneratorInput } from "@pr-review/shared";

import { getBaseProviderId } from "../../agents/agent-defaults.js";
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

  return {
    input,
    options: resolveRiskGeneratorOptions(options),
    provider: resolveRiskProvider(options),
    completion: null,
    report: null,
  };
}

export { getBaseProviderId };
