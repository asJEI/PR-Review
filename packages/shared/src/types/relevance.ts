import type { CompressedReviewContext } from "./compression.js";
import type { ContextMetadata, ReviewContext, SymbolChangeType, SymbolKind } from "./context.js";
import type { ParsedPrUrl } from "./pr.js";

export type RelevancePriority = "critical" | "high" | "medium" | "low" | "ignored";

export type CompressionLevel = "preserve" | "normal" | "aggressive";

export interface FileRelevanceScore {
  file: string;
  relevanceScore: number;
  priority: RelevancePriority;
  reasons: string[];
  suggestedContextTokens: number;
  compressionLevel: CompressionLevel;
}

export interface SymbolRelevanceScore {
  file: string;
  symbol: string;
  kind: SymbolKind;
  changeType: SymbolChangeType;
  relevanceScore: number;
  priority: RelevancePriority;
  reasons: string[];
}

export interface ModuleRelevanceScore {
  module: string;
  relevanceScore: number;
  priority: RelevancePriority;
  reasons: string[];
  topFiles: string[];
}

export interface FileBudgetAllocation {
  file: string;
  tokens: number;
  share: number;
}

export interface ContextBudgetAllocation {
  totalBudget: number;
  fileAllocations: FileBudgetAllocation[];
}

export interface RelevanceStats {
  filesScored: number;
  symbolsScored: number;
  ignoredCount: number;
}

export interface RelevanceReport {
  source: ParsedPrUrl;
  metadata: ContextMetadata;
  files: FileRelevanceScore[];
  symbols: SymbolRelevanceScore[];
  modules: ModuleRelevanceScore[];
  budget: ContextBudgetAllocation;
  rankedFileOrder: string[];
  rankedSymbolOrder: string[];
  stats: RelevanceStats;
  scoredAt: string;
}

export interface RelevanceInput {
  reviewContext: ReviewContext;
  compressedContext?: CompressedReviewContext;
}

export interface RelevanceOptions {
  totalContextBudget?: number;
  minFileTokens?: number;
  maxFileTokens?: number;
}
