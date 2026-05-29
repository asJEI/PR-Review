import type { CompressedReviewContext } from "./compression.js";
import type { ReviewContext } from "./context.js";
import type { FocusedDiffReport } from "./focused-diff.js";
import type { RelevanceReport } from "./relevance.js";

export type PromptAgentId = "summary" | "risk" | "review";

/** Structured section before token assembly. */
export interface PromptSection {
  id: string;
  title: string;
  content: string;
  priority: number;
  estimatedTokens: number;
  agentId: PromptAgentId;
}

export interface PromptBuildInput {
  compressedContext: CompressedReviewContext;
  relevanceReport: RelevanceReport;
  reviewContext?: ReviewContext;
  focusedDiffReport?: FocusedDiffReport;
}

export interface PromptBuildOptions {
  totalTokenBudget?: number;
  summaryTokenShare?: number;
  riskTokenShare?: number;
  reviewTokenShare?: number;
  maxModulesPerPrompt?: number;
  minRelevancePriority?: "critical" | "high" | "medium" | "low" | "ignored";
}

export interface PromptBuildStats {
  summaryTokens: number;
  riskTokens: number;
  reviewTokens: number;
  sectionsIncluded: string[];
  sectionsDropped: string[];
}

/** Output of prompt-builder; input for future packages/ai. */
export interface ReviewPromptBundle {
  summaryPrompt: string;
  riskPrompt: string;
  reviewPrompt: string;
  stats: PromptBuildStats;
  builtAt: string;
}
