import type { ReviewCommentGeneratorInput, ReviewCommentReport } from "@pr-review/shared";

import { collectKnownPaths } from "../../utils/path-grounding.js";
import { parseCommentResponse } from "../parsers/comment-response-parser.js";
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
import { getBaseProviderId, initCommentState } from "./init-comment-state.js";
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

  state.completion = await state.provider.complete({
    messages: [{ role: "user", content: input.reviewPrompt }],
    model: state.options.model,
    temperature: state.options.temperature,
    responseFormat: "json",
  });

  const baseMeta = {
    provider: getBaseProviderId(state.provider),
    model: state.completion.model,
    usage: state.completion.usage,
    knownPaths,
    reviewContext: input.reviewContext,
  };

  let report = parseCommentResponse(state.completion.content, baseMeta);

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
