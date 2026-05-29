import { describe, expect, it } from "vitest";

import {
  normalizeRiskCategory,
  parseRawRiskResponse,
  rawItemToReviewItem,
} from "./risk-response-parser.js";
import { RiskParseError } from "../../utils/errors.js";
import { createRiskReviewFixture } from "../../test-fixtures.js";

describe("risk-response-parser", () => {
  it("parses and normalizes LLM risk JSON", () => {
    const { compressedContext, relevanceReport } = createRiskReviewFixture();
    const known = new Set(["src/auth/jwt.ts"]);

    const raw = parseRawRiskResponse(
      JSON.stringify({
        risks: [
          {
            category: "auth",
            location: "src/auth/jwt.ts::verifyToken",
            severity: "high",
            rationale: "JWT verification modified",
            mitigation: "Add token expiry tests",
            confidence: "high",
          },
        ],
        overallRiskLevel: "high",
      }),
    );

    expect(raw.risks).toHaveLength(1);
    const item = rawItemToReviewItem(raw.risks[0]!, known);
    expect(item.category).toBe("authentication");
    expect(item.affectedFiles).toContain("src/auth/jwt.ts");
    expect(normalizeRiskCategory("database write")).toBe("database");
  });

  it("rejects invalid risk response", () => {
    expect(() => parseRawRiskResponse('{"risks":[]}')).toThrow(RiskParseError);
  });
});
