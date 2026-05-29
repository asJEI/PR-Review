import type { FileContext } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import { classifyDepriority, isNoisePath } from "./depriority-classifier.js";

describe("depriority-classifier", () => {
  it("ignores vendor and snapshot paths", () => {
    expect(isNoisePath("vendor/react.js")).toBe(true);
    expect(isNoisePath("__snapshots__/app.snap")).toBe(true);
  });

  it("marks docs-only files as ignored", () => {
    const file: FileContext = {
      filename: "README.md",
      status: "modified",
      language: "unknown",
      additions: 1,
      deletions: 0,
      symbols: [],
      imports: [],
      hunks: [
        {
          oldStart: 1,
          oldLines: 1,
          newStart: 1,
          newLines: 1,
          header: "@@",
          contextLines: [],
          changeLines: [{ type: "add", content: "+# docs", oldLineNumber: null, newLineNumber: 1 }],
        },
      ],
      truncated: false,
    };

    expect(classifyDepriority(file, []).ignored).toBe(true);
  });
});
