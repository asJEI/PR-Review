import type { HunkContext, SymbolChange } from "@pr-review/shared";

import { collectChangedNewLines } from "./line-translation.js";

export interface SymbolOverlapScore {
  hunkIndex: number;
  score: number;
  onChangeLine: boolean;
  nearestChangeLine: number | null;
}

export function scoreSymbolHunkOverlap(
  hunk: HunkContext,
  hunkIndex: number,
  symbolName: string,
  symbolLine?: number,
  proximity = 3,
): SymbolOverlapScore {
  let score = 0;
  let onChangeLine = false;
  let nearestChangeLine: number | null = null;
  let minDistance = Number.POSITIVE_INFINITY;

  const changeText = hunk.changeLines.map((line) => line.content).join("\n");
  if (changeText.includes(symbolName)) {
    score += 1;
    onChangeLine = true;
  }

  const contextText = hunk.contextLines.map((line) => line.content).join("\n");
  if (!onChangeLine && contextText.includes(symbolName)) {
    score += 0.5;
  }

  const changedNums = collectChangedNewLines(hunk);
  if (symbolLine !== undefined) {
    for (const num of changedNums) {
      const distance = Math.abs(num - symbolLine);
      if (distance < minDistance) {
        minDistance = distance;
        nearestChangeLine = num;
      }
      if (distance <= proximity) {
        score += 0.8;
        if (distance === 0) {
          onChangeLine = true;
        }
      }
    }
  }

  for (const line of hunk.changeLines) {
    if (line.newLineNumber !== null && line.content.includes(symbolName)) {
      nearestChangeLine = line.newLineNumber;
      onChangeLine = true;
      score += 0.5;
    }
  }

  return { hunkIndex, score, onChangeLine, nearestChangeLine };
}

export function scoreSymbolAgainstHunks(
  hunks: HunkContext[],
  symbol: SymbolChange | string,
  proximity = 3,
): SymbolOverlapScore[] {
  const name = typeof symbol === "string" ? symbol : symbol.name;
  const line = typeof symbol === "string" ? undefined : symbol.line;

  return hunks
    .map((hunk, hunkIndex) => scoreSymbolHunkOverlap(hunk, hunkIndex, name, line, proximity))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);
}

export function pickBestHunk(scores: SymbolOverlapScore[]): SymbolOverlapScore | null {
  if (scores.length === 0) {
    return null;
  }
  return scores[0] ?? null;
}
