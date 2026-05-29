import { describe, expect, it } from "vitest";

import { extractFocusedDiffs } from "./extract-focused-diffs.js";
import { createFocusedDiffFixture } from "./test-fixtures.js";

describe("extractFocusedDiffs", () => {
  it("exposes public API with generatedAt timestamp", () => {
    const { reviewContext, compressedContext, relevanceReport } = createFocusedDiffFixture();
    const report = extractFocusedDiffs({
      reviewContext,
      compressedContext,
      relevanceReport,
    });

    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(report.items[0]?.symbol).toBe("verifyToken");
  });

  it("honors maxItems option", () => {
    const { reviewContext, compressedContext, relevanceReport } = createFocusedDiffFixture();
    const report = extractFocusedDiffs(
      { reviewContext, compressedContext, relevanceReport },
      { maxItems: 1 },
    );

    expect(report.items.length).toBeLessThanOrEqual(1);
  });
});
