import { describe, expect, it } from "vitest";

import { rankAllHunks } from "./hunk-ranking-engine.js";
import { createFocusedDiffFixture } from "../test-fixtures.js";

describe("hunk-ranking-engine", () => {
  it("ranks auth hunks above vendor paths", () => {
    const { reviewContext, compressedContext, relevanceReport } = createFocusedDiffFixture();
    const ranked = rankAllHunks(
      reviewContext.files,
      relevanceReport,
      compressedContext,
      reviewContext.semanticSummary.riskHints,
    );

    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0]!.file).toBe("src/auth/jwt.ts");
    expect(ranked[0]!.riskSignals.some((signal) => signal === "auth")).toBe(true);
  });

  it("excludes ignored vendor file from ranked output", () => {
    const { reviewContext, compressedContext, relevanceReport } = createFocusedDiffFixture();
    const ranked = rankAllHunks(
      reviewContext.files,
      relevanceReport,
      compressedContext,
      [],
    );

    expect(ranked.every((entry) => entry.file !== "vendor/react.js")).toBe(true);
  });

  it("orders by descending score", () => {
    const { reviewContext, compressedContext, relevanceReport } = createFocusedDiffFixture();
    const ranked = rankAllHunks(
      reviewContext.files.filter((file) => file.filename === "src/auth/jwt.ts"),
      relevanceReport,
      compressedContext,
      [],
    );

    for (let index = 1; index < ranked.length; index += 1) {
      expect(ranked[index - 1]!.score).toBeGreaterThanOrEqual(ranked[index]!.score);
    }
  });
});
