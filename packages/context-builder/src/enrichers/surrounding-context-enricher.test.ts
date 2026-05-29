import type { ContextLine } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import { trimContextLinesByProximity } from "../utils/hunk-context.js";

describe("trimContextLinesByProximity", () => {
  it("keeps context lines closest to changed lines", () => {
    const contextLines: ContextLine[] = [
      { type: "context", content: "far", oldLineNumber: 1, newLineNumber: 1 },
      { type: "context", content: "near", oldLineNumber: 9, newLineNumber: 9 },
      { type: "context", content: "mid", oldLineNumber: 5, newLineNumber: 5 },
    ];

    const trimmed = trimContextLinesByProximity(contextLines, [10], 2);

    expect(trimmed.map((line) => line.content)).toEqual(["near", "mid"]);
  });
});
