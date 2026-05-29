import type { ContextLine, DiffSide, HunkContext } from "@pr-review/shared";

import type { HunkLineRow } from "../types.js";

export function allHunkRows(hunk: HunkContext, hunkIndex: number): HunkLineRow[] {
  const rows: HunkLineRow[] = [];
  for (const line of hunk.changeLines) {
    rows.push({ hunkIndex, line, isChange: true });
  }
  for (const line of hunk.contextLines) {
    rows.push({ hunkIndex, line, isChange: false });
  }
  return rows;
}

export function collectChangedNewLines(hunk: HunkContext): number[] {
  const lines: number[] = [];
  for (const row of hunk.changeLines) {
    if (row.type === "add" && row.newLineNumber !== null) {
      lines.push(row.newLineNumber);
    }
    if (row.type === "context" && row.newLineNumber !== null) {
      lines.push(row.newLineNumber);
    }
  }
  return [...new Set(lines)].sort((a, b) => a - b);
}

export function collectChangedOldLines(hunk: HunkContext): number[] {
  const lines: number[] = [];
  for (const row of hunk.changeLines) {
    if (row.type === "delete" && row.oldLineNumber !== null) {
      lines.push(row.oldLineNumber);
    }
    if (row.type === "context" && row.oldLineNumber !== null) {
      lines.push(row.oldLineNumber);
    }
  }
  return [...new Set(lines)].sort((a, b) => a - b);
}

export function lineSideForRow(line: ContextLine): DiffSide {
  if (line.type === "delete") {
    return "LEFT";
  }
  return "RIGHT";
}

export function lineNumberForSide(line: ContextLine, side: DiffSide): number | null {
  if (side === "LEFT") {
    return line.oldLineNumber;
  }
  return line.newLineNumber;
}

export function hunkLineRange(hunk: HunkContext, side: DiffSide): { start: number; end: number } | null {
  const nums =
    side === "LEFT" ? collectChangedOldLines(hunk) : collectChangedNewLines(hunk);
  if (nums.length === 0) {
    const start = side === "LEFT" ? hunk.oldStart : hunk.newStart;
    const count = side === "LEFT" ? hunk.oldLines : hunk.newLines;
    if (start <= 0 || count <= 0) {
      return null;
    }
    return { start, end: start + Math.max(count, 1) - 1 };
  }
  return { start: Math.min(...nums), end: Math.max(...nums) };
}
