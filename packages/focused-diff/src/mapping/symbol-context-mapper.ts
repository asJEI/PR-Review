import type { ContextLine, FileContext, SymbolChange } from "@pr-review/shared";

import type { RankedHunk } from "../ranking/hunk-ranking-engine.js";
import {
  collectChangeLineNumbers,
  lineRangeFromChangeLines,
  trimContextLinesByProximity,
} from "../utils/token-estimate.js";

export interface MappedSnippet {
  file: string;
  symbol: string | null;
  hunkIndex: number;
  relevance: number;
  riskSignals: string[];
  changeLines: ContextLine[];
  contextLines: ContextLine[];
  lineRange?: { start: number; end: number };
}

function hunkOverlapsSymbol(hunk: RankedHunk["hunk"], symbol: SymbolChange): boolean {
  const changeText = hunk.changeLines.map((line) => line.content).join("\n");
  if (changeText.includes(symbol.name)) {
    return true;
  }
  if (symbol.line === undefined) {
    return false;
  }
  const nums = collectChangeLineNumbers(hunk.changeLines);
  return nums.some((num) => Math.abs(num - symbol.line!) <= 3);
}

function buildMappedSnippet(
  ranked: RankedHunk,
  symbol: string | null,
  maxContextLines: number,
): MappedSnippet {
  const changeNums = collectChangeLineNumbers(ranked.hunk.changeLines);
  const contextLines = trimContextLinesByProximity(
    ranked.hunk.contextLines,
    changeNums,
    maxContextLines,
  );

  return {
    file: ranked.file,
    symbol,
    hunkIndex: ranked.hunkIndex,
    relevance: ranked.score,
    riskSignals: ranked.riskSignals,
    changeLines: ranked.hunk.changeLines,
    contextLines,
    lineRange: lineRangeFromChangeLines(ranked.hunk.changeLines),
  };
}

export function mapSymbolsToHunks(
  file: FileContext,
  rankedHunks: RankedHunk[],
  maxContextLines: number,
): MappedSnippet[] {
  const fileRanked = rankedHunks.filter((entry) => entry.file === file.filename);
  if (fileRanked.length === 0) {
    return [];
  }

  const snippets: MappedSnippet[] = [];
  const coveredHunks = new Set<number>();

  for (const symbol of file.symbols) {
    const match = fileRanked.find((ranked) => hunkOverlapsSymbol(ranked.hunk, symbol));
    if (!match) {
      continue;
    }
    coveredHunks.add(match.hunkIndex);
    snippets.push(buildMappedSnippet(match, symbol.name, maxContextLines));
  }

  for (const ranked of fileRanked) {
    if (coveredHunks.has(ranked.hunkIndex)) {
      continue;
    }
    snippets.push(buildMappedSnippet(ranked, null, maxContextLines));
  }

  return snippets.sort((left, right) => right.relevance - left.relevance);
}

export function mapAllSymbols(
  files: FileContext[],
  rankedHunks: RankedHunk[],
  maxContextLines: number,
): MappedSnippet[] {
  const all: MappedSnippet[] = [];
  for (const file of files) {
    all.push(...mapSymbolsToHunks(file, rankedHunks, maxContextLines));
  }
  return all.sort((left, right) => right.relevance - left.relevance);
}
