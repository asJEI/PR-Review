import { describe, expect, it } from "vitest";

import { MockProvider } from "../../providers/mock-provider.js";
import { DEFAULT_RISK_MOCK_RESPONSE } from "../../providers/mock-fixtures.js";
import { runRiskPipeline } from "./run-risk-pipeline.js";
import { createRiskReviewFixture } from "../../test-fixtures.js";

describe("runRiskPipeline", () => {
  it("generates structured RiskReviewReport end-to-end", async () => {
    const { input } = createRiskReviewFixture();

    const report = await runRiskPipeline(input, {
      provider: new MockProvider({ response: DEFAULT_RISK_MOCK_RESPONSE }),
      model: "mock-model",
    });

    expect(report.risks.length).toBeGreaterThan(0);
    expect(report.risks[0]!.category).toBe("authentication");
    expect(report.overallRiskLevel).toMatch(/critical|high|medium|low/);
    expect(report.meta.provider).toBe("mock");
    expect(report.risks[0]!.confidenceScore).toBeGreaterThan(0);
  });
});
