import { describe, expect, it } from "vitest";

import {
  DedupeProcessor,
  DiscussionDedupeProcessor,
  StyleFilterProcessor,
} from "./style-filter-processor.js";
import type { ReviewCommentItem } from "@pr-review/shared";
import { createReviewCommentFixture } from "../../test-fixtures.js";

const COMMENT: ReviewCommentItem = {
  file: "src/auth/jwt.ts",
  line: null,
  symbol: "verifyToken",
  severity: "high",
  comment: "Auth validation changed",
  suggestion: "Add tests",
  confidence: "high",
  confidenceScore: 0.8,
  reasoning: "Auth validation changed",
};

describe("style-filter-processor", () => {
  it("drops lint/style comments", () => {
    const processor = new StyleFilterProcessor();
    const result = processor.process([
      COMMENT,
      {
        ...COMMENT,
        comment: "Variable naming convention should be camelCase",
      },
    ]);

    expect(result).toHaveLength(1);
  });

  it("dedupes identical comments", () => {
    const processor = new DedupeProcessor();
    const result = processor.process([COMMENT, COMMENT]);
    expect(result).toHaveLength(1);
  });

  it("skips comments overlapping existing discussion", () => {
    const { reviewContext } = createReviewCommentFixture();
    const processor = new DiscussionDedupeProcessor();
    const result = processor.process(
      [
        {
          ...COMMENT,
          comment: "Auth validation changed in verifyToken",
        },
      ],
      { reviewContext },
    );

    expect(result).toHaveLength(0);
  });
});
