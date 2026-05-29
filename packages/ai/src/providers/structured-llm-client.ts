import type { LLMReviewResult } from "@pr-review/shared";

import { extractJson } from "../utils/extract-json.js";
import { StructuredOutputError, SummaryParseError } from "../utils/errors.js";
import { estimateCost } from "./model-pricing.js";
import type { LLMCompletionRequest, LLMMessage, LLMProvider } from "./llm-provider.js";
import type { SchemaValidator } from "./schema/schema-validator.js";
import { getBaseProviderId } from "./provider-utils.js";
import { mergeUsage, toUsageMetrics, trackCompletion } from "./usage-tracker.js";

const JSON_REPAIR_SUFFIX =
  "\n\nYour previous response was invalid JSON. Return ONLY valid JSON matching the required schema.";

export interface StructuredLLMClientOptions {
  maxParseRetries?: number;
}

export interface StructuredCompletionRequest {
  messages: LLMMessage[];
  model: string;
  temperature?: number;
  timeoutMs?: number;
}

export class StructuredLLMClient {
  constructor(
    private readonly provider: LLMProvider,
    private readonly options: StructuredLLMClientOptions = {},
  ) {}

  async completeStructured<T>(
    request: StructuredCompletionRequest,
    validator: SchemaValidator<T>,
  ): Promise<LLMReviewResult<T>> {
    const maxParseRetries = this.options.maxParseRetries ?? 2;
    let attempts = 0;
    let mergedUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let lastError: StructuredOutputError | null = null;
    let messages = [...request.messages];
    let completionModel = request.model;
    let totalLatencyMs = 0;

    while (attempts <= maxParseRetries) {
      attempts += 1;

      const { result: completion, latencyMs } = await trackCompletion(() =>
        this.provider.complete({
          messages,
          model: request.model,
          temperature: request.temperature,
          responseFormat: "json",
          timeoutMs: request.timeoutMs,
        } satisfies LLMCompletionRequest),
      );

      totalLatencyMs += latencyMs;
      mergedUsage = mergeUsage(mergedUsage, completion.usage);
      completionModel = completion.model;

      try {
        const parsed = extractJson(completion.content);
        const validation = validator.validate(parsed);

        if (!validation.success || validation.value === undefined) {
          throw new StructuredOutputError(
            validation.errors.join("; ") || "Schema validation failed",
            completion.content.slice(0, 500),
            validation.errors,
          );
        }

        const providerId = getBaseProviderId(this.provider);
        const estimatedCostUsd = estimateCost(providerId, completionModel, mergedUsage);

        return {
          provider: providerId,
          model: completionModel,
          latencyMs: totalLatencyMs,
          usage: toUsageMetrics(mergedUsage, estimatedCostUsd),
          result: validation.value,
          attempts,
        };
      } catch (error) {
        const snippet =
          error instanceof StructuredOutputError
            ? error.rawSnippet
            : error instanceof SummaryParseError
              ? error.rawSnippet
              : "";

        lastError = new StructuredOutputError(
          error instanceof Error ? error.message : "Failed to parse structured output",
          snippet,
          error instanceof StructuredOutputError ? error.validationErrors : [],
        );

        if (attempts > maxParseRetries) {
          break;
        }

        messages = appendRepairSuffix(messages);
      }
    }

    throw lastError ?? new StructuredOutputError("Structured completion failed", "", []);
  }
}

function appendRepairSuffix(messages: LLMMessage[]): LLMMessage[] {
  const copy = [...messages];
  const last = copy[copy.length - 1];
  if (last?.role === "user") {
    copy[copy.length - 1] = {
      ...last,
      content: `${last.content}${JSON_REPAIR_SUFFIX}`,
    };
    return copy;
  }

  copy.push({ role: "user", content: JSON_REPAIR_SUFFIX.trim() });
  return copy;
}
