import { describe, expect, it } from "vitest";

import { buildLineIndex } from "./build-line-index.js";
import { locateHunkByLine } from "./hunk-locator.js";
import { createLineMappingInput } from "./test-fixtures.js";

describe("hunk-locator", () => {
  it("locates exact change line on parsed row", () => {
    const index = buildLineIndex(createLineMappingInput());
    const located = locateHunkByLine(index, "src/auth/jwt.ts", 39);

    expect(located?.hunkIndex).toBe(0);
    expect(located?.onChangeLine).toBe(true);
  });

  it("returns null for line outside all hunks", () => {
    const index = buildLineIndex(createLineMappingInput());
    const located = locateHunkByLine(index, "src/auth/jwt.ts", 9999);

    expect(located).toBeNull();
  });

  it("disambiguates multi-hunk files by exact row match", () => {
    const index = buildLineIndex(createLineMappingInput());
    const located = locateHunkByLine(index, "src/auth/jwt.ts", 86);

    expect(located?.hunkIndex).toBe(1);
  });
});
