import type { ReviewExecutionInput } from "@pr-review/shared";

import { resolveProviderFromEnv } from "../../providers/provider-registry.js";
import { ReviewExecutionMockProvider } from "../../providers/mock-provider.js";
import { ReviewLLMClient } from "../../providers/review-llm-client.js";
import { withRetry } from "../../providers/with-retry.js";
import { resolveProvider } from "../../agents/agent-defaults.js";
import type { AgentGeneratorOptions } from "../../agents/agent-defaults.js";
import {
  resolveReviewExecutionOptions,
  type ReviewExecutionLocalOptions,
} from "./defaults.js";
import type { ReviewExecutionPipelineState } from "./types.js";

export function initExecutionState(
  input: ReviewExecutionInput,
  options?: ReviewExecutionLocalOptions & AgentGeneratorOptions,
): ReviewExecutionPipelineState {
  if (!input.summaryPrompt.trim()) {
    throw new Error("ReviewExecutionInput.summaryPrompt is required");
  }
  if (!input.riskPrompt.trim()) {
    throw new Error("ReviewExecutionInput.riskPrompt is required");
  }
  if (!input.reviewPrompt.trim()) {
    throw new Error("ReviewExecutionInput.reviewPrompt is required");
  }

  const resolvedOptions = resolveReviewExecutionOptions(options);
  const provider =
    options?.provider ??
    resolveProviderFromEnv() ??
    withRetry(new ReviewExecutionMockProvider(), {
      maxRetries: options?.maxRetries,
      retryDelayMs: options?.retryDelayMs,
    });

  if (!options?.provider && !resolveProviderFromEnv() && process.env.NODE_ENV !== "test") {
    console.warn(
      "[@pr-review/ai] No LLM API key found; using MockProvider for review execution.",
    );
  }

  const llmClient =
    options?.llmClient ??
    new ReviewLLMClient({
      provider: options?.provider ? resolveProvider(options) : provider,
      model: resolvedOptions.model,
      temperature: resolvedOptions.temperature,
    });

  return {
    input,
    options: resolvedOptions,
    llmClient,
  };
}
