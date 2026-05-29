import type { LLMUsageMetrics, ReviewExecutionInput, ReviewExecutionReport } from "@pr-review/shared";

import type { AgentGeneratorOptions } from "../../agents/agent-defaults.js";
import { collectKnownPaths } from "../../utils/path-grounding.js";
import {
  applyCommentConfidenceScoring,
} from "../../comments/scoring/comment-confidence-scorer.js";
import { mergeUsage, toUsageMetrics } from "../../providers/usage-tracker.js";
import { createDefaultOrchestrator } from "../orchestrator/review-agent-orchestrator.js";
import { enforceReviewGrounding } from "../grounding/enforce-review-grounding.js";
import { scoreReviewReliability } from "../scoring/review-reliability-scorer.js";
import { validateReviewOutput } from "../validators/review-output-validator.js";
import type { ReviewExecutionLocalOptions } from "./defaults.js";
import { initExecutionState } from "./init-execution-state.js";
import type { OrchestratorResult } from "./types.js";

function mergeExecutionUsage(
  orchestrated: OrchestratorResult,
): LLMUsageMetrics {
  const summaryUsage = orchestrated.summary.meta;
  const riskUsage = orchestrated.risks.meta;
  const commentUsage = orchestrated.comments.meta;

  const merged = mergeUsage(
    mergeUsage(
      {
        promptTokens: summaryUsage.promptTokens ?? 0,
        completionTokens: summaryUsage.completionTokens ?? 0,
        totalTokens: summaryUsage.totalTokens ?? 0,
      },
      {
        promptTokens: riskUsage.promptTokens ?? 0,
        completionTokens: riskUsage.completionTokens ?? 0,
        totalTokens: riskUsage.totalTokens ?? 0,
      },
    ),
    {
      promptTokens: commentUsage.promptTokens ?? 0,
      completionTokens: commentUsage.completionTokens ?? 0,
      totalTokens: commentUsage.totalTokens ?? 0,
    },
  );

  const estimatedCostUsd =
    (summaryUsage.estimatedCostUsd ?? 0) +
    (riskUsage.estimatedCostUsd ?? 0) +
    (commentUsage.estimatedCostUsd ?? 0);

  return toUsageMetrics(merged, estimatedCostUsd || undefined);
}

export async function runReviewExecutionPipeline(
  input: ReviewExecutionInput,
  options?: ReviewExecutionLocalOptions & AgentGeneratorOptions,
): Promise<ReviewExecutionReport> {
  const state = initExecutionState(input, options);
  const orchestrator = options?.orchestrator ?? createDefaultOrchestrator();

  const orchestrated = await orchestrator.run(
    input,
    state.options,
    state.llmClient,
    options ?? {},
  );

  const grounded = enforceReviewGrounding(
    orchestrated.summary,
    orchestrated.risks,
    orchestrated.comments,
    input,
  );

  validateReviewOutput(grounded.summary, grounded.risks, grounded.comments, {
    strictOutput: state.options.strictOutput,
  });

  const knownPaths = collectKnownPaths(
    input.compressedContext,
    input.relevanceReport,
    input.reviewContext,
  );

  const scoredComments = applyCommentConfidenceScoring(grounded.comments, {
    compressedContext: input.compressedContext,
    relevanceReport: input.relevanceReport,
    reviewContext: input.reviewContext,
    riskReport: grounded.risks,
    knownPaths,
    unknownFiles: [],
  });

  const reliabilityScore = scoreReviewReliability({
    summary: grounded.summary,
    risks: grounded.risks,
    comments: scoredComments,
    groundingWarningCount: grounded.warnings.length,
  });

  const totalLatencyMs =
    orchestrated.metrics.summary.latencyMs +
    orchestrated.metrics.risk.latencyMs +
    orchestrated.metrics.comments.latencyMs;

  const provider =
    grounded.summary.meta.provider ||
    grounded.risks.meta.provider ||
    grounded.comments.meta.provider ||
    "unknown";

  return {
    summary: grounded.summary,
    risks: grounded.risks,
    comments: scoredComments,
    meta: {
      provider,
      models: {
        summary: grounded.summary.meta.model,
        risk: grounded.risks.meta.model,
        comments: scoredComments.meta.model,
      },
      usage: mergeExecutionUsage(orchestrated),
      latencyMs: {
        summary: orchestrated.metrics.summary.latencyMs,
        risk: orchestrated.metrics.risk.latencyMs,
        comments: orchestrated.metrics.comments.latencyMs,
        total: totalLatencyMs,
      },
      groundingWarnings: grounded.warnings,
      filteredCounts: grounded.filteredCounts,
      reliabilityScore,
      attempts: {
        summary: orchestrated.metrics.summary.attempts,
        risk: orchestrated.metrics.risk.attempts,
        comments: orchestrated.metrics.comments.attempts,
      },
      generatedAt: new Date().toISOString(),
    },
  };
}
