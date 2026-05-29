import type { DiffHunk, DiffLine, ParsedFileDiff } from "./types.js";

const HUNK_HEADER =
  /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;

/**
 * Parses a unified diff patch string into structured hunks and lines.
 * Pure function — no language or business logic.
 */
export function parseUnifiedDiff(
  filename: string,
  patch: string | null,
): ParsedFileDiff {
  if (patch === null || patch.trim().length === 0) {
    return { filename, hunks: [], isEmpty: true };
  }

  const lines = patch.split(/\r?\n/);
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (const rawLine of lines) {
    const hunkMatch = HUNK_HEADER.exec(rawLine);

    if (hunkMatch) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      const oldStart = Number.parseInt(hunkMatch[1] ?? "0", 10);
      const oldLines = Number.parseInt(hunkMatch[2] ?? "1", 10);
      const newStart = Number.parseInt(hunkMatch[3] ?? "0", 10);
      const newLines = Number.parseInt(hunkMatch[4] ?? "1", 10);

      oldLine = oldStart;
      newLine = newStart;

      currentHunk = {
        header: rawLine,
        oldStart,
        oldLines,
        newStart,
        newLines,
        lines: [],
      };
      continue;
    }

    if (!currentHunk) {
      continue;
    }

    if (rawLine.startsWith("\\")) {
      currentHunk.lines.push({
        type: "no_newline",
        content: rawLine,
        oldLineNumber: null,
        newLineNumber: null,
      });
      continue;
    }

    const prefix = rawLine[0] ?? " ";
    const content = rawLine.slice(1);

    if (prefix === "+") {
      currentHunk.lines.push({
        type: "add",
        content,
        oldLineNumber: null,
        newLineNumber: newLine,
      });
      newLine += 1;
    } else if (prefix === "-") {
      currentHunk.lines.push({
        type: "delete",
        content,
        oldLineNumber: oldLine,
        newLineNumber: null,
      });
      oldLine += 1;
    } else {
      currentHunk.lines.push({
        type: "context",
        content,
        oldLineNumber: oldLine,
        newLineNumber: newLine,
      });
      oldLine += 1;
      newLine += 1;
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return {
    filename,
    hunks,
    isEmpty: hunks.length === 0,
  };
}

/** Splits all changed lines from hunks for downstream extractors. */
export function getChangedLines(hunks: DiffHunk[]): DiffLine[] {
  return hunks.flatMap((hunk) =>
    hunk.lines.filter((line) => line.type === "add" || line.type === "delete"),
  );
}
