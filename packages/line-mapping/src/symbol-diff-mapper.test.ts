import { describe, expect, it } from "vitest";

import { mapAllSymbolLocations, mapSymbolToDiff } from "./symbol-diff-mapper.js";
import { createLineMappingInput } from "./test-fixtures.js";

describe("symbol-diff-mapper", () => {
  it("maps refreshToken to second hunk with changed lines", () => {
    const mapping = mapSymbolToDiff(
      createLineMappingInput(),
      "src/auth/jwt.ts",
      "refreshToken",
    );

    expect(mapping).not.toBeNull();
    expect(mapping!.hunkIndex).toBe(1);
    expect(mapping!.changedLines).toEqual([85, 86, 87]);
    expect(mapping!.confidence).toBe("exact");
    expect(mapping!.githubPosition).toBeDefined();
  });

  it("returns multiple mappings for split symbol occurrences", () => {
    const mappings = mapAllSymbolLocations(
      createLineMappingInput(),
      "src/auth/jwt.ts",
      "verifyToken",
    );

    expect(mappings.length).toBeGreaterThan(0);
    expect(mappings[0]!.symbol).toBe("verifyToken");
  });
});
