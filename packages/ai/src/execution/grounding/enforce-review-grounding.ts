import type {
  CompressedReviewContext,
  PrSummary,
  RelevanceReport,
  ReviewCommentItem,
  ReviewCommentReport,
  ReviewContext,
  ReviewExecutionInput,
  RiskReviewReport,
} from "@pr-review/shared";

import { StyleFilterProcessor } from "../../comments/processors/style-filter-processor.js";
import { collectKnownPaths, isKnownReference } from "../../utils/path-grounding.js";
import { validateCommentGrounding } from "../../comments/validators/comment-grounding-validator.js";
import { validateRiskGrounding } from "../../risk/validators/risk-grounding-validator.js";
import { validateSummaryGrounding } from "../../summary/validators/context-grounding-validator.js";
import { shouldDropSpeculativeComment } from "./speculative-claim-filter.js";

export interface GroundingEnforcementResult {
  summary: PrSummary;
  risks: RiskReviewReport;
  comments: ReviewCommentReport;
  warnings: string[];
  filteredCounts: { risks: number; comments: number };
}

function fileSymbols(reviewContext: ReviewContext | undefined, file: string): Set<string> {
  const fileContext = reviewContext?.files.find((entry) => entry.filename === file);
  return new Set(fileContext?.symbols.map((symbol) => symbol.name) ?? []);
}

export function applyExecutionCommentRules(
  comments: ReviewCommentItem[],
  reviewContext: ReviewContext | undefined,
  warnings: string[],
): { comments: ReviewCommentItem[]; filteredCount: number } {
  const styleFilter = new StyleFilterProcessor();
  let filteredCount = 0;
  const retained: ReviewCommentItem[] = [];

  for (const comment of styleFilter.process(comments, { reviewContext })) {
    if (shouldDropSpeculativeComment(comment.comment, comment.file, comment.symbol)) {
      warnings.push(`Dropped speculative comment on ${comment.file}`);
      filteredCount += 1;
      continue;
    }

    if (comment.symbol) {
      const symbols = fileSymbols(reviewContext, comment.file);
      if (symbols.size > 0 && !symbols.has(comment.symbol)) {
        warnings.push(`Symbol ${comment.symbol} not found in ${comment.file}`);
      }
    }

    if (comment.line !== null && comment.mapping?.confidence === "inferred") {
      warnings.push(`Demoted inferred line mapping to file-level for ${comment.file}`);
      retained.push({
        ...comment,
        line: null,
        mapping: undefined,
      });
      continue;
    }

    retained.push(comment);
  }

  return { comments: retained, filteredCount };
}

export function enforceReviewGrounding(
  summary: PrSummary,
  risks: RiskReviewReport,
  comments: ReviewCommentReport,
  input: Pick<
    ReviewExecutionInput,
    "compressedContext" | "relevanceReport" | "reviewContext" | "patchesByFile" | "pathAliases"
  >,
): GroundingEnforcementResult {
  const warnings = [
    ...summary.meta.groundingWarnings,
    ...risks.meta.groundingWarnings,
    ...comments.meta.groundingWarnings,
  ];

  const summaryGrounding = validateSummaryGrounding(
    summary,
    input.compressedContext,
    input.relevanceReport,
    input.reviewContext,
  );
  warnings.push(...summaryGrounding.warnings);

  const riskBefore = risks.risks.length;
  const riskGrounding = validateRiskGrounding(
    risks,
    input.compressedContext,
    input.relevanceReport,
    input.reviewContext,
  );
  warnings.push(...riskGrounding.warnings);
  const risksFiltered = riskBefore - riskGrounding.groundedRisks.length;

  const commentGrounding = validateCommentGrounding(
    comments.comments,
    input.compressedContext,
    input.relevanceReport,
    input.reviewContext,
    {
      patchesByFile: input.patchesByFile,
      pathAliases: input.pathAliases,
    },
  );
  warnings.push(...commentGrounding.warnings);

  const executionComments = applyExecutionCommentRules(
    commentGrounding.groundedComments,
    input.reviewContext,
    warnings,
  );

  const executionFilteredCount =
    commentGrounding.groundedComments.length - executionComments.comments.length;

  return {
    summary: {
      ...summary,
      meta: {
        ...summary.meta,
        groundingWarnings: [...new Set([...summary.meta.groundingWarnings, ...summaryGrounding.warnings])],
      },
    },
    risks: {
      ...risks,
      risks: riskGrounding.groundedRisks,
      meta: {
        ...risks.meta,
        groundingWarnings: [...new Set([...risks.meta.groundingWarnings, ...riskGrounding.warnings])],
        filteredCount: risks.meta.filteredCount + risksFiltered,
      },
    },
    comments: {
      ...comments,
      comments: executionComments.comments,
      meta: {
        ...comments.meta,
        groundingWarnings: [...new Set([...comments.meta.groundingWarnings, ...commentGrounding.warnings])],
        filteredCount: comments.meta.filteredCount + executionComments.filteredCount,
      },
    },
    warnings: [...new Set(warnings)],
    filteredCounts: {
      risks: risksFiltered,
      comments: executionFilteredCount,
    },
  };
}

export function stripUngroundedSummaryKeyChanges(
  summary: PrSummary,
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  reviewContext?: ReviewContext,
): PrSummary {
  const known = collectKnownPaths(compressedContext, relevanceReport, reviewContext);
  const keyChanges = summary.keyChanges.filter((change) => {
    if (change.includes("/")) {
      return isKnownReference(change, known);
    }
    return true;
  });

  if (keyChanges.length === summary.keyChanges.length) {
    return summary;
  }

  return {
    ...summary,
    keyChanges,
    meta: {
      ...summary.meta,
      groundingWarnings: [
        ...summary.meta.groundingWarnings,
        "Stripped ungrounded keyChanges during execution grounding",
      ],
    },
  };
}
