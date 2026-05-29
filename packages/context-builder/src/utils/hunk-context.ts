import type { ContextLine, HunkContext } from "@pr-review/shared";
import type { DiffLine } from "@pr-review/diff-parser";

import type { ParsedFileEntry } from "../pipeline/types.js";

function toContextLine(line: DiffLine): ContextLine {
  const type =
    line.type === "add"
      ? "add"
      : line.type === "delete"
        ? "delete"
        : "context";

  return {
    type,
    content: line.content,
    oldLineNumber: line.oldLineNumber,
    newLineNumber: line.newLineNumber,
  };
}

function changeLineNumbers(hunk: { lines: DiffLine[] }): number[] {
  const numbers: number[] = [];

  for (const line of hunk.lines) {
    if (line.type === "add" && line.newLineNumber !== null) {
      numbers.push(line.newLineNumber);
    }

    if (line.type === "delete" && line.oldLineNumber !== null) {
      numbers.push(line.oldLineNumber);
    }
  }

  return numbers;
}

/** Keeps context lines closest to any changed line in the hunk. */
export function trimContextLinesByProximity(
  contextLines: ContextLine[],
  changeLineNums: number[],
  maxLines: number,
): ContextLine[] {
  if (contextLines.length <= maxLines || changeLineNums.length === 0) {
    return contextLines.slice(0, maxLines);
  }

  const anchor = changeLineNums[0] ?? 0;

  const scored = contextLines.map((line) => {
    const lineNum = line.newLineNumber ?? line.oldLineNumber ?? anchor;
    return { line, distance: Math.abs(lineNum - anchor) };
  });

  scored.sort((a, b) => a.distance - b.distance);

  return scored.slice(0, maxLines).map((entry) => entry.line);
}

export function buildHunksWithProximityContext(
  entry: ParsedFileEntry,
  maxContextLinesPerHunk: number,
): HunkContext[] {
  return entry.parsedDiff.hunks.map((hunk) => {
    const contextLines = hunk.lines
      .filter((l) => l.type === "context")
      .map(toContextLine);

    const changeLines = hunk.lines
      .filter((l) => l.type === "add" || l.type === "delete")
      .map(toContextLine);

    const changeNums = changeLineNumbers(hunk);

    return {
      oldStart: hunk.oldStart,
      oldLines: hunk.oldLines,
      newStart: hunk.newStart,
      newLines: hunk.newLines,
      header: hunk.header,
      contextLines: trimContextLinesByProximity(
        contextLines,
        changeNums,
        maxContextLinesPerHunk,
      ),
      changeLines,
    };
  });
}
