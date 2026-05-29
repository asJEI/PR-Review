import type { CompressedReviewContext } from "./compression.js";
import type { ReviewContext } from "./context.js";
import type { RelevanceReport } from "./relevance.js";

export type RiskSeverity = "critical" | "high" | "medium" | "low";

export type RiskCategory =
  | "authentication"
  | "async/concurrency"
  | "database"
  | "cache"
  | "error-handling"
  | "permissions"
  | "other";

export type RiskConfidenceLabel = "high" | "medium" | "low";

export interface RiskReviewGeneratorInput {
  riskPrompt: string;
  compressedContext: CompressedReviewContext;
  relevanceReport: RelevanceReport;
  reviewContext?: ReviewContext;
}

export interface RiskReviewItem {
  severity: RiskSeverity;
  category: RiskCategory;
  description: string;
  affectedFiles: string[];
  recommendation: string;
  confidence: RiskConfidenceLabel;
  confidenceScore: number;
  reasoning: string;
}

export interface RiskReviewMeta {
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  estimatedCostUsd?: number;
  filteredCount: number;
  groundingWarnings: string[];
}

/** Structured risk review output. */
export interface RiskReviewReport {
  risks: RiskReviewItem[];
  overallRiskLevel: RiskSeverity;
  generatedAt: string;
  meta: RiskReviewMeta;
}

/** Raw JSON schema expected from the risk LLM agent. */
export interface RawRiskAgentItem {
  category: string;
  location: string;
  severity: RiskSeverity;
  rationale: string;
  mitigation: string;
  confidence: RiskConfidenceLabel;
}

export interface RawRiskAgentResponse {
  risks: RawRiskAgentItem[];
  overallRiskLevel: RiskSeverity;
}
