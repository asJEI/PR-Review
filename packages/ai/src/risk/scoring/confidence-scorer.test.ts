import { describe, expect, it } from "vitest";

import {
  applyConfidenceScoring,
  confidenceLabelFromScore,
  filterRisksByConfidence,
  scoreRiskConfidence,
} from "./confidence-scorer.js";
import type { RiskReviewItem, RiskReviewReport } from "@pr-review/shared";
import { createRiskReviewFixture } from "../../test-fixtures.js";
import { collectKnownPaths } from "../../utils/path-grounding.js";

const BASE_RISK: RiskReviewItem = {
  severity: "high",
  category: "authentication",
  description: "Auth logic changed in src/auth/jwt.ts",
  affectedFiles: ["src/auth/jwt.ts"],
  recommendation: "Review token handling",
  confidence: "medium",
  confidenceScore: 0,
  reasoning: "Auth logic changed in src/auth/jwt.ts",
};

describe("confidence-scorer", () => {
  it("boosts score for high-priority grounded files", () => {
    const { compressedContext, relevanceReport, reviewContext } = createRiskReviewFixture();
    const knownPaths = collectKnownPaths(compressedContext, relevanceReport, reviewContext);

    const result = scoreRiskConfidence(BASE_RISK, {
      compressedContext,
      relevanceReport,
      reviewContext,
      knownPaths,
      unknownFiles: [],
    });

    expect(result.score).toBeGreaterThan(0.6);
    expect(confidenceLabelFromScore(0.8)).toBe("high");
  });

  it("penalizes generic phrasing", () => {
    const { compressedContext, relevanceReport, reviewContext } = createRiskReviewFixture();
    const knownPaths = collectKnownPaths(compressedContext, relevanceReport, reviewContext);

    const result = scoreRiskConfidence(
      {
        ...BASE_RISK,
        description: "This may be vulnerable to potential security issue",
      },
      {
        compressedContext,
        relevanceReport,
        reviewContext,
        knownPaths,
        unknownFiles: [],
      },
    );

    expect(result.score).toBeLessThan(0.6);
  });

  it("filters low-confidence risks", () => {
    const report: RiskReviewReport = {
      risks: [
        { ...BASE_RISK, confidenceScore: 0.3, confidence: "low" },
        { ...BASE_RISK, confidenceScore: 0.8, confidence: "high" },
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

    const filtered = filterRisksByConfidence(report, {
      minConfidenceScore: 0.5,
      includeMediumConfidence: true,
    });

    expect(filtered.report.risks).toHaveLength(1);
    expect(filtered.filteredCount).toBe(1);
  });

  it("applies confidence scoring to all risks", () => {
    const { compressedContext, relevanceReport, reviewContext } = createRiskReviewFixture();
    const knownPaths = collectKnownPaths(compressedContext, relevanceReport, reviewContext);

    const report: RiskReviewReport = {
      risks: [BASE_RISK],
      overallRiskLevel: "high",
      generatedAt: new Date().toISOString(),
      meta: {
        provider: "mock",
        model: "mock",
        filteredCount: 0,
        groundingWarnings: [],
      },
    };

    const scored = applyConfidenceScoring(report, {
      compressedContext,
      relevanceReport,
      reviewContext,
      knownPaths,
      unknownFiles: [],
    });

    expect(scored.risks[0]!.confidenceScore).toBeGreaterThan(0);
  });
});
