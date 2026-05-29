import { MockProvider } from "../providers/mock-provider.js";
import { DEFAULT_MOCK_RESPONSE } from "../providers/mock-fixtures.js";
import { resolveProviderFromEnv } from "../providers/provider-registry.js";
import type { LLMProvider } from "../providers/llm-provider.js";
import type { ReviewLLMClient } from "../providers/review-llm-client.js";
import { isRetryWrapped, withRetry } from "../providers/with-retry.js";
import { resolveProviderEnv } from "../providers/provider-config.js";

export interface AgentGeneratorOptions {
  provider?: LLMProvider;
  llmClient?: ReviewLLMClient;
  model?: string;
  temperature?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export type ResolvedAgentGeneratorOptions = Required<
  Pick<AgentGeneratorOptions, "model" | "temperature" | "maxRetries" | "retryDelayMs">
>;

export const DEFAULT_AGENT_OPTIONS: ResolvedAgentGeneratorOptions = {
  model: "gpt-4o-mini",
  temperature: 0.2,
  maxRetries: 3,
  retryDelayMs: 500,
};

export function resolveAgentOptions(
  options?: AgentGeneratorOptions,
  overrides?: Partial<ResolvedAgentGeneratorOptions>,
): ResolvedAgentGeneratorOptions {
  const envConfig = resolveProviderEnv();
  const defaultModel = envConfig?.defaultModel ?? process.env.OPENAI_MODEL ?? DEFAULT_AGENT_OPTIONS.model;

  return {
    model: options?.model ?? defaultModel,
    temperature: options?.temperature ?? overrides?.temperature ?? DEFAULT_AGENT_OPTIONS.temperature,
    maxRetries:
      options?.maxRetries ?? envConfig?.maxRetries ?? overrides?.maxRetries ?? DEFAULT_AGENT_OPTIONS.maxRetries,
    retryDelayMs:
      options?.retryDelayMs ??
      envConfig?.retryDelayMs ??
      overrides?.retryDelayMs ??
      DEFAULT_AGENT_OPTIONS.retryDelayMs,
  };
}

export function resolveProvider(
  options?: AgentGeneratorOptions,
  mockWarning?: string,
  mockResponse?: unknown,
): LLMProvider {
  if (options?.provider) {
    if (isRetryWrapped(options.provider)) {
      return options.provider;
    }
    return withRetry(options.provider, {
      maxRetries: options.maxRetries,
      retryDelayMs: options.retryDelayMs,
    });
  }

  const fromEnv = resolveProviderFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  if (process.env.NODE_ENV !== "test" && mockWarning) {
    console.warn(mockWarning);
  }

  return withRetry(new MockProvider({ response: mockResponse ?? DEFAULT_MOCK_RESPONSE }), {
    maxRetries: options?.maxRetries,
    retryDelayMs: options?.retryDelayMs,
  });
}

export { getBaseProviderId } from "../providers/provider-utils.js";
