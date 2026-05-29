import type { SummaryGeneratorInput } from "@pr-review/shared";

import { resolveProvider } from "../../agents/agent-defaults.js";
import { DEFAULT_MOCK_RESPONSE } from "../../providers/mock-fixtures.js";
import { ReviewLLMClient } from "../../providers/review-llm-client.js";
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

  const resolvedOptions = resolveSummaryGeneratorOptions(options);
  const provider = resolveProvider(
    options,
    "[@pr-review/ai] No LLM API key found; using MockProvider. Set OPENAI_API_KEY, DEEPSEEK_API_KEY, or ANTHROPIC_API_KEY for live summaries.",
    DEFAULT_MOCK_RESPONSE,
  );

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
    summary: null,
  };
}

export { getBaseProviderId } from "../../providers/provider-utils.js";
