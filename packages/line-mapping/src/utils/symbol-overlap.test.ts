import { describe, expect, it } from "vitest";

import { scoreSymbolHunkOverlap } from "./symbol-overlap.js";
import type { HunkContext } from "@pr-review/shared";

const HUNK: HunkContext = {
  oldStart: 90,
  oldLines: 5,
  newStart: 90,
  newLines: 8,
  header: "@@",
  contextLines: [],
  changeLines: [
    {
      type: "add",
      content: "+  return refreshToken(token);",
      oldLineNumber: null,
      newLineNumber: 93,
    },
  ],
};

describe("symbol-overlap", () => {
  it("scores symbol name matches in change lines", () => {
    const score = scoreSymbolHunkOverlap(HUNK, 0, "refreshToken", 93);
    expect(score.score).toBeGreaterThan(0);
    expect(score.onChangeLine).toBe(true);
  });
});
