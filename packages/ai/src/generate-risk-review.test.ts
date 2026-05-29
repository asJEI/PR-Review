import { describe, expect, it } from "vitest";

import { generateRiskReview } from "./risk/risk-review-service.js";
import { MockProvider } from "./providers/mock-provider.js";
import { DEFAULT_RISK_MOCK_RESPONSE } from "./providers/mock-fixtures.js";
import { StructuredOutputError } from "./utils/errors.js";
import { createRiskReviewFixture } from "./test-fixtures.js";

describe("generateRiskReview", () => {
  it("exposes public API for risk review generation", async () => {
    const { input } = createRiskReviewFixture();

    const report = await generateRiskReview(input, {
      provider: new MockProvider({ response: DEFAULT_RISK_MOCK_RESPONSE }),
    });

    expect(report.risks.length).toBeGreaterThan(0);
    expect(report.risks[0]!.recommendation).toBeTruthy();
  });

  it("propagates parse errors from invalid LLM output", async () => {
    const { input } = createRiskReviewFixture();

    await expect(
      generateRiskReview(input, {
        provider: new MockProvider({ response: "not-json" }),
      }),
    ).rejects.toThrow(StructuredOutputError);
  });
});
