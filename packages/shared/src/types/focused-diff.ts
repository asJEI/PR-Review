import type { CompressedReviewContext } from "./compression.js";
import type { ReviewContext } from "./context.js";
import type { RelevanceReport } from "./relevance.js";

export interface FocusedDiffLineRange {
  start: number;
  end: number;
}

export interface FocusedDiffItem {
  file: string;
  symbol: string | null;
  relevance: number;
  focusedDiff: string;
  surroundingContext: string;
  riskSignals: string[];
  hunkIndex?: number;
  lineRange?: FocusedDiffLineRange;
  estimatedTokens: number;
}

export interface FocusedDiffStats {
  filesConsidered: number;
  hunksConsidered: number;
  itemsRetained: number;
  itemsFiltered: number;
  totalEstimatedTokens: number;
}

export interface FocusedDiffReport {
  items: FocusedDiffItem[];
  generatedAt: string;
  stats: FocusedDiffStats;
}

export interface FocusedDiffInput {
  reviewContext: ReviewContext;
  compressedContext: CompressedReviewContext;
  relevanceReport: RelevanceReport;
}

export interface FocusedDiffOptions {
  totalTokenBudget?: number;
  maxItems?: number;
  maxContextLinesPerSnippet?: number;
  minRelevanceScore?: number;
}
