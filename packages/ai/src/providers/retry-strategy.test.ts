import { describe, expect, it } from "vitest";

import {
  evaluateRetry,
  isRateLimitError,
  isServerError,
  isTimeoutError,
  shouldRetryProviderError,
} from "./retry-strategy.js";
import { LLMProviderError } from "../utils/errors.js";

describe("retry-strategy", () => {
  it("retries rate limit errors", () => {
    const error = new LLMProviderError("rate limited", { provider: "openai", statusCode: 429 });
    expect(isRateLimitError(error)).toBe(true);
    expect(shouldRetryProviderError(error)).toBe(true);
  });

  it("retries server errors", () => {
    const error = new LLMProviderError("server error", { provider: "openai", statusCode: 503 });
    expect(isServerError(error)).toBe(true);
    expect(shouldRetryProviderError(error)).toBe(true);
  });

  it("retries timeout errors", () => {
    const error = new LLMProviderError("timeout", { provider: "openai", statusCode: 408 });
    expect(isTimeoutError(error)).toBe(true);
    expect(shouldRetryProviderError(error)).toBe(true);
  });

  it("does not retry client errors", () => {
    const error = new LLMProviderError("bad request", { provider: "openai", statusCode: 400 });
    expect(shouldRetryProviderError(error)).toBe(false);
  });

  it("computes exponential backoff", () => {
    const decision = evaluateRetry(new LLMProviderError("x", { provider: "openai", statusCode: 429 }), 1, {
      retryDelayMs: 100,
    });
    expect(decision.shouldRetry).toBe(true);
    expect(decision.delayMs).toBeGreaterThanOrEqual(200);
  });
});
