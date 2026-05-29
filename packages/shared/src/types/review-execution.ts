import type { CompressedReviewContext } from "./compression.js";
import type { ReviewContext } from "./context.js";
import type { FocusedDiffReport } from "./focused-diff.js";
import type { LLMUsageMetrics } from "./llm.js";
import type { RelevanceReport } from "./relevance.js";
import type { ReviewCommentReport } from "./review-comment.js";
import type { RiskReviewReport } from "./risk-review.js";
import type { PrSummary } from "./summary.js";

export interface ReviewExecutionInput {
  summaryPrompt: string;
  riskPrompt: string;
  reviewPrompt: string;
  compressedContext: CompressedReviewContext;
  relevanceReport: RelevanceReport;
  reviewContext?: ReviewContext;
  focusedDiffReport?: FocusedDiffReport;
  patchesByFile?: Record<string, string | null>;
  pathAliases?: Record<string, string>;
}

export interface ReviewExecutionAgentLatency {
  summary: number;
  risk: number;
  comments: number;
  total: number;
}

export interface ReviewExecutionAgentModels {
  summary: string;
  risk: string;
  comments: string;
}

export interface ReviewExecutionAgentAttempts {
  summary: number;
  risk: number;
  comments: number;
}

export interface ReviewExecutionFilteredCounts {
  risks: number;
  comments: number;
}

export interface ReviewExecutionMeta {
  provider: string;
  models: ReviewExecutionAgentModels;
  usage: LLMUsageMetrics;
  latencyMs: ReviewExecutionAgentLatency;
  groundingWarnings: string[];
  filteredCounts: ReviewExecutionFilteredCounts;
  reliabilityScore: number;
  attempts: ReviewExecutionAgentAttempts;
  generatedAt: string;
}

export interface ReviewExecutionReport {
  summary: PrSummary;
  risks: RiskReviewReport;
  comments: ReviewCommentReport;
  meta: ReviewExecutionMeta;
}

export interface ReviewExecutionOptions {
  model?: string;
  temperature?: number;
  maxAgentRetries?: number;
  continueOnPartialFailure?: boolean;
  strictOutput?: boolean;
  minCommentConfidenceScore?: number;
  minRiskConfidenceScore?: number;
}
