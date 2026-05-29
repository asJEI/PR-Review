import { describe, expect, it } from "vitest";

import { executeReview } from "./execute-review.js";
import { ReviewExecutionMockProvider } from "../providers/mock-provider.js";
import { createReviewExecutionFixture } from "../test-fixtures.js";

describe("executeReview", () => {
  it("exposes public executeReview API", async () => {
    const { input } = createReviewExecutionFixture();

    const report = await executeReview(input, {
      provider: new ReviewExecutionMockProvider(),
      model: "mock-model",
    });

    expect(report.summary).toBeTruthy();
    expect(report.risks).toBeTruthy();
    expect(report.comments).toBeTruthy();
    expect(report.meta.generatedAt).toBeTruthy();
  });
});
