import { executeReview, type ReviewExecutionReport, type ReviewStreamEvent } from "@pr-review/ai";
import { buildReviewContext } from "@pr-review/context-builder";
import { compressReviewContext } from "@pr-review/context-compressor";
import { scoreRelevance } from "@pr-review/context-relevance";
import { extractFocusedDiffs } from "@pr-review/focused-diff";
import { getPullRequest } from "@pr-review/github";
import { buildPathAliases } from "@pr-review/line-mapping";
import { buildReviewPrompts } from "@pr-review/prompt-builder";

import type { ReviewRequestBody } from "../types.js";
import { createCacheKey, updateJobProgress } from "./review-jobs.js";
import { resolveServerProvider } from "./provider-factory.js";

class JobStreamSink {
  constructor(
    private readonly onEventCallback: (event: ReviewStreamEvent) => void,
  ) {}

  onEvent(event: ReviewStreamEvent): void {
    this.onEventCallback(event);
  }
}

export interface RunReviewResult {
  cacheKey: string;
  report: ReviewExecutionReport;
  warnings: string[];
  resolvedProvider: string;
}

export async function runReviewPipeline(
  body: ReviewRequestBody,
  jobId: string,
): Promise<RunReviewResult> {
  const providerInput = body.provider ?? "auto";
  const cacheKey = createCacheKey({
    prUrl: body.prUrl,
    provider: providerInput,
    options: body.options ?? {},
  });

  const providerResolution = resolveServerProvider({
    provider: providerInput,
    forceMock: body.forceMock,
    maxRetries: body.options?.maxRetries,
    retryDelayMs: body.options?.retryDelayMs,
  });

  const warnings: string[] = [];
  if (providerResolution.warning) {
    warnings.push(providerResolution.warning);
  }

  const prData = await getPullRequest(body.prUrl);
  const reviewContext = buildReviewContext(prData);
  const compressed = compressReviewContext(reviewContext, {
    maxEstimatedTokens: Number(process.env.MAX_ESTIMATED_TOKENS ?? 6000),
  });
  const relevanceReport = scoreRelevance(
    { reviewContext, compressedContext: compressed },
    { totalContextBudget: Number(process.env.TOTAL_CONTEXT_BUDGET ?? 6000) },
  );
  const focusedDiffReport = extractFocusedDiffs({
    reviewContext,
    compressedContext: compressed,
    relevanceReport,
  });
  const prompts = buildReviewPrompts({
    compressedContext: compressed,
    relevanceReport,
    reviewContext,
    focusedDiffReport,
  });

  const patchesByFile = Object.fromEntries(
    prData.changedFiles.map((file) => [file.filename, file.patch]),
  );
  const pathAliases = buildPathAliases(prData.changedFiles);

  const streamSink = new JobStreamSink((event) => {
    updateJobProgress(jobId, { agent: event.agent, phase: event.phase });
  });

  const report = await executeReview(
    {
      summaryPrompt: prompts.summaryPrompt,
      riskPrompt: prompts.riskPrompt,
      reviewPrompt: prompts.reviewPrompt,
      compressedContext: compressed,
      relevanceReport,
      reviewContext,
      focusedDiffReport,
      patchesByFile,
      pathAliases,
    },
    {
      provider: providerResolution.provider,
      model: body.options?.model,
      temperature: body.options?.temperature,
      maxRetries: body.options?.maxRetries,
      retryDelayMs: body.options?.retryDelayMs,
      maxAgentRetries: body.options?.maxAgentRetries,
      continueOnPartialFailure:
        body.options?.continueOnPartialFailure ??
        Boolean(body.forceMock || providerResolution.resolvedProviderId === "mock"),
      strictOutput: body.options?.strictOutput,
      minCommentConfidenceScore: body.options?.minCommentConfidenceScore,
      minRiskConfidenceScore: body.options?.minRiskConfidenceScore,
      streamSink,
    },
  );

  return {
    cacheKey,
    report,
    warnings,
    resolvedProvider: providerResolution.provider.id,
  };
}

