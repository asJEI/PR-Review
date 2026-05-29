import type { SummaryGeneratorInput } from "@pr-review/shared";

import type { LLMProvider } from "../../providers/llm-provider.js";
import {
  resolveProvider,
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

  const resolvedOptions = resolveSummaryGeneratorOptions(options);
  const provider = resolveProvider(options);

  return {
    input,
    options: resolvedOptions,
    provider,
    completion: null,
    summary: null,
  };
}

export function getBaseProviderId(provider: LLMProvider): string {
  return provider.id.replace(/-with-retry$/, "");
}
