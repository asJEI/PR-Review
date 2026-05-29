import { parseUnifiedDiff } from "@pr-review/diff-parser";
import type { DiffSide } from "@pr-review/shared";

export interface PatchPositionTarget {
  side: DiffSide;
  line: number;
}

export function calculatePatchPosition(
  patch: string,
  target: PatchPositionTarget,
): number | null {
  const parsed = parseUnifiedDiff("", patch);
  let position = 0;

  for (const hunk of parsed.hunks) {
    position += 1;
    for (const line of hunk.lines) {
      position += 1;

      if (line.type === "no_newline") {
        continue;
      }

      const matchesSide =
        target.side === "LEFT"
          ? line.oldLineNumber === target.line
          : line.newLineNumber === target.line;

      if (matchesSide) {
        return position;
      }
    }
  }

  return null;
}

export function walkPatchPositions(
  patch: string,
): Array<{ position: number; side: DiffSide; line: number; type: string }> {
  const parsed = parseUnifiedDiff("", patch);
  const entries: Array<{ position: number; side: DiffSide; line: number; type: string }> = [];
  let position = 0;

  for (const hunk of parsed.hunks) {
    position += 1;
    for (const line of hunk.lines) {
      position += 1;
      if (line.type === "no_newline") {
        continue;
      }
      if (line.type === "delete" && line.oldLineNumber !== null) {
        entries.push({ position, side: "LEFT", line: line.oldLineNumber, type: line.type });
      } else if (line.newLineNumber !== null) {
        entries.push({ position, side: "RIGHT", line: line.newLineNumber, type: line.type });
      }
    }
  }

  return entries;
}
