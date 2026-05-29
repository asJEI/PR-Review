import { describe, expect, it } from "vitest";

import {
  formatFileBudgetHints,
  formatRankedFiles,
} from "./relevance-formatter.js";
import { resolvePromptBuildOptions } from "../pipeline/defaults.js";
import { createPromptBuildFixture } from "../test-fixtures.js";

describe("relevance-formatter", () => {
  it("renders scores, reasons, and respects budget file cap", () => {
    const { relevanceReport } = createPromptBuildFixture();
    const fileScores = new Map(relevanceReport.files.map((file) => [file.file, file]));
    const options = resolvePromptBuildOptions();

    const ranked = formatRankedFiles(
      relevanceReport.rankedFileOrder,
      fileScores,
      options,
      relevanceReport.budget,
    );

    expect(ranked).toContain("score:");
    expect(ranked).toContain(relevanceReport.rankedFileOrder[0]!);
    expect(ranked).toMatch(/\[critical\]|\[high\]/);

    const budgetHints = formatFileBudgetHints(relevanceReport.budget);
    expect(budgetHints).toContain("tokens");
  });
});
