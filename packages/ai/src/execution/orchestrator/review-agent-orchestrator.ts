import type { ReviewExecutionInput } from "@pr-review/shared";

import type { AgentGeneratorOptions } from "../../agents/agent-defaults.js";
import { runCommentPipeline } from "../../comments/pipeline/run-comment-pipeline.js";
import type { ReviewCommentGeneratorOptions } from "../../comments/pipeline/defaults.js";
import type { ReviewLLMClient } from "../../providers/review-llm-client.js";
import { runRiskPipeline } from "../../risk/pipeline/run-risk-pipeline.js";
import type { RiskReviewGeneratorOptions } from "../../risk/pipeline/defaults.js";
import { runSummaryPipeline } from "../../summary/pipeline/run-summary-pipeline.js";
import type { SummaryGeneratorOptions } from "../../summary/pipeline/defaults.js";
import { runWithAgentRecovery } from "../retry/review-execution-recovery.js";
import type { ResolvedReviewExecutionOptions } from "../pipeline/defaults.js";
import type { OrchestratorResult } from "../pipeline/types.js";
import type { ReviewAgentOrchestrator } from "./agent-orchestrator.js";

function buildAgentOptions(
  options: ResolvedReviewExecutionOptions,
  llmClient: ReviewLLMClient,
): AgentGeneratorOptions & SummaryGeneratorOptions & RiskReviewGeneratorOptions & ReviewCommentGeneratorOptions {
  return {
    llmClient,
    model: options.model,
    temperature: options.temperature,
    maxRetries: options.maxRetries,
    retryDelayMs: options.retryDelayMs,
    minConfidenceScore: options.minCommentConfidenceScore,
    maxComments: 20,
  };
}

export class DefaultReviewAgentOrchestrator implements ReviewAgentOrchestrator {
  async run(
    input: ReviewExecutionInput,
    options: ResolvedReviewExecutionOptions,
    llmClient: ReviewLLMClient,
    agentOptions: AgentGeneratorOptions,
  ): Promise<OrchestratorResult> {
    const mergedOptions = {
      ...buildAgentOptions(options, llmClient),
      ...agentOptions,
      llmClient,
    };

    const summaryPromise = runWithAgentRecovery(
      "summary",
      () =>
        runSummaryPipeline(
          {
            summaryPrompt: input.summaryPrompt,
            compressedContext: input.compressedContext,
            relevanceReport: input.relevanceReport,
            reviewContext: input.reviewContext,
          },
          mergedOptions,
        ),
      {
        maxAgentRetries: options.maxAgentRetries,
        streamSink: options.streamSink,
      },
    );

    const riskPromise = runWithAgentRecovery(
      "risk",
      () =>
        runRiskPipeline(
          {
            riskPrompt: input.riskPrompt,
            compressedContext: input.compressedContext,
            relevanceReport: input.relevanceReport,
            reviewContext: input.reviewContext,
          },
          {
            ...mergedOptions,
            minConfidenceScore: options.minRiskConfidenceScore,
          },
        ),
      {
        maxAgentRetries: options.maxAgentRetries,
        streamSink: options.streamSink,
      },
    );

    const [summaryRun, riskRun] = await Promise.all([summaryPromise, riskPromise]);

    let commentsRun: Awaited<ReturnType<typeof runWithAgentRecovery<import("@pr-review/shared").ReviewCommentReport>>>;
    try {
      commentsRun = await runWithAgentRecovery(
        "comments",
        () =>
          runCommentPipeline(
            {
              reviewPrompt: input.reviewPrompt,
              compressedContext: input.compressedContext,
              relevanceReport: input.relevanceReport,
              reviewContext: input.reviewContext,
              riskReport: riskRun.result,
              patchesByFile: input.patchesByFile,
              pathAliases: input.pathAliases,
            },
            mergedOptions,
          ),
        {
          maxAgentRetries: options.maxAgentRetries,
          streamSink: options.streamSink,
        },
      );
    } catch (error) {
      if (!options.continueOnPartialFailure) {
        throw error;
      }

      options.streamSink.onEvent({
        agent: "comments",
        phase: "failed",
        error: error instanceof Error ? error.message : String(error),
      });

      commentsRun = {
        result: {
          comments: [],
          generatedAt: new Date().toISOString(),
          meta: {
            provider: summaryRun.result.meta.provider,
            model: options.model,
            filteredCount: 0,
            groundingWarnings: [
              `Comments agent failed: ${error instanceof Error ? error.message : String(error)}`,
            ],
          },
        },
        attempts: options.maxAgentRetries + 1,
        latencyMs: 0,
      };
    }

    return {
      summary: summaryRun.result,
      risks: riskRun.result,
      comments: commentsRun.result,
      metrics: {
        summary: { latencyMs: summaryRun.latencyMs, attempts: summaryRun.attempts },
        risk: { latencyMs: riskRun.latencyMs, attempts: riskRun.attempts },
        comments: { latencyMs: commentsRun.latencyMs, attempts: commentsRun.attempts },
      },
    };
  }
}

export function createDefaultOrchestrator(): ReviewAgentOrchestrator {
  return new DefaultReviewAgentOrchestrator();
}
