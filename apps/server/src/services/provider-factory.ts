import {
  AnthropicProvider,
  DeepSeekProvider,
  OpenAIProvider,
  ReviewExecutionMockProvider,
  resolveProviderFromEnv,
  withRetry,
  withTimeout,
  type LLMProvider,
} from "@pr-review/ai";

import type { ServerProviderId } from "../types.js";

function createExplicitProvider(provider: Exclude<ServerProviderId, "auto">): LLMProvider {
  if (provider === "mock") {
    return new ReviewExecutionMockProvider();
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required when provider=openai");
    }
    return new OpenAIProvider({
      apiKey,
      baseUrl: process.env.OPENAI_BASE_URL,
      defaultModel: process.env.OPENAI_MODEL,
      timeoutMs: process.env.LLM_TIMEOUT_MS ? Number(process.env.LLM_TIMEOUT_MS) : undefined,
    });
  }

  if (provider === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is required when provider=deepseek");
    }
    return new DeepSeekProvider({
      apiKey,
      baseUrl: process.env.DEEPSEEK_BASE_URL,
      defaultModel: process.env.DEEPSEEK_MODEL,
      timeoutMs: process.env.LLM_TIMEOUT_MS ? Number(process.env.LLM_TIMEOUT_MS) : undefined,
    });
  }

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required when provider=anthropic");
    }
    return new AnthropicProvider({
      apiKey,
      baseUrl: process.env.ANTHROPIC_BASE_URL,
      defaultModel: process.env.ANTHROPIC_MODEL,
      timeoutMs: process.env.LLM_TIMEOUT_MS ? Number(process.env.LLM_TIMEOUT_MS) : undefined,
    });
  }

  throw new Error(`Unsupported provider: ${provider as string}`);
}

export function resolveServerProvider(input: {
  provider?: ServerProviderId;
  forceMock?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}): { provider: LLMProvider; resolvedProviderId: ServerProviderId; warning?: string } {
  if (input.forceMock) {
    return {
      provider: withRetry(new ReviewExecutionMockProvider(), {
        maxRetries: input.maxRetries,
        retryDelayMs: input.retryDelayMs,
      }),
      resolvedProviderId: "mock",
      warning: "forceMock=true, using MockProvider",
    };
  }

  if (input.provider && input.provider !== "auto") {
    const explicit = createExplicitProvider(input.provider);
    return {
      provider: withRetry(withTimeout(explicit), {
        maxRetries: input.maxRetries,
        retryDelayMs: input.retryDelayMs,
      }),
      resolvedProviderId: input.provider,
    };
  }

  const envProvider = resolveProviderFromEnv();
  if (envProvider) {
    return { provider: envProvider, resolvedProviderId: "auto" };
  }

  return {
    provider: withRetry(new ReviewExecutionMockProvider(), {
      maxRetries: input.maxRetries,
      retryDelayMs: input.retryDelayMs,
    }),
    resolvedProviderId: "mock",
    warning: "No LLM API key found, fallback to MockProvider",
  };
}

