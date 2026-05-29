import { describe, expect, it } from "vitest";

import {
  applyCommentConfidenceScoring,
  filterCommentsByConfidence,
  scoreCommentConfidence,
} from "./comment-confidence-scorer.js";
import type { ReviewCommentItem, ReviewCommentReport, RiskReviewReport } from "@pr-review/shared";
import { createReviewCommentFixture } from "../../test-fixtures.js";
import { collectKnownPaths } from "../../utils/path-grounding.js";

const BASE_COMMENT: ReviewCommentItem = {
  file: "src/auth/jwt.ts",
  line: 42,
  symbol: "verifyToken",
  severity: "high",
  comment: "Auth middleware verifyToken changes JWT refresh validation flow.",
  suggestion: "Add expiry edge-case tests",
  confidence: "medium",
  confidenceScore: 0,
  reasoning: "Auth middleware verifyToken changes JWT refresh validation flow.",
};

describe("comment-confidence-scorer", () => {
  it("boosts score for high-priority auth targets", () => {
    const { compressedContext, relevanceReport, reviewContext } = createReviewCommentFixture();
    const knownPaths = collectKnownPaths(compressedContext, relevanceReport, reviewContext);

    const score = scoreCommentConfidence(BASE_COMMENT, {
      compressedContext,
      relevanceReport,
      reviewContext,
      knownPaths,
      unknownFiles: [],
    });

    expect(score).toBeGreaterThan(0.6);
  });

  it("boosts when risk report aligns", () => {
    const { compressedContext, relevanceReport, reviewContext } = createReviewCommentFixture();
    const knownPaths = collectKnownPaths(compressedContext, relevanceReport, reviewContext);

    const riskReport: RiskReviewReport = {
      risks: [
        {
          severity: "high",
          category: "authentication",
          description: "Auth change in src/auth/jwt.ts",
          affectedFiles: ["src/auth/jwt.ts"],
          recommendation: "Review token handling",
          confidence: "high",
          confidenceScore: 0.9,
          reasoning: "Auth change",
        },
      ],
      overallRiskLevel: "high",
      generatedAt: new Date().toISOString(),
      meta: {
        provider: "mock",
        model: "mock",
        filteredCount: 0,
        groundingWarnings: [],
      },
    };

    const score = scoreCommentConfidence(BASE_COMMENT, {
      compressedContext,
      relevanceReport,
      reviewContext,
      riskReport,
      knownPaths,
      unknownFiles: [],
    });

    expect(score).toBeGreaterThan(0.7);
  });

  it("filters low-confidence comments", () => {
    const { relevanceReport } = createReviewCommentFixture();
    const report: ReviewCommentReport = {
      comments: [
        {
          ...BASE_COMMENT,
          file: "src/utils/helper.ts",
          line: null,
          symbol: null,
          confidenceScore: 0.3,
          confidence: "low",
        },
        { ...BASE_COMMENT, confidenceScore: 0.8, confidence: "high" },
      ],
      generatedAt: new Date().toISOString(),
      meta: {
        provider: "mock",
        model: "mock",
        filteredCount: 0,
        groundingWarnings: [],
      },
    };

    const filtered = filterCommentsByConfidence(report, relevanceReport, {
      minConfidenceScore: 0.5,
    });

    expect(filtered.report.comments).toHaveLength(1);
    expect(filtered.filteredCount).toBe(1);
  });

  it("applies confidence scoring to report", () => {
    const { compressedContext, relevanceReport, reviewContext } = createReviewCommentFixture();
    const knownPaths = collectKnownPaths(compressedContext, relevanceReport, reviewContext);

    const scored = applyCommentConfidenceScoring(
      {
        comments: [BASE_COMMENT],
        generatedAt: new Date().toISOString(),
        meta: {
          provider: "mock",
          model: "mock",
          filteredCount: 0,
          groundingWarnings: [],
        },
      },
      {
        compressedContext,
        relevanceReport,
        reviewContext,
        knownPaths,
        unknownFiles: [],
      },
    );

    expect(scored.comments[0]!.confidenceScore).toBeGreaterThan(0);
  });
});
