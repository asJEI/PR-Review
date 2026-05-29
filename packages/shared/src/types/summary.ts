import type { CompressedReviewContext } from "./compression.js";
import type { ReviewContext } from "./context.js";
import type { RelevanceReport } from "./relevance.js";

export interface SummaryGeneratorInput {
  summaryPrompt: string;
  compressedContext: CompressedReviewContext;
  relevanceReport: RelevanceReport;
  reviewContext?: ReviewContext;
}

export interface PrSummaryMeta {
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  groundingWarnings: string[];
}

/** Structured PR summary output. */
export interface PrSummary {
  title: string;
  summary: string;
  keyChanges: string[];
  affectedSystems: string[];
  architecturalImpact: string;
  generatedAt: string;
  meta: PrSummaryMeta;
}

/** Raw JSON schema expected from the summary LLM agent. */
export interface RawSummaryAgentResponse {
  intent: string;
  coreChanges: string[];
  affectedModules: string[];
  infrastructureImpact: string | null;
  notableRisks?: string[];
}
