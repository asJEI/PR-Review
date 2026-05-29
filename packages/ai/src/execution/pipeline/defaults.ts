import type { ReviewExecutionOptions } from "@pr-review/shared";

import type { AgentGeneratorOptions, ResolvedAgentGeneratorOptions } from "../../agents/agent-defaults.js";
import { resolveAgentOptions } from "../../agents/agent-defaults.js";
import type { ReviewStreamSink } from "../streaming/review-stream-sink.js";
import { NoopReviewStreamSink } from "../streaming/review-stream-sink.js";

export interface ReviewExecutionLocalOptions extends ReviewExecutionOptions {
  streamSink?: ReviewStreamSink;
  orchestrator?: import("../orchestrator/agent-orchestrator.js").ReviewAgentOrchestrator;
}

export interface ResolvedReviewExecutionOptions extends ResolvedAgentGeneratorOptions {
  maxAgentRetries: number;
  continueOnPartialFailure: boolean;
  strictOutput: boolean;
  minCommentConfidenceScore: number;
  minRiskConfidenceScore: number;
  streamSink: ReviewStreamSink;
}

export const DEFAULT_REVIEW_EXECUTION_OPTIONS: ResolvedReviewExecutionOptions = {
  model: "gpt-4o-mini",
  temperature: 0.2,
  maxRetries: 3,
  retryDelayMs: 500,
  maxAgentRetries: 1,
  continueOnPartialFailure: false,
  strictOutput: false,
  minCommentConfidenceScore: 0.5,
  minRiskConfidenceScore: 0.5,
  streamSink: new NoopReviewStreamSink(),
};

export function resolveReviewExecutionOptions(
  options?: ReviewExecutionLocalOptions & AgentGeneratorOptions,
): ResolvedReviewExecutionOptions {
  const base = resolveAgentOptions(options, {
    temperature: DEFAULT_REVIEW_EXECUTION_OPTIONS.temperature,
  });

  return {
    ...base,
    model: options?.model ?? base.model,
    temperature: options?.temperature ?? base.temperature,
    maxAgentRetries: options?.maxAgentRetries ?? DEFAULT_REVIEW_EXECUTION_OPTIONS.maxAgentRetries,
    continueOnPartialFailure:
      options?.continueOnPartialFailure ?? DEFAULT_REVIEW_EXECUTION_OPTIONS.continueOnPartialFailure,
    strictOutput: options?.strictOutput ?? DEFAULT_REVIEW_EXECUTION_OPTIONS.strictOutput,
    minCommentConfidenceScore:
      options?.minCommentConfidenceScore ?? DEFAULT_REVIEW_EXECUTION_OPTIONS.minCommentConfidenceScore,
    minRiskConfidenceScore:
      options?.minRiskConfidenceScore ?? DEFAULT_REVIEW_EXECUTION_OPTIONS.minRiskConfidenceScore,
    streamSink: options?.streamSink ?? DEFAULT_REVIEW_EXECUTION_OPTIONS.streamSink,
  };
}

export type { ReviewExecutionOptions };
