import { describe, expect, it } from "vitest";

import { collectChangedNewLines, lineSideForRow } from "./line-translation.js";
import type { HunkContext } from "@pr-review/shared";

const SAMPLE_HUNK: HunkContext = {
  oldStart: 1,
  oldLines: 2,
  newStart: 1,
  newLines: 3,
  header: "@@",
  contextLines: [],
  changeLines: [
    {
      type: "delete",
      content: "-old",
      oldLineNumber: 1,
      newLineNumber: null,
    },
    {
      type: "add",
      content: "+new",
      oldLineNumber: null,
      newLineNumber: 2,
    },
  ],
};

describe("line-translation", () => {
  it("collects changed new-side line numbers", () => {
    expect(collectChangedNewLines(SAMPLE_HUNK)).toEqual([2]);
  });

  it("assigns LEFT side to deletions", () => {
    expect(lineSideForRow(SAMPLE_HUNK.changeLines[0]!)).toBe("LEFT");
    expect(lineSideForRow(SAMPLE_HUNK.changeLines[1]!)).toBe("RIGHT");
  });
});
