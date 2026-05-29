import type { ContextLine, DiffSide } from "@pr-review/shared";

import type { HunkLineRow } from "../types.js";
import { lineNumberForSide, lineSideForRow } from "../utils/line-translation.js";

export function findDeletedLineRow(
  rows: HunkLineRow[],
  oldLine: number,
): HunkLineRow | null {
  for (const row of rows) {
    if (row.line.type === "delete" && row.line.oldLineNumber === oldLine) {
      return row;
    }
  }
  return null;
}

export function sideForLineHint(
  row: HunkLineRow | null,
  numericLine: number,
): DiffSide {
  if (row) {
    return lineSideForRow(row.line);
  }
  return "RIGHT";
}

export function primaryLineForSide(line: ContextLine, side: DiffSide): number | null {
  return lineNumberForSide(line, side);
}
