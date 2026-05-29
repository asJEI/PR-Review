import { describe, expect, it } from "vitest";

import {
  normalizeToPrSummary,
  parseRawSummaryResponse,
} from "./summary-response-parser.js";
import { SummaryParseError, SummaryValidationError } from "../../utils/errors.js";
import { createSummaryGeneratorFixture } from "../../test-fixtures.js";

describe("summary-response-parser", () => {
  it("parses and normalizes LLM JSON to PrSummary", () => {
    const { compressedContext, relevanceReport } = createSummaryGeneratorFixture();
    const raw = parseRawSummaryResponse(
      JSON.stringify({
        intent: "Refreshes JWT auth flow",
        coreChanges: ["Updated verifyToken"],
        affectedModules: ["src/middleware", "src/auth"],
        infrastructureImpact: "Auth pipeline change",
      }),
    );

    const summary = normalizeToPrSummary(raw, compressedContext, relevanceReport, {
      provider: "mock",
      model: "mock-model",
    });

    expect(summary.title).toBe("Auth update");
    expect(summary.summary).toBe("Refreshes JWT auth flow");
    expect(summary.keyChanges).toEqual(["Updated verifyToken"]);
    expect(summary.affectedSystems[0]).toBe("src/auth");
    expect(summary.architecturalImpact).toContain("Auth pipeline change");
  });

  it("rejects missing required fields", () => {
    expect(() => parseRawSummaryResponse('{"coreChanges":[]}')).toThrow(SummaryParseError);
  });

  it("rejects empty key changes", () => {
    const { compressedContext, relevanceReport } = createSummaryGeneratorFixture();
    expect(() =>
      normalizeToPrSummary(
        {
          intent: "No changes",
          coreChanges: [],
          affectedModules: [],
          infrastructureImpact: null,
        },
        compressedContext,
        relevanceReport,
        { provider: "mock", model: "mock-model" },
      ),
    ).toThrow(SummaryValidationError);
  });
});
