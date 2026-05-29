import { LLMProviderError } from "../utils/errors.js";
import type { LLMCompletionRequest, LLMCompletionResponse, LLMProvider } from "./llm-provider.js";

export interface TimeoutOptions {
  timeoutMs?: number;
}

export function withTimeout(provider: LLMProvider, options: TimeoutOptions = {}): LLMProvider {
  const defaultTimeoutMs = options.timeoutMs ?? 60_000;

  return {
    id: `${provider.id}-with-timeout`,
    capabilities: provider.capabilities,
    stream: provider.stream?.bind(provider),
    completeWithTools: provider.completeWithTools?.bind(provider),
    async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
      try {
        return await provider.complete({
          ...request,
          timeoutMs: request.timeoutMs ?? defaultTimeoutMs,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "TimeoutError") {
          throw new LLMProviderError("LLM request timed out", {
            provider: provider.id,
            statusCode: 408,
            cause: error,
          });
        }
        throw error;
      }
    },
  };
}
