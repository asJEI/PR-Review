import { describe, expect, it } from "vitest";

import { ReviewExecutionValidationError } from "../../utils/errors.js";
import { validateReviewOutput } from "./review-output-validator.js";
import type { PrSummary, ReviewCommentReport, RiskReviewReport } from "@pr-review/shared";

const summary: PrSummary = {
  title: "Auth update",
  summary: "JWT changes",
  keyChanges: ["verifyToken updated"],
  affectedSystems: ["src/auth"],
  architecturalImpact: "Auth flow",
  meta: { provider: "mock", model: "mock", groundingWarnings: [] },
};

const risks: RiskReviewReport = {
  risks: [],
  overallRiskLevel: "low",
  generatedAt: new Date().toISOString(),
  meta: { provider: "mock", model: "mock", filteredCount: 0, groundingWarnings: [] },
};

const comments: ReviewCommentReport = {
  comments: [],
  generatedAt: new Date().toISOString(),
  meta: { provider: "mock", model: "mock", filteredCount: 0, groundingWarnings: [] },
};

describe("validateReviewOutput", () => {
  it("throws in strict mode when no grounded risks or comments remain", () => {
    expect(() =>
      validateReviewOutput(summary, risks, comments, { strictOutput: true }),
    ).toThrow(ReviewExecutionValidationError);
  });

  it("passes strict mode when grounded output exists", () => {
    const groundedRisks: RiskReviewReport = {
      ...risks,
      risks: [
        {
          severity: "high",
          category: "auth",
          description: "Auth change",
          affectedFiles: ["src/auth/jwt.ts"],
          recommendation: "Review",
          confidence: "high",
          confidenceScore: 0.9,
          reasoning: "Auth",
        },
      ],
    };

    expect(() =>
      validateReviewOutput(summary, groundedRisks, comments, { strictOutput: true }),
    ).not.toThrow();
  });
});
