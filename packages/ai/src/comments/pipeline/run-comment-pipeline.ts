import type { ReviewCommentGeneratorInput, ReviewCommentReport } from "@pr-review/shared";

import { collectKnownPaths } from "../../utils/path-grounding.js";
import { normalizeToReviewCommentReport } from "../parsers/comment-response-parser.js";
import {
  createDefaultCommentProcessors,
  runCommentProcessors,
} from "../processors/run-comment-processors.js";
import {
  applyCommentConfidenceScoring,
  filterCommentsByConfidence,
  sortCommentsByRelevance,
  trimComments,
} from "../scoring/comment-confidence-scorer.js";
import { validateCommentGrounding } from "../validators/comment-grounding-validator.js";
import { initCommentState } from "./init-comment-state.js";
import type { ReviewCommentGeneratorOptions } from "./defaults.js";

export async function runCommentPipeline(
  input: ReviewCommentGeneratorInput,
  options?: ReviewCommentGeneratorOptions,
): Promise<ReviewCommentReport> {
  const state = initCommentState(input, options);
  const knownPaths = collectKnownPaths(
    input.compressedContext,
    input.relevanceReport,
    input.reviewContext,
  );

  const llmResult = await state.llmClient.generateReviewComments(input.reviewPrompt, {
    model: state.options.model,
    temperature: state.options.temperature,
  });

  const baseMeta = {
    provider: llmResult.provider,
    model: llmResult.model,
    usage: llmResult.usage,
    latencyMs: llmResult.latencyMs,
    estimatedCostUsd: llmResult.usage.estimatedCostUsd,
    knownPaths,
    reviewContext: input.reviewContext,
  };

  let report = normalizeToReviewCommentReport(llmResult.result, baseMeta);

  const processors = options?.processors ?? createDefaultCommentProcessors();
  report = {
    ...report,
    comments: runCommentProcessors(processors, report.comments, {
      reviewContext: input.reviewContext,
    }),
  };

  const grounding = validateCommentGrounding(
    report.comments,
    input.compressedContext,
    input.relevanceReport,
    input.reviewContext,
  );

  report = {
    ...report,
    comments: grounding.groundedComments,
    meta: {
      ...report.meta,
      groundingWarnings: grounding.warnings,
    },
  };

  report = applyCommentConfidenceScoring(report, {
    compressedContext: input.compressedContext,
    relevanceReport: input.relevanceReport,
    reviewContext: input.reviewContext,
    riskReport: input.riskReport,
    knownPaths,
    unknownFiles: grounding.unknownFiles,
  });

  const filtered = filterCommentsByConfidence(report, input.relevanceReport, {
    minConfidenceScore: state.options.minConfidenceScore,
  });

  const sorted = sortCommentsByRelevance(filtered.report.comments, input.relevanceReport);
  const trimmed = trimComments(sorted, state.options.maxComments);

  state.report = {
    ...filtered.report,
    comments: trimmed,
    meta: {
      ...filtered.report.meta,
      filteredCount: filtered.filteredCount,
      groundingWarnings: [...report.meta.groundingWarnings],
    },
  };

  return state.report;
}
