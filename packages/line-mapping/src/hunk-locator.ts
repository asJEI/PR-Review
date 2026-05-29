import type { FileLineIndex, HunkLineRow, LineIndex } from "./types.js";
import type { DiffSide } from "@pr-review/shared";
import { getFileIndex } from "./build-line-index.js";
import { resolveFilePath } from "./edge-cases/path-resolver.js";
import {
  lineNumberForSide,
} from "./utils/line-translation.js";
import { scoreSymbolAgainstHunks } from "./utils/symbol-overlap.js";

export interface LocatedLine {
  hunkIndex: number;
  row: HunkLineRow;
  side: DiffSide;
  lineNumber: number;
  onChangeLine: boolean;
}

export interface RankedHunkMatch {
  hunkIndex: number;
  score: number;
  onChangeLine: boolean;
}

export function findRowByLine(
  fileIndex: FileLineIndex,
  line: number,
  side?: DiffSide,
): LocatedLine | null {
  const sides: DiffSide[] = side ? [side] : ["RIGHT", "LEFT"];

  for (const trySide of sides) {
    for (const indexed of fileIndex.hunks) {
      for (const row of indexed.rows) {
        const num = lineNumberForSide(row.line, trySide);
        if (num === line) {
          return {
            hunkIndex: indexed.hunkIndex,
            row,
            side: trySide,
            lineNumber: line,
            onChangeLine: row.isChange,
          };
        }
      }
    }
  }

  return null;
}

export function findRowInHunkRange(
  fileIndex: FileLineIndex,
  line: number,
): LocatedLine | null {
  for (const indexed of fileIndex.hunks) {
    const newEnd = indexed.hunk.newStart + Math.max(indexed.hunk.newLines, 1) - 1;
    if (line >= indexed.hunk.newStart && line <= newEnd) {
      const exact = findRowByLine(
        { ...fileIndex, hunks: [indexed] },
        line,
        "RIGHT",
      );
      if (exact) {
        return exact;
      }
      return {
        hunkIndex: indexed.hunkIndex,
        row: indexed.rows[0] ?? {
          hunkIndex: indexed.hunkIndex,
          line: {
            type: "context",
            content: "",
            oldLineNumber: null,
            newLineNumber: line,
          },
          isChange: false,
        },
        side: "RIGHT",
        lineNumber: line,
        onChangeLine: false,
      };
    }
  }
  return null;
}

export function locateHunkByLine(
  index: LineIndex,
  file: string,
  line: number,
  side?: DiffSide,
): LocatedLine | null {
  const resolvedFile = resolveFilePath(file, index.pathAliases);
  const fileIndex = getFileIndex(index, resolvedFile);
  if (!fileIndex) {
    return null;
  }

  const exact = findRowByLine(fileIndex, line, side);
  if (exact) {
    return exact;
  }

  return findRowInHunkRange(fileIndex, line);
}

export function locateHunksBySymbol(
  fileIndex: FileLineIndex,
  symbolName: string,
  symbolLine?: number,
  proximity = 3,
): RankedHunkMatch[] {
  const scores = scoreSymbolAgainstHunks(
    fileIndex.hunks.map((entry) => entry.hunk),
    { name: symbolName, kind: "unknown", changeType: "modified", line: symbolLine },
    proximity,
  );

  return scores.map((entry) => ({
    hunkIndex: entry.hunkIndex,
    score: entry.score,
    onChangeLine: entry.onChangeLine,
  }));
}

export function pickBestHunkMatch(matches: RankedHunkMatch[]): RankedHunkMatch | null {
  if (matches.length === 0) {
    return null;
  }
  return matches.sort((left, right) => right.score - left.score)[0] ?? null;
}
