import type { ParsedFileDiff } from "@pr-review/diff-parser";
import type { SymbolChange } from "@pr-review/shared";

export interface SymbolExtractorInput {
  filename: string;
  language: string;
  parsedDiff: ParsedFileDiff;
  maxSymbols: number;
}

/** Pluggable symbol extraction (heuristic today, AST tomorrow). */
export interface SymbolExtractor {
  readonly id: string;
  extract(input: SymbolExtractorInput): SymbolChange[];
}
