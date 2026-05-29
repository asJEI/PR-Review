import { describe, expect, it } from "vitest";

import { estimateCost } from "./model-pricing.js";
import { toUsageMetrics, trackCompletion } from "./usage-tracker.js";

describe("usage-tracker", () => {
  it("records latency for completion", async () => {
    const { latencyMs } = await trackCompletion(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "ok";
    });

    expect(latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("builds usage metrics with optional cost", () => {
    const metrics = toUsageMetrics(
      { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
      0.001,
    );
    expect(metrics.totalTokens).toBe(1500);
    expect(metrics.estimatedCostUsd).toBe(0.001);
  });
});

describe("model-pricing", () => {
  it("estimates cost for known models", () => {
    const cost = estimateCost("openai", "gpt-4o-mini", {
      promptTokens: 1_000_000,
      completionTokens: 0,
      totalTokens: 1_000_000,
    });
    expect(cost).toBeGreaterThan(0);
  });

  it("returns zero cost for mock provider", () => {
    const cost = estimateCost("mock", "mock-model", {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
    });
    expect(cost).toBe(0);
  });
});
