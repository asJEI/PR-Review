import type { RawSummaryAgentResponse } from "@pr-review/shared";

import type { LLMCompletionRequest, LLMCompletionResponse, LLMProvider } from "./llm-provider.js";

export interface MockProviderOptions {
  response?: RawSummaryAgentResponse | string;
  model?: string;
  delayMs?: number;
}

const DEFAULT_MOCK_RESPONSE: RawSummaryAgentResponse = {
  intent: "Updates JWT verification and auth middleware for token refresh support.",
  coreChanges: [
    "Modified verifyToken in src/auth/jwt.ts for refresh handling",
    "Updated authMiddleware in src/middleware/auth.ts",
  ],
  affectedModules: ["src/auth", "src/middleware"],
  infrastructureImpact: "Authentication flow changes may affect session handling",
  notableRisks: ["Auth logic changed in src/auth/jwt.ts"],
};

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
