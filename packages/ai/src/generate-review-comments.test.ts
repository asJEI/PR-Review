import { describe, expect, it } from "vitest";

import { generateReviewComments } from "./comments/review-comment-service.js";
import { MockProvider } from "./providers/mock-provider.js";
import { DEFAULT_REVIEW_MOCK_RESPONSE } from "./providers/mock-fixtures.js";
import { CommentParseError } from "./utils/errors.js";
import { createReviewCommentFixture } from "./test-fixtures.js";

describe("generateReviewComments", () => {
  it("exposes public API for review comment generation", async () => {
    const { input } = createReviewCommentFixture();

    const report = await generateReviewComments(input, {
      provider: new MockProvider({ response: DEFAULT_REVIEW_MOCK_RESPONSE }),
    });

    expect(report.comments.length).toBeGreaterThan(0);
    expect(report.comments[0]!.suggestion).toBeTruthy();
  });

  it("propagates parse errors from invalid LLM output", async () => {
    const { input } = createReviewCommentFixture();

    await expect(
      generateReviewComments(input, {
        provider: new MockProvider({ response: "not-json" }),
      }),
    ).rejects.toThrow(CommentParseError);
  });
});
