import type { FileRelevanceScore } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import { allocateContextBudget } from "./context-budget-allocator.js";

describe("context-budget-allocator", () => {
  it("allocates more tokens to higher relevance files", () => {
    const files: FileRelevanceScore[] = [
      {
        file: "src/auth/jwt.ts",
        relevanceScore: 0.9,
        priority: "critical",
        reasons: [],
        suggestedContextTokens: 0,
        compressionLevel: "preserve",
      },
      {
        file: "src/utils/format.ts",
        relevanceScore: 0.3,
        priority: "low",
        reasons: [],
        suggestedContextTokens: 0,
        compressionLevel: "aggressive",
      },
    ];

    const budget = allocateContextBudget(files, 6000, 50, 5000);
    const auth = budget.fileAllocations.find((entry) => entry.file === "src/auth/jwt.ts");
    const utils = budget.fileAllocations.find((entry) => entry.file === "src/utils/format.ts");

    expect((auth?.tokens ?? 0) >= (utils?.tokens ?? 0)).toBe(true);
    expect(auth?.tokens).toBeGreaterThan(utils?.tokens ?? 0);
    expect(budget.totalBudget).toBe(6000);
  });
});
