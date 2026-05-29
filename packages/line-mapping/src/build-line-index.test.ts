import { describe, expect, it } from "vitest";

import { buildLineIndex, getFileIndex } from "./build-line-index.js";
import { createLineMappingInput } from "./test-fixtures.js";

describe("buildLineIndex", () => {
  it("indexes hunks and changed lines per file", () => {
    const input = createLineMappingInput();
    const index = buildLineIndex(input);
    const fileIndex = getFileIndex(index, "src/auth/jwt.ts");

    expect(fileIndex?.hunks).toHaveLength(2);
    expect(fileIndex?.hunks[1]?.changedNewLines).toEqual([85, 86, 87]);
  });

  it("exposes path aliases for renamed files", () => {
    const input = createLineMappingInput();
    const index = buildLineIndex(input);
    const aliased = getFileIndex(index, "src/auth/old-jwt.ts");

    expect(aliased?.file).toBe("src/auth/old-jwt.ts");
    expect(aliased?.hunks).toHaveLength(2);
  });
});
