import { describe, expect, it } from "vitest";

import {
  parseRawCommentResponse,
  toGitHubReviewPayload,
  toGitHubReviewPayloads,
} from "./comment-response-parser.js";
import { CommentParseError } from "../../utils/errors.js";
import { createReviewCommentFixture } from "../../test-fixtures.js";
import { collectKnownPaths } from "../../utils/path-grounding.js";

describe("comment-response-parser", () => {
  it("parses and maps severity and suggestions", () => {
    const { reviewContext, compressedContext, relevanceReport } = createReviewCommentFixture();
    const knownPaths = collectKnownPaths(compressedContext, relevanceReport, reviewContext);

    const raw = parseRawCommentResponse(
      JSON.stringify({
        comments: [
          {
            file: "src/auth/jwt.ts",
            symbol: "verifyToken",
            lineHint: "42",
            severity: "major",
            body: "JWT refresh path needs expiry validation coverage.",
            suggestions: ["Add near-expiry token test"],
            confidence: "high",
          },
        ],
      }),
    );

    expect(raw.comments[0]!.severity).toBe("major");
    expect(raw.comments[0]!.suggestions[0]).toContain("near-expiry");

    const item = raw.comments[0]!;
    const normalized = {
      file: item.file,
      line: 42,
      symbol: item.symbol,
      severity: "high" as const,
      comment: item.body,
      suggestion: item.suggestions[0] ?? "",
      confidence: item.confidence,
      confidenceScore: 0.85,
      reasoning: item.body,
    };

    expect(knownPaths.has("src/auth/jwt.ts")).toBe(true);

    const payload = toGitHubReviewPayload({
      ...normalized,
      mapping: {
        file: "src/auth/jwt.ts",
        symbol: "verifyToken",
        hunkIndex: 0,
        startLine: 42,
        endLine: 42,
        changedLines: [42],
        side: "RIGHT",
        confidence: "exact",
      },
    });
    expect(payload?.path).toBe("src/auth/jwt.ts");
    expect(payload?.line).toBe(42);
    expect(payload?.side).toBe("RIGHT");

    const fileLevel = toGitHubReviewPayload({ ...normalized, line: null });
    expect(fileLevel?.body).toContain("[File-level review]");

    expect(toGitHubReviewPayloads([normalized]).length).toBe(1);
  });

  it("rejects invalid comment response", () => {
    expect(() => parseRawCommentResponse('{"comments":[]}')).toThrow(CommentParseError);
  });
});
