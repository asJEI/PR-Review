import { describe, expect, it } from "vitest";

import type { ReviewCommentItem, ReviewCommentReport, PrSummary, RiskReviewReport } from "@pr-review/shared";

import { applyExecutionCommentRules, enforceReviewGrounding } from "./enforce-review-grounding.js";
import { createReviewExecutionFixture } from "../../test-fixtures.js";

function baseSummary(): PrSummary {
  return {
    title: "Auth update",
    summary: "JWT auth changes in src/auth/jwt.ts",
    keyChanges: ["Modified verifyToken in src/auth/jwt.ts"],
    affectedSystems: ["src/auth"],
    architecturalImpact: "Auth flow changes",
    meta: {
      provider: "mock",
      model: "mock",
      groundingWarnings: [],
    },
  };
}

function baseRisks(): RiskReviewReport {
  return {
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
}

function baseComments(comments: ReviewCommentItem[]): ReviewCommentReport {
  return {
    comments,
    generatedAt: new Date().toISOString(),
    meta: {
      provider: "mock",
      model: "mock",
      filteredCount: 0,
      groundingWarnings: [],
    },
  };
}

describe("enforceReviewGrounding", () => {
  it("demotes inferred line mappings to file-level", () => {
    const comments = baseComments([
      {
        file: "src/auth/jwt.ts",
        line: 42,
        symbol: "verifyToken",
        severity: "high",
        comment: "verifyToken refresh handling needs expiry tests.",
        suggestion: "Add tests",
        confidence: "high",
        confidenceScore: 0.8,
        reasoning: "Auth change",
        mapping: {
          confidence: "inferred",
          side: "RIGHT",
          githubPosition: 1,
          truncated: false,
        },
      },
    ]);

    const execution = applyExecutionCommentRules(comments.comments, undefined, []);

    expect(execution.comments[0]!.line).toBeNull();
    expect(execution.filteredCount).toBe(0);
  });

  it("drops speculative comments without evidence anchors", () => {
    const { input } = createReviewExecutionFixture();
    const comments = baseComments([
      {
        file: "src/auth/jwt.ts",
        line: null,
        symbol: null,
        severity: "medium",
        comment: "This might be a bug somewhere in the flow.",
        suggestion: "",
        confidence: "medium",
        confidenceScore: 0.6,
        reasoning: "Speculative",
      },
    ]);

    const result = enforceReviewGrounding(baseSummary(), baseRisks(), comments, input);

    expect(result.comments.comments).toHaveLength(0);
    expect(result.filteredCounts.comments).toBeGreaterThan(0);
  });
});
