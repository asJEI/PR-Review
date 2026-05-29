import type { CompressionLevel } from "@pr-review/shared";

import type { MappedSnippet } from "../mapping/symbol-context-mapper.js";
import {
  formatAggressiveSummary,
  formatFocusedDiff,
  formatSurroundingContextLines,
} from "./snippet-formatter.js";
import { estimateTokens } from "../utils/token-estimate.js";

export interface CompressedSnippet {
  file: string;
  symbol: string | null;
  relevance: number;
  focusedDiff: string;
  surroundingContext: string;
  riskSignals: string[];
  hunkIndex: number;
  lineRange?: { start: number; end: number };
  estimatedTokens: number;
}

export function compressSnippet(
  snippet: MappedSnippet,
  compressionLevel: CompressionLevel,
): CompressedSnippet {
  const focusedDiff = formatFocusedDiff(snippet.file, snippet.symbol, snippet.changeLines);

  const surroundingContext =
    compressionLevel === "aggressive"
      ? formatAggressiveSummary(snippet.file, snippet.symbol, snippet.changeLines)
      : formatSurroundingContextLines(snippet.contextLines);

  const estimatedTokens = estimateTokens(`${focusedDiff}\n${surroundingContext}`);

  return {
    file: snippet.file,
    symbol: snippet.symbol,
    relevance: snippet.relevance,
    focusedDiff,
    surroundingContext,
    riskSignals: snippet.riskSignals,
    hunkIndex: snippet.hunkIndex,
    lineRange: snippet.lineRange,
    estimatedTokens,
  };
}

export function compressAllSnippets(
  snippets: MappedSnippet[],
  compressionLevelByFile: Map<string, CompressionLevel>,
  defaultLevel: CompressionLevel = "normal",
): CompressedSnippet[] {
  return snippets.map((snippet) =>
    compressSnippet(
      snippet,
      compressionLevelByFile.get(snippet.file) ?? defaultLevel,
    ),
  );
}
