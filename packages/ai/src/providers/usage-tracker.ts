import type { LLMUsageMetrics } from "@pr-review/shared";

import type { LLMUsage as ProviderUsage } from "./llm-provider.js";

export function mergeUsage(current: ProviderUsage | undefined, next: ProviderUsage | undefined): ProviderUsage {
  return {
    promptTokens: (current?.promptTokens ?? 0) + (next?.promptTokens ?? 0),
    completionTokens: (current?.completionTokens ?? 0) + (next?.completionTokens ?? 0),
    totalTokens: (current?.totalTokens ?? 0) + (next?.totalTokens ?? 0),
  };
}

export function toUsageMetrics(
  usage: ProviderUsage | undefined,
  estimatedCostUsd?: number,
): LLMUsageMetrics {
  return {
    promptTokens: usage?.promptTokens ?? 0,
    completionTokens: usage?.completionTokens ?? 0,
    totalTokens: usage?.totalTokens ?? 0,
    estimatedCostUsd,
  };
}

export async function trackCompletion<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; latencyMs: number }> {
  const started = performance.now();
  const result = await fn();
  return {
    result,
    latencyMs: Math.round(performance.now() - started),
  };
}
