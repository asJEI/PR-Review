import type { ContextLine } from "@pr-review/shared";
import { describe, expect, it } from "vitest";

import {
  isCommentsOnlyChange,
  isFormattingOnlyChange,
  isLowValueChange,
} from "../utils/diff-noise-detect.js";

function line(content: string, type: ContextLine["type"] = "add"): ContextLine {
  return {
    type,
    content,
    oldLineNumber: null,
    newLineNumber: 1,
  };
}

describe("diff-noise-detect", () => {
  it("detects comments-only changes", () => {
    expect(isCommentsOnlyChange([line("+// updated note")])).toBe(true);
    expect(isCommentsOnlyChange([line("+const x = 1")])).toBe(false);
  });

  it("detects formatting-only changes", () => {
    expect(isFormattingOnlyChange([line("+   ")])).toBe(true);
    expect(isFormattingOnlyChange([line("+return value")])).toBe(false);
  });

  it("combines low-value detection", () => {
    expect(isLowValueChange([line("+# comment")])).toBe(true);
  });
});
