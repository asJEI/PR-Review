import { describe, expect, it } from "vitest";

import { validateRawSummaryResponse } from "./summary-schema.js";
import { validateRawRiskResponse } from "./risk-schema.js";
import { validateRawCommentResponse } from "./comment-schema.js";

describe("summary-schema", () => {
  it("accepts valid summary payload", () => {
    const result = validateRawSummaryResponse({
      intent: "Update auth",
      coreChanges: ["Modified jwt.ts"],
      affectedModules: ["auth"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing intent", () => {
    const result = validateRawSummaryResponse({ coreChanges: [] });
    expect(result.success).toBe(false);
  });
});

describe("risk-schema", () => {
  it("accepts valid risk payload", () => {
    const result = validateRawRiskResponse({
      risks: [
        {
          category: "auth",
          location: "src/auth.ts",
          severity: "high",
          rationale: "Auth changed",
          mitigation: "Review tests",
          confidence: "high",
        },
      ],
      overallRiskLevel: "high",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty risks", () => {
    const result = validateRawRiskResponse({ risks: [] });
    expect(result.success).toBe(false);
  });
});

describe("comment-schema", () => {
  it("accepts valid comment payload", () => {
    const result = validateRawCommentResponse({
      comments: [
        {
          file: "src/auth.ts",
          symbol: "verify",
          lineHint: "10",
          severity: "major",
          body: "Check auth flow",
          suggestions: ["Add tests"],
          confidence: "high",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing comments array", () => {
    const result = validateRawCommentResponse({});
    expect(result.success).toBe(false);
  });
});
