import { createOpenAICompatibleProviderFromEnv } from "../providers/openai-compatible-provider.js";
import { MockProvider } from "../providers/mock-provider.js";
import type { LLMProvider } from "../providers/llm-provider.js";
import { withRetry } from "../providers/with-retry.js";

export interface AgentGeneratorOptions {
  provider?: LLMProvider;
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
  return {
    model:
      options?.model ?? process.env.OPENAI_MODEL ?? overrides?.model ?? DEFAULT_AGENT_OPTIONS.model,
    temperature: options?.temperature ?? overrides?.temperature ?? DEFAULT_AGENT_OPTIONS.temperature,
    maxRetries: options?.maxRetries ?? overrides?.maxRetries ?? DEFAULT_AGENT_OPTIONS.maxRetries,
    retryDelayMs:
      options?.retryDelayMs ?? overrides?.retryDelayMs ?? DEFAULT_AGENT_OPTIONS.retryDelayMs,
  };
}

export function resolveProvider(
  options?: AgentGeneratorOptions,
  mockWarning?: string,
): LLMProvider {
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

  if (process.env.NODE_ENV !== "test" && mockWarning) {
    console.warn(mockWarning);
  }

  return withRetry(new MockProvider(), {
    maxRetries: options?.maxRetries,
    retryDelayMs: options?.retryDelayMs,
  });
}

export function getBaseProviderId(provider: LLMProvider): string {
  return provider.id.replace(/-with-retry$/, "");
}
