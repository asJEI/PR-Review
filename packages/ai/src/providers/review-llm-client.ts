import type {
  LLMReviewResult,
  RawReviewCommentResponse,
  RawRiskAgentResponse,
  RawSummaryAgentResponse,
} from "@pr-review/shared";

import { MockProvider } from "./mock-provider.js";
import {
  DEFAULT_MOCK_RESPONSE,
  DEFAULT_REVIEW_MOCK_RESPONSE,
  DEFAULT_RISK_MOCK_RESPONSE,
} from "./mock-fixtures.js";
import { resolveProviderFromEnv } from "./provider-registry.js";
import { commentSchemaValidator } from "./schema/comment-schema.js";
import { riskSchemaValidator } from "./schema/risk-schema.js";
import { summarySchemaValidator } from "./schema/summary-schema.js";
import { StructuredLLMClient } from "./structured-llm-client.js";
import type { LLMProvider } from "./llm-provider.js";
import { resolveProviderEnv } from "./provider-config.js";

export interface ReviewLLMClientOptions {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  timeoutMs?: number;
  maxParseRetries?: number;
}

export class ReviewLLMClient {
  private readonly structured: StructuredLLMClient;
  private readonly defaultModel: string;
  private readonly defaultTemperature: number;
  private readonly timeoutMs?: number;

  constructor(options: ReviewLLMClientOptions = {}) {
    const provider =
      options.provider ??
      resolveProviderFromEnv() ??
      new MockProvider({ response: DEFAULT_MOCK_RESPONSE });

    this.structured = new StructuredLLMClient(provider, {
      maxParseRetries: options.maxParseRetries,
    });

    const env = resolveProviderEnv();
    this.defaultModel = options.model ?? env?.defaultModel ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    this.defaultTemperature = options.temperature ?? 0.2;
    this.timeoutMs = options.timeoutMs ?? env?.timeoutMs;
  }

  async generateSummary(
    prompt: string,
    options?: Pick<ReviewLLMClientOptions, "model" | "temperature" | "timeoutMs">,
  ): Promise<LLMReviewResult<RawSummaryAgentResponse>> {
    return this.structured.completeStructured(
      {
        messages: [{ role: "user", content: prompt }],
        model: options?.model ?? this.defaultModel,
        temperature: options?.temperature ?? this.defaultTemperature,
        timeoutMs: options?.timeoutMs ?? this.timeoutMs,
      },
      summarySchemaValidator,
    );
  }

  async generateRiskReview(
    prompt: string,
    options?: Pick<ReviewLLMClientOptions, "model" | "temperature" | "timeoutMs">,
  ): Promise<LLMReviewResult<RawRiskAgentResponse>> {
    return this.structured.completeStructured(
      {
        messages: [{ role: "user", content: prompt }],
        model: options?.model ?? this.defaultModel,
        temperature: options?.temperature ?? 0.1,
        timeoutMs: options?.timeoutMs ?? this.timeoutMs,
      },
      riskSchemaValidator,
    );
  }

  async generateReviewComments(
    prompt: string,
    options?: Pick<ReviewLLMClientOptions, "model" | "temperature" | "timeoutMs">,
  ): Promise<LLMReviewResult<RawReviewCommentResponse>> {
    return this.structured.completeStructured(
      {
        messages: [{ role: "user", content: prompt }],
        model: options?.model ?? this.defaultModel,
        temperature: options?.temperature ?? this.defaultTemperature,
        timeoutMs: options?.timeoutMs ?? this.timeoutMs,
      },
      commentSchemaValidator,
    );
  }
}

export function createReviewLLMClientFromEnv(
  options: ReviewLLMClientOptions = {},
): ReviewLLMClient {
  const provider = options.provider ?? resolveProviderFromEnv() ?? new MockProvider();
  return new ReviewLLMClient({ ...options, provider });
}

export function createMockReviewLLMClient(responseKind: "summary" | "risk" | "comment"): ReviewLLMClient {
  const response =
    responseKind === "risk"
      ? DEFAULT_RISK_MOCK_RESPONSE
      : responseKind === "comment"
        ? DEFAULT_REVIEW_MOCK_RESPONSE
        : DEFAULT_MOCK_RESPONSE;

  return new ReviewLLMClient({
    provider: new MockProvider({ response }),
  });
}
