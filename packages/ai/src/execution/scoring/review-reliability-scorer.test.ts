import { describe, expect, it } from "vitest";

import { scoreReviewReliability } from "./review-reliability-scorer.js";
import type { PrSummary, ReviewCommentReport, RiskReviewReport } from "@pr-review/shared";

describe("review-reliability-scorer", () => {
  it("rolls up comment and risk confidence with mapping bonus", () => {
    const summary: PrSummary = {
      title: "Auth",
      summary: "Changes",
      keyChanges: ["verifyToken"],
      affectedSystems: ["src/auth"],
      architecturalImpact: "Auth",
      meta: { provider: "mock", model: "mock", groundingWarnings: [] },
    };

    const risks: RiskReviewReport = {
      risks: [
        {
          severity: "high",
          category: "auth",
          description: "Auth",
          affectedFiles: ["src/auth/jwt.ts"],
          recommendation: "Review",
          confidence: "high",
          confidenceScore: 0.85,
          reasoning: "Auth",
        },
      ],
      overallRiskLevel: "high",
      generatedAt: new Date().toISOString(),
      meta: { provider: "mock", model: "mock", filteredCount: 0, groundingWarnings: [] },
    };

    const comments: ReviewCommentReport = {
      comments: [
        {
          file: "src/auth/jwt.ts",
          line: 42,
          symbol: "verifyToken",
          severity: "high",
          comment: "verifyToken change",
          suggestion: "Test",
          confidence: "high",
          confidenceScore: 0.9,
          reasoning: "Auth",
          mapping: { confidence: "exact", side: "RIGHT", githubPosition: 1, truncated: false },
        },
      ],
      generatedAt: new Date().toISOString(),
      meta: { provider: "mock", model: "mock", filteredCount: 0, groundingWarnings: [] },
    };

    const score = scoreReviewReliability({
      summary,
      risks,
      comments,
      groundingWarningCount: 0,
    });

    expect(score).toBeGreaterThan(0.7);
    expect(score).toBeLessThanOrEqual(1);
  });
});
