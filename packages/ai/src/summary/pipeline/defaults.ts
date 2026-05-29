import { createOpenAICompatibleProviderFromEnv } from "../../providers/openai-compatible-provider.js";
import { MockProvider } from "../../providers/mock-provider.js";
import type { LLMProvider } from "../../providers/llm-provider.js";
import { withRetry } from "../../providers/with-retry.js";

export interface SummaryGeneratorOptions {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export type ResolvedSummaryGeneratorOptions = Required<
  Pick<SummaryGeneratorOptions, "model" | "temperature" | "maxRetries" | "retryDelayMs">
>;

export const DEFAULT_SUMMARY_GENERATOR_OPTIONS: ResolvedSummaryGeneratorOptions = {
  model: "gpt-4o-mini",
  temperature: 0.2,
  maxRetries: 3,
  retryDelayMs: 500,
};

export function resolveSummaryGeneratorOptions(
  options?: SummaryGeneratorOptions,
): ResolvedSummaryGeneratorOptions {
  return {
    model: options?.model ?? process.env.OPENAI_MODEL ?? DEFAULT_SUMMARY_GENERATOR_OPTIONS.model,
    temperature: options?.temperature ?? DEFAULT_SUMMARY_GENERATOR_OPTIONS.temperature,
    maxRetries: options?.maxRetries ?? DEFAULT_SUMMARY_GENERATOR_OPTIONS.maxRetries,
    retryDelayMs: options?.retryDelayMs ?? DEFAULT_SUMMARY_GENERATOR_OPTIONS.retryDelayMs,
  };
}

export function resolveProvider(options?: SummaryGeneratorOptions): LLMProvider {
  if (options?.provider) {
    return withRetry(options.provider, {
      maxRetries: options.maxRetries,
      retryDelayMs: options.retryDelayMs,
    });
  }

  const fromEnv = createOpenAICompatibleProviderFromEnv();
  if (fromEnv) {
    return withRetry(fromEnv, {
      maxRetries: options?.maxRetries,
      retryDelayMs: options?.retryDelayMs,
    });
  }

  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "[@pr-review/ai] OPENAI_API_KEY not set; using MockProvider. Set OPENAI_API_KEY for live summaries.",
    );
  }

  return withRetry(new MockProvider(), {
    maxRetries: options?.maxRetries,
    retryDelayMs: options?.retryDelayMs,
  });
}
