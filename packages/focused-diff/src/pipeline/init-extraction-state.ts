import type {
  CompressedReviewContext,
  FocusedDiffOptions,
  RelevanceReport,
  ReviewContext,
} from "@pr-review/shared";

export interface ExtractionState {
  reviewContext: ReviewContext;
  compressedContext: CompressedReviewContext;
  relevanceReport: RelevanceReport;
  options: Required<FocusedDiffOptions>;
  filesConsidered: number;
  hunksConsidered: number;
}

export function initExtractionState(
  reviewContext: ReviewContext,
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  options: Required<FocusedDiffOptions>,
): ExtractionState {
  return {
    reviewContext,
    compressedContext,
    relevanceReport,
    options,
    filesConsidered: 0,
    hunksConsidered: 0,
  };
}
