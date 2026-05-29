import type { FileContext, ReviewContext } from "@pr-review/shared";

export function findFileContext(
  reviewContext: ReviewContext | undefined,
  file: string,
): FileContext | undefined {
  return reviewContext?.files.find((entry) => entry.filename === file);
}

export function resolveCommentLine(
  file: string,
  lineHint: string | null,
  symbol: string | null,
  reviewContext: ReviewContext | undefined,
): number | null {
  const fileContext = findFileContext(reviewContext, file);
  if (!fileContext || fileContext.hunks.length === 0) {
    return null;
  }

  const numericHint = lineHint ? Number.parseInt(lineHint, 10) : Number.NaN;
  if (!Number.isNaN(numericHint)) {
    for (const hunk of fileContext.hunks) {
      const hunkEnd = hunk.newStart + Math.max(hunk.newLines, 1) - 1;
      if (numericHint >= hunk.newStart && numericHint <= hunkEnd) {
        return numericHint;
      }
    }
    return null;
  }

  if (symbol) {
    for (const hunk of fileContext.hunks) {
      for (const line of hunk.changeLines) {
        if (line.newLineNumber !== null && line.content.includes(symbol)) {
          return line.newLineNumber;
        }
      }
      for (const line of hunk.contextLines) {
        if (line.newLineNumber !== null && line.content.includes(symbol)) {
          return line.newLineNumber;
        }
      }
    }
  }

  return null;
}
