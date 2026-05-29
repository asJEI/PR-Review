import { describe, expect, it } from "vitest";

import { validateSummaryGrounding } from "./context-grounding-validator.js";
import { createSummaryGeneratorFixture } from "../../test-fixtures.js";

describe("context-grounding-validator", () => {
  it("passes for known file references", () => {
    const { compressedContext, relevanceReport, reviewContext } =
      createSummaryGeneratorFixture();

    const summary = {
      title: "Auth update",
      summary: "Updates verifyToken in src/auth/jwt.ts",
      keyChanges: ["Modified verifyToken in src/auth/jwt.ts"],
      affectedSystems: ["src/auth"],
      architecturalImpact: "Auth flow update",
      generatedAt: new Date().toISOString(),
      meta: {
        provider: "mock",
        model: "mock",
        groundingWarnings: [],
      },
    };

    const result = validateSummaryGrounding(
      summary,
      compressedContext,
      relevanceReport,
      reviewContext,
    );

    expect(result.warnings.some((warning) => warning.includes("src/auth/jwt.ts"))).toBe(false);
  });

  it("warns on unknown file references", () => {
    const { compressedContext, relevanceReport, reviewContext } =
      createSummaryGeneratorFixture();

    const summary = {
      title: "Auth update",
      summary: "Changes src/unknown/file.ts",
      keyChanges: ["Touched src/unknown/file.ts"],
      affectedSystems: ["unknown-module"],
      architecturalImpact: "Various improvements",
      generatedAt: new Date().toISOString(),
      meta: {
        provider: "mock",
        model: "mock",
        groundingWarnings: [],
      },
    };

    const result = validateSummaryGrounding(
      summary,
      compressedContext,
      relevanceReport,
      reviewContext,
    );

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((warning) => warning.includes("src/unknown/file.ts"))).toBe(true);
  });
});
