import type { ContextLine } from "@pr-review/shared";

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

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

  scored.sort((left, right) => left.distance - right.distance);
  return scored.slice(0, maxLines).map((entry) => entry.line);
}

export function collectChangeLineNumbers(lines: ContextLine[]): number[] {
  const numbers: number[] = [];
  for (const line of lines) {
    if (line.type === "add" && line.newLineNumber !== null) {
      numbers.push(line.newLineNumber);
    }
    if (line.type === "delete" && line.oldLineNumber !== null) {
      numbers.push(line.oldLineNumber);
    }
  }
  return numbers;
}

export function lineRangeFromChangeLines(changeLines: ContextLine[]): { start: number; end: number } | undefined {
  const nums = collectChangeLineNumbers(changeLines).filter((n) => n > 0);
  if (nums.length === 0) {
    return undefined;
  }
  return { start: Math.min(...nums), end: Math.max(...nums) };
}
