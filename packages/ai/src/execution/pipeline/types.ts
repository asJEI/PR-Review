import type { ReviewExecutionInput } from "@pr-review/shared";

import type { ReviewLLMClient } from "../../providers/review-llm-client.js";
import type { ResolvedReviewExecutionOptions } from "./defaults.js";

export interface ReviewExecutionPipelineState {
  input: ReviewExecutionInput;
  options: ResolvedReviewExecutionOptions;
  llmClient: ReviewLLMClient;
}

export interface AgentRunMetrics {
  latencyMs: number;
  attempts: number;
}

export interface OrchestratorResult {
  summary: import("@pr-review/shared").PrSummary;
  risks: import("@pr-review/shared").RiskReviewReport;
  comments: import("@pr-review/shared").ReviewCommentReport;
  metrics: {
    summary: AgentRunMetrics;
    risk: AgentRunMetrics;
    comments: AgentRunMetrics;
  };
}
