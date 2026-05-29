import type { CompressedReviewContext } from "./compression.js";
import type { ReviewContext } from "./context.js";
import type { RelevanceReport } from "./relevance.js";
import type { RiskReviewReport } from "./risk-review.js";

export type CommentSeverity = "critical" | "high" | "medium" | "low" | "suggestion";

export type CommentConfidenceLabel = "high" | "medium" | "low";

export interface ReviewCommentGeneratorInput {
  reviewPrompt: string;
  compressedContext: CompressedReviewContext;
  relevanceReport: RelevanceReport;
  reviewContext?: ReviewContext;
  riskReport?: RiskReviewReport;
}

export interface ReviewCommentItem {
  file: string;
  line: number | null;
  symbol: string | null;
  severity: CommentSeverity;
  comment: string;
  suggestion: string;
  confidence: CommentConfidenceLabel;
  confidenceScore: number;
  reasoning: string;
}

export interface ReviewCommentMeta {
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  filteredCount: number;
  groundingWarnings: string[];
}

/** Structured review comment output. */
export interface ReviewCommentReport {
  comments: ReviewCommentItem[];
  generatedAt: string;
  meta: ReviewCommentMeta;
}

/** Raw JSON schema expected from the review comment LLM agent. */
export interface RawReviewCommentItem {
  file: string;
  symbol: string | null;
  lineHint: string | null;
  severity: "critical" | "major" | "minor" | "suggestion";
  body: string;
  suggestions: string[];
  confidence: CommentConfidenceLabel;
}

export interface RawReviewCommentResponse {
  comments: RawReviewCommentItem[];
}

/** Future GitHub Review API payload shape. */
export interface GitHubReviewCommentPayload {
  path: string;
  line?: number;
  body: string;
}
