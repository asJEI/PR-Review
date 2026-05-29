import { describe, expect, it } from "vitest";

import { runExtractionPipeline } from "./run-extraction-pipeline.js";
import { createFocusedDiffFixture } from "../test-fixtures.js";

describe("run-extraction-pipeline", () => {
  it("produces auth-focused items end-to-end", () => {
    const { reviewContext, compressedContext, relevanceReport } = createFocusedDiffFixture();
    const report = runExtractionPipeline({
      reviewContext,
      compressedContext,
      relevanceReport,
    });

    expect(report.items.length).toBeGreaterThan(0);
    expect(report.items[0]!.file).toBe("src/auth/jwt.ts");
    expect(report.items[0]!.focusedDiff).not.toContain("@@");
    expect(report.stats.filesConsidered).toBeGreaterThan(0);
    expect(report.stats.itemsRetained).toBe(report.items.length);
  });

  it("filters vendor and formatting-only files", () => {
    const { reviewContext, compressedContext, relevanceReport } = createFocusedDiffFixture();
    const report = runExtractionPipeline({
      reviewContext,
      compressedContext,
      relevanceReport,
    });

    expect(report.items.every((item) => !item.file.includes("vendor"))).toBe(true);
    expect(report.items.every((item) => item.file !== "src/utils/format.ts")).toBe(true);
  });
});
