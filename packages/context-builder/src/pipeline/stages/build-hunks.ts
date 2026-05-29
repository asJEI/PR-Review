import type { ContextLine, HunkContext } from "@pr-review/shared";
import type { DiffLine } from "@pr-review/diff-parser";

import type { ParsedFileEntry } from "../types.js";

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

function trimContextLines(
  lines: ContextLine[],
  maxLines: number,
): ContextLine[] {
  if (lines.length <= maxLines) {
    return lines;
  }

  const half = Math.floor(maxLines / 2);
  const head = lines.slice(0, half);
  const tail = lines.slice(-(maxLines - half));

  return [...head, ...tail];
}

export function buildHunksForFile(
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

    return {
      oldStart: hunk.oldStart,
      oldLines: hunk.oldLines,
      newStart: hunk.newStart,
      newLines: hunk.newLines,
      header: hunk.header,
      contextLines: trimContextLines(
        contextLines,
        maxContextLinesPerHunk,
      ),
      changeLines,
    };
  });
}
