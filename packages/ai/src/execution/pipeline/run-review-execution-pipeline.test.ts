import { describe, expect, it } from "vitest";

import { ReviewExecutionMockProvider } from "../../providers/mock-provider.js";
import { runReviewExecutionPipeline } from "./run-review-execution-pipeline.js";
import { createReviewExecutionFixture } from "../../test-fixtures.js";

describe("runReviewExecutionPipeline", () => {
  it("returns unified ReviewExecutionReport end-to-end", async () => {
    const { input } = createReviewExecutionFixture();

    const report = await runReviewExecutionPipeline(input, {
      provider: new ReviewExecutionMockProvider(),
      model: "mock-model",
    });

    expect(report.summary.title).toBe("Auth update");
    expect(report.risks.risks.length).toBeGreaterThan(0);
    expect(report.comments.comments.length).toBeGreaterThan(0);
    expect(report.meta.provider).toBe("mock");
    expect(report.meta.models.summary).toBeTruthy();
    expect(report.meta.models.risk).toBeTruthy();
    expect(report.meta.models.comments).toBeTruthy();
    expect(report.meta.latencyMs.total).toBeGreaterThanOrEqual(0);
    expect(report.meta.reliabilityScore).toBeGreaterThan(0);
    expect(report.meta.attempts.summary).toBeGreaterThanOrEqual(1);
  });
});
