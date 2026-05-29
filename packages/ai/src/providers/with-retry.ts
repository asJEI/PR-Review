import { LLMProviderError } from "../utils/errors.js";
import type { LLMCompletionRequest, LLMCompletionResponse, LLMProvider } from "./llm-provider.js";
import { evaluateRetry } from "./retry-strategy.js";

export interface RetryOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const DEFAULT_SHOULD_RETRY = (error: unknown): boolean => {
  if (error instanceof LLMProviderError) {
    const code = error.statusCode;
    return code === 408 || code === 429 || (code !== undefined && code >= 500);
  }
  return true;
};

export function isRetryWrapped(provider: LLMProvider): boolean {
  return provider.id.endsWith("-with-retry");
}

export function withRetry(provider: LLMProvider, options: RetryOptions = {}): LLMProvider {
  if (isRetryWrapped(provider)) {
    return provider;
  }

  const maxRetries = options.maxRetries ?? 3;
  const retryDelayMs = options.retryDelayMs ?? 500;
  const shouldRetry = options.shouldRetry ?? DEFAULT_SHOULD_RETRY;

  return {
    id: `${provider.id}-with-retry`,
    capabilities: provider.capabilities,
    stream: provider.stream?.bind(provider),
    completeWithTools: provider.completeWithTools?.bind(provider),
    async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
      let lastError: unknown;

      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
          return await provider.complete(request);
        } catch (error) {
          lastError = error;
          if (attempt >= maxRetries || !shouldRetry(error, attempt)) {
            break;
          }
          const decision = evaluateRetry(error, attempt, { retryDelayMs });
          const delay = decision.delayMs ?? retryDelayMs * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    },
  };
}
