import { describe, expect, it, vi } from "vitest";

import { LLMProviderError } from "../utils/errors.js";
import type { LLMProvider } from "./llm-provider.js";
import { withRetry } from "./with-retry.js";

describe("withRetry", () => {
  it("retries transient provider failures", async () => {
    const inner: LLMProvider = {
      id: "flaky",
      complete: vi
        .fn()
        .mockRejectedValueOnce(new LLMProviderError("rate limited", { provider: "flaky", statusCode: 429 }))
        .mockResolvedValueOnce({ content: "ok", model: "m" }),
    };

    const provider = withRetry(inner, { maxRetries: 2, retryDelayMs: 1 });
    const result = await provider.complete({
      messages: [{ role: "user", content: "x" }],
      model: "m",
    });

    expect(result.content).toBe("ok");
    expect(inner.complete).toHaveBeenCalledTimes(2);
  });

  it("stops after max retries", async () => {
    const inner: LLMProvider = {
      id: "always-fail",
      complete: vi
        .fn()
        .mockRejectedValue(new LLMProviderError("server error", { provider: "always-fail", statusCode: 503 })),
    };

    const provider = withRetry(inner, { maxRetries: 2, retryDelayMs: 1 });

    await expect(
      provider.complete({ messages: [{ role: "user", content: "x" }], model: "m" }),
    ).rejects.toThrow(LLMProviderError);

    expect(inner.complete).toHaveBeenCalledTimes(3);
  });
});
