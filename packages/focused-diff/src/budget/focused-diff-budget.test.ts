import { describe, expect, it } from "vitest";

import {
  applyFocusedDiffBudget,
  contextLinesForCompressionLevel,
} from "./focused-diff-budget.js";
import type { CompressedSnippet } from "../compression/diff-compression.js";
import { createFocusedDiffFixture } from "../test-fixtures.js";

function snippet(relevance: number, tokens: number, file = "src/auth/jwt.ts"): CompressedSnippet {
  return {
    file,
    symbol: "verifyToken",
    relevance,
    focusedDiff: "// snippet",
    surroundingContext: "ctx",
    riskSignals: [],
    hunkIndex: 0,
    estimatedTokens: tokens,
  };
}

describe("focused-diff-budget", () => {
  it("maps compression levels to context line caps", () => {
    expect(contextLinesForCompressionLevel("preserve")).toBe(8);
    expect(contextLinesForCompressionLevel("normal")).toBe(6);
    expect(contextLinesForCompressionLevel("aggressive")).toBe(3);
  });

  it("respects global token budget", () => {
    const { relevanceReport } = createFocusedDiffFixture();
    const { retained, filtered } = applyFocusedDiffBudget(
      [snippet(0.9, 500), snippet(0.8, 500)],
      relevanceReport,
      { totalTokenBudget: 600, maxItems: 40, minRelevanceScore: 0.35 },
    );

    expect(retained.length).toBe(1);
    expect(filtered).toBe(1);
  });

  it("respects per-file token cap", () => {
    const { relevanceReport } = createFocusedDiffFixture();
    const file = relevanceReport.budget.fileAllocations[0]?.file ?? "src/auth/jwt.ts";
    const cap = relevanceReport.budget.fileAllocations.find((entry) => entry.file === file)?.tokens ?? 100;

    const { retained } = applyFocusedDiffBudget(
      [snippet(0.9, cap - 10, file), snippet(0.85, cap, file)],
      relevanceReport,
      { totalTokenBudget: 10000, maxItems: 40, minRelevanceScore: 0.35 },
    );

    expect(retained.length).toBe(1);
  });

  it("drops items below min relevance", () => {
    const { relevanceReport } = createFocusedDiffFixture();
    const { retained } = applyFocusedDiffBudget(
      [snippet(0.1, 10)],
      relevanceReport,
      { totalTokenBudget: 10000, maxItems: 40, minRelevanceScore: 0.35 },
    );

    expect(retained).toHaveLength(0);
  });
});
