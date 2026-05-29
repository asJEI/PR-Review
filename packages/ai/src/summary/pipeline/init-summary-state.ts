import type { SummaryGeneratorInput } from "@pr-review/shared";

import { getBaseProviderId, resolveProvider } from "../../agents/agent-defaults.js";
import {
  resolveSummaryGeneratorOptions,
  type SummaryGeneratorOptions,
} from "./defaults.js";
import type { SummaryPipelineState } from "./types.js";

export function initSummaryState(
  input: SummaryGeneratorInput,
  options?: SummaryGeneratorOptions,
): SummaryPipelineState {
  if (!input.summaryPrompt.trim()) {
    throw new Error("SummaryGeneratorInput.summaryPrompt is required");
  }
  if (!input.compressedContext.modules) {
    throw new Error("SummaryGeneratorInput.compressedContext.modules is required");
  }

  return {
    input,
    options: resolveSummaryGeneratorOptions(options),
    provider: resolveProvider(
      options,
      "[@pr-review/ai] OPENAI_API_KEY not set; using MockProvider. Set OPENAI_API_KEY for live summaries.",
    ),
    completion: null,
    summary: null,
  };
}

export { getBaseProviderId };
