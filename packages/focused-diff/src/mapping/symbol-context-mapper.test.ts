import { describe, expect, it } from "vitest";

import { mapSymbolsToHunks } from "./symbol-context-mapper.js";
import { rankAllHunks } from "../ranking/hunk-ranking-engine.js";
import { createFocusedDiffFixture } from "../test-fixtures.js";

describe("symbol-context-mapper", () => {
  it("maps verifyToken symbol to auth hunk", () => {
    const { reviewContext, compressedContext, relevanceReport } = createFocusedDiffFixture();
    const authFile = reviewContext.files.find((file) => file.filename === "src/auth/jwt.ts")!;
    const ranked = rankAllHunks(
      [authFile],
      relevanceReport,
      compressedContext,
      [],
    );

    const mapped = mapSymbolsToHunks(authFile, ranked, 6);
    expect(mapped.some((entry) => entry.symbol === "verifyToken")).toBe(true);
    expect(mapped[0]!.changeLines.length).toBeGreaterThan(0);
  });

  it("falls back to file-level snippet when no symbol match", () => {
    const { reviewContext, compressedContext, relevanceReport } = createFocusedDiffFixture();
    const authFile = {
      ...reviewContext.files.find((file) => file.filename === "src/auth/jwt.ts")!,
      symbols: [],
    };
    const ranked = rankAllHunks([authFile], relevanceReport, compressedContext, []);
    const mapped = mapSymbolsToHunks(authFile, ranked, 6);

    expect(mapped).toHaveLength(1);
    expect(mapped[0]!.symbol).toBeNull();
  });
});
