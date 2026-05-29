import type { LLMUsage } from "./llm-provider.js";

interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

const PRICING: Record<string, ModelPricing> = {
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10 },
  "deepseek-chat": { inputPer1M: 0.14, outputPer1M: 0.28 },
  "claude-3-5-haiku-20241022": { inputPer1M: 0.8, outputPer1M: 4 },
  "claude-3-5-sonnet-20241022": { inputPer1M: 3, outputPer1M: 15 },
};

function resolvePricing(model: string): ModelPricing {
  if (PRICING[model]) {
    return PRICING[model]!;
  }

  const prefixMatch = Object.keys(PRICING).find((key) => model.startsWith(key.split("-")[0]!));
  if (prefixMatch) {
    return PRICING[prefixMatch]!;
  }

  return { inputPer1M: 1, outputPer1M: 3 };
}

export function estimateCost(provider: string, model: string, usage?: LLMUsage): number | undefined {
  if (!usage) {
    return undefined;
  }

  const pricing = resolvePricing(model);
  const inputCost = (usage.promptTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.outputPer1M;
  const total = inputCost + outputCost;

  if (provider === "mock") {
    return 0;
  }

  return Math.round(total * 1_000_000) / 1_000_000;
}
