import { describe, expect, it } from "vitest";

import { MockProvider } from "./mock-provider.js";
import {
  DEFAULT_MOCK_RESPONSE,
  DEFAULT_REVIEW_MOCK_RESPONSE,
  DEFAULT_RISK_MOCK_RESPONSE,
} from "./mock-fixtures.js";
import { ReviewLLMClient } from "./review-llm-client.js";

describe("ReviewLLMClient", () => {
  it("generateSummary returns envelope with raw summary schema", async () => {
    const client = new ReviewLLMClient({
      provider: new MockProvider({ response: DEFAULT_MOCK_RESPONSE }),
    });

    const result = await client.generateSummary("summarize this PR");

    expect(result.provider).toBe("mock");
    expect(result.result.coreChanges.length).toBeGreaterThan(0);
    expect(result.usage.totalTokens).toBeGreaterThanOrEqual(0);
  });

  it("generateRiskReview returns envelope with raw risk schema", async () => {
    const client = new ReviewLLMClient({
      provider: new MockProvider({ response: DEFAULT_RISK_MOCK_RESPONSE }),
    });

    const result = await client.generateRiskReview("analyze risks");

    expect(result.result.risks.length).toBeGreaterThan(0);
    expect(result.result.overallRiskLevel).toBe("high");
  });

  it("generateReviewComments returns envelope with raw comment schema", async () => {
    const client = new ReviewLLMClient({
      provider: new MockProvider({ response: DEFAULT_REVIEW_MOCK_RESPONSE }),
    });

    const result = await client.generateReviewComments("review comments");

    expect(result.result.comments.length).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
