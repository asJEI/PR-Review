import type { LLMCompletionRequest, LLMCompletionResponse, LLMProvider } from "./llm-provider.js";
import { DEFAULT_MOCK_RESPONSE } from "./mock-fixtures.js";

export interface MockProviderOptions {
  response?: unknown;
  model?: string;
  delayMs?: number;
}

export class MockProvider implements LLMProvider {
  readonly id = "mock";

  constructor(private readonly options: MockProviderOptions = {}) {}

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (this.options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }

    const content =
      typeof this.options.response === "string"
        ? this.options.response
        : JSON.stringify(this.options.response ?? DEFAULT_MOCK_RESPONSE);

    const promptTokens = request.messages.reduce((sum, message) => sum + message.content.length, 0);
    const completionTokens = content.length;

    return {
      content,
      model: this.options.model ?? request.model ?? "mock-model",
      usage: {
        promptTokens: Math.ceil(promptTokens / 4),
        completionTokens: Math.ceil(completionTokens / 4),
        totalTokens: Math.ceil((promptTokens + completionTokens) / 4),
      },
    };
  }
}
