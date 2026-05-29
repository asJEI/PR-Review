export interface LLMUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
}

export interface LLMReviewResult<T> {
  provider: string;
  model: string;
  latencyMs: number;
  usage: LLMUsageMetrics;
  result: T;
  attempts: number;
}

export type ProviderId = "openai" | "deepseek" | "anthropic" | "mock";

export interface ProviderCapabilities {
  jsonMode: boolean;
  streaming: boolean;
  toolCalling: boolean;
}
