import type {
  PrSummary,
  ReviewCommentReport,
  RiskReviewReport,
} from "@pr-review/shared";

export interface ReviewReliabilityInput {
  summary: PrSummary;
  risks: RiskReviewReport;
  comments: ReviewCommentReport;
  groundingWarningCount: number;
}

export function scoreReviewReliability(input: ReviewReliabilityInput): number {
  const { summary, risks, comments, groundingWarningCount } = input;

  const commentScores = comments.comments.map((comment) => comment.confidenceScore);
  const meanCommentScore =
    commentScores.length > 0
      ? commentScores.reduce((sum, score) => sum + score, 0) / commentScores.length
      : 0.3;

  const riskScores = risks.risks.map((risk) => risk.confidenceScore);
  const meanRiskScore =
    riskScores.length > 0
      ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length
      : 0.3;

  let score = meanCommentScore * 0.45 + meanRiskScore * 0.35 + 0.2;

  if (summary.meta.groundingWarnings.length > 0) {
    score -= 0.05;
  }

  score -= Math.min(0.2, groundingWarningCount * 0.02);

  const exactMappings = comments.comments.filter((comment) => comment.mapping?.confidence === "exact").length;
  if (comments.comments.length > 0 && exactMappings / comments.comments.length > 0.5) {
    score += 0.05;
  }

  return Math.max(0, Math.min(1, score));
}
