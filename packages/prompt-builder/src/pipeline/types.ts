import type {
  CompressedModuleContext,
  DiscussionSummary,
  FileRelevanceScore,
  PromptBuildInput,
  PromptBuildOptions,
  PromptBuildStats,
  PromptSection,
  ReviewPromptBundle,
  SemanticSummary,
  SymbolRelevanceScore,
} from "@pr-review/shared";

import type { ResolvedPromptBuildOptions } from "./defaults.js";

export interface MergedModuleContext {
  module: string;
  compressed: CompressedModuleContext;
  relevanceScore: number;
  priority: string;
  topFiles: string[];
}

export interface PromptBuildState {
  input: PromptBuildInput;
  options: ResolvedPromptBuildOptions;
  mergedModules: MergedModuleContext[];
  rankedFileOrder: string[];
  rankedSymbolOrder: string[];
  fileScores: Map<string, FileRelevanceScore>;
  symbolScores: SymbolRelevanceScore[];
  riskSignals: string[];
  semanticSummary: SemanticSummary | null;
  existingDiscussion: DiscussionSummary[];
  summarySections: PromptSection[];
  riskSections: PromptSection[];
  reviewSections: PromptSection[];
  stats: PromptBuildStats;
  bundle: ReviewPromptBundle | null;
}
