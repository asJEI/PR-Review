import { describe, expect, it } from "vitest";

import { MockProvider } from "../../providers/mock-provider.js";
import { DEFAULT_REVIEW_MOCK_RESPONSE } from "../../providers/mock-fixtures.js";
import { runCommentPipeline } from "./run-comment-pipeline.js";
import { createReviewCommentFixture } from "../../test-fixtures.js";

describe("runCommentPipeline", () => {
  it("generates structured ReviewCommentReport end-to-end", async () => {
    const { input } = createReviewCommentFixture();

    const report = await runCommentPipeline(input, {
      provider: new MockProvider({ response: DEFAULT_REVIEW_MOCK_RESPONSE }),
      model: "mock-model",
    });

    expect(report.comments.length).toBeGreaterThan(0);
    expect(report.comments[0]!.file).toBe("src/auth/jwt.ts");
    expect(report.comments[0]!.comment).toBeTruthy();
    expect(report.meta.provider).toBe("mock");
  });
});
