import { describe, expect, it } from "vitest";

import { validateCommentGrounding } from "./comment-grounding-validator.js";
import type { ReviewCommentItem } from "@pr-review/shared";
import { createReviewCommentFixture } from "../../test-fixtures.js";

describe("comment-grounding-validator", () => {
  it("retains grounded comments", () => {
    const { compressedContext, relevanceReport, reviewContext } = createReviewCommentFixture();

    const comments: ReviewCommentItem[] = [
      {
        file: "src/auth/jwt.ts",
        line: 42,
        symbol: "verifyToken",
        severity: "high",
        comment: "JWT refresh validation needs explicit expiry handling.",
        suggestion: "Add tests",
        confidence: "high",
        confidenceScore: 0.85,
        reasoning: "JWT refresh validation needs explicit expiry handling.",
      },
    ];

    const result = validateCommentGrounding(
      comments,
      compressedContext,
      relevanceReport,
      reviewContext,
    );

    expect(result.groundedComments).toHaveLength(1);
  });

  it("filters unknown files and generic praise", () => {
    const { compressedContext, relevanceReport, reviewContext } = createReviewCommentFixture();

    const comments: ReviewCommentItem[] = [
      {
        file: "src/unknown/file.ts",
        line: null,
        symbol: null,
        severity: "low",
        comment: "Looks good to me",
        suggestion: "",
        confidence: "low",
        confidenceScore: 0.2,
        reasoning: "Looks good to me",
      },
    ];

    const result = validateCommentGrounding(
      comments,
      compressedContext,
      relevanceReport,
      reviewContext,
    );

    expect(result.groundedComments).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
