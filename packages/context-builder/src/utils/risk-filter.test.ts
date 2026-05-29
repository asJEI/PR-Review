import { EMPTY_RISK_ANALYSIS } from "@pr-review/diff-parser";
import { describe, expect, it } from "vitest";

import { filterRiskForFile } from "./risk-filter.js";

describe("filterRiskForFile", () => {
  it("drops code-only risk categories for json files", () => {
    const risk = {
      findings: [
        {
          id: "databaseOperationModified" as const,
          message: "Database operation modified",
          confidence: 0.8,
          evidence: [],
        },
        {
          id: "authLogicChanged" as const,
          message: "Auth logic changed",
          confidence: 0.7,
          evidence: [],
        },
      ],
      riskHints: ["Database operation modified", "Auth logic changed"],
    };

    const filtered = filterRiskForFile(risk, "config/roles.json", "unknown");

    expect(filtered.riskHints).toEqual(["Auth logic changed"]);
  });

  it("keeps all findings for typescript files", () => {
    const filtered = filterRiskForFile(
      {
        ...EMPTY_RISK_ANALYSIS,
        findings: [
          {
            id: "errorHandlingRemoved",
            message: "Error handling removed",
            confidence: 0.6,
            evidence: [],
          },
        ],
        riskHints: ["Error handling removed"],
      },
      "src/service.ts",
      "typescript",
    );

    expect(filtered.riskHints).toContain("Error handling removed");
  });
});
