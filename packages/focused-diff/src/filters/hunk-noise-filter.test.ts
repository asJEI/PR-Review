import type { ContextLine, HunkContext } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import {
  filterEligibleFiles,
  isCommentsOnlyChange,
  isFormattingOnlyChange,
  isLowValueHunk,
  isNoisePath,
  shouldSkipFile,
} from "./hunk-noise-filter.js";

function hunk(changeLines: ContextLine[]): HunkContext {
  return {
    oldStart: 1,
    oldLines: 1,
    newStart: 1,
    newLines: 1,
    header: "@@",
    contextLines: [],
    changeLines,
  };
}

describe("hunk-noise-filter", () => {
  it("skips vendor paths", () => {
    expect(isNoisePath("vendor/react.js")).toBe(true);
    expect(isNoisePath("src/auth/jwt.ts")).toBe(false);
  });

  it("detects formatting-only hunks", () => {
    const whitespaceOnly: ContextLine[] = [
      { type: "delete", content: "-   ", oldLineNumber: 1, newLineNumber: null },
      { type: "add", content: "+    ", oldLineNumber: null, newLineNumber: 1 },
    ];
    expect(isFormattingOnlyChange(whitespaceOnly)).toBe(true);
    expect(isCommentsOnlyChange([{ type: "add", content: "+// note", oldLineNumber: null, newLineNumber: 1 }])).toBe(true);
  });

  it("filters vendor and formatting-only files", () => {
    const files = filterEligibleFiles([
      {
        filename: "vendor/react.js",
        status: "modified",
        language: "javascript",
        additions: 1,
        deletions: 0,
        symbols: [],
        imports: [],
        hunks: [
          hunk([{ type: "add", content: "+x", oldLineNumber: null, newLineNumber: 1 }]),
        ],
        truncated: false,
      },
      {
        filename: "src/utils/format.ts",
        status: "modified",
        language: "typescript",
        additions: 0,
        deletions: 0,
        symbols: [],
        imports: [],
        hunks: [
          hunk([
            { type: "delete", content: "-  ", oldLineNumber: 1, newLineNumber: null },
            { type: "add", content: "+   ", oldLineNumber: null, newLineNumber: 1 },
          ]),
        ],
        truncated: false,
      },
    ]);

    expect(files).toHaveLength(0);
    expect(isLowValueHunk(hunk([]))).toBe(true);
    expect(
      shouldSkipFile({
        filename: "src/a.ts",
        status: "modified",
        language: "typescript",
        additions: 0,
        deletions: 0,
        symbols: [],
        imports: [],
        hunks: [hunk([])],
        truncated: false,
      }),
    ).toBe(true);
  });
});
