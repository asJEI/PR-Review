import { describe, expect, it } from "vitest";

import { validateRiskGrounding } from "./risk-grounding-validator.js";
import type { RiskReviewReport } from "@pr-review/shared";
import { createRiskReviewFixture } from "../../test-fixtures.js";

describe("risk-grounding-validator", () => {
  it("retains grounded auth risks", () => {
    const { compressedContext, relevanceReport, reviewContext } = createRiskReviewFixture();

    const report: RiskReviewReport = {
      risks: [
        {
          severity: "high",
          category: "authentication",
          description: "JWT verification modified in src/auth/jwt.ts",
          affectedFiles: ["src/auth/jwt.ts"],
          recommendation: "Review token expiry",
          confidence: "high",
          confidenceScore: 0.85,
          reasoning: "Auth logic changed",
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

    const result = validateRiskGrounding(
      report,
      compressedContext,
      relevanceReport,
      reviewContext,
    );

    expect(result.groundedRisks).toHaveLength(1);
    expect(result.warnings.some((w) => w.includes("Unverified"))).toBe(false);
  });

  it("removes ungrounded and style risks", () => {
    const { compressedContext, relevanceReport, reviewContext } = createRiskReviewFixture();

    const report: RiskReviewReport = {
      risks: [
        {
          severity: "low",
          category: "style",
          description: "Variable naming convention issue",
          affectedFiles: ["src/unknown/file.ts"],
          recommendation: "Rename variable",
          confidence: "low",
          confidenceScore: 0.3,
          reasoning: "Lint warning",
        },
      ],
      overallRiskLevel: "low",
      generatedAt: new Date().toISOString(),
      meta: {
        provider: "mock",
        model: "mock",
        filteredCount: 0,
        groundingWarnings: [],
      },
    };

    const result = validateRiskGrounding(
      report,
      compressedContext,
      relevanceReport,
      reviewContext,
    );

    expect(result.groundedRisks).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
