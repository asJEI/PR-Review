import type {
  CompressedReviewContext,
  RelevanceReport,
  ReviewCommentItem,
  ReviewCommentReport,
  ReviewContext,
  RiskReviewReport,
} from "@pr-review/shared";

const BASE_CONFIDENCE = {
  high: 0.85,
  medium: 0.6,
  low: 0.35,
} as const;

const HIGH_SIGNAL_PATTERN =
  /middleware|handler|auth|login|token|export|write|insert|update|delete|repository|service|async|await|database|db/i;

const GENERIC_PRAISE = [/looks good/i, /nice work/i, /great job/i, /well done/i, /lgtm/i];

const SPECULATIVE = [/might be a bug/i, /could be wrong/i, /may cause issues/i, /possibly/i];

const STYLE_PATTERNS = [/naming convention/i, /code style/i, /formatting/i, /lint/i, /variable name/i];

export interface CommentScoringContext {
  compressedContext: CompressedReviewContext;
  relevanceReport: RelevanceReport;
  reviewContext?: ReviewContext;
  riskReport?: RiskReviewReport;
  knownPaths: Set<string>;
  unknownFiles: string[];
}

export function confidenceLabelFromScore(score: number): "high" | "medium" | "low" {
  if (score >= 0.75) {
    return "high";
  }
  if (score >= 0.5) {
    return "medium";
  }
  return "low";
}

function isHighPriorityFile(file: string, relevanceReport: RelevanceReport): boolean {
  const entry = relevanceReport.files.find((item) => item.file === file);
  return entry?.priority === "critical" || entry?.priority === "high";
}

function matchesRiskReport(comment: ReviewCommentItem, riskReport?: RiskReviewReport): boolean {
  if (!riskReport) {
    return false;
  }

  return riskReport.risks.some(
    (risk) =>
      risk.affectedFiles.includes(comment.file) ||
      risk.description.toLowerCase().includes(comment.file.toLowerCase()),
  );
}

export function scoreCommentConfidence(
  comment: ReviewCommentItem,
  context: CommentScoringContext,
): number {
  let score = BASE_CONFIDENCE[comment.confidence];

  if (isHighPriorityFile(comment.file, context.relevanceReport)) {
    score += 0.1;
  }

  const target = `${comment.symbol ?? ""} ${comment.file} ${comment.comment}`;
  if (HIGH_SIGNAL_PATTERN.test(target)) {
    score += 0.1;
  }

  if (matchesRiskReport(comment, context.riskReport)) {
    score += 0.1;
  }

  if (comment.line !== null) {
    score += 0.05;
  }

  for (const unknown of context.unknownFiles) {
    if (comment.file === unknown || comment.comment.includes(unknown)) {
      score -= 0.2;
    }
  }

  for (const pattern of GENERIC_PRAISE) {
    if (pattern.test(comment.comment)) {
      score -= 0.15;
    }
  }

  for (const pattern of SPECULATIVE) {
    if (pattern.test(comment.comment)) {
      score -= 0.15;
    }
  }

  for (const pattern of STYLE_PATTERNS) {
    if (pattern.test(comment.comment)) {
      score -= 0.1;
    }
  }

  return Math.max(0, Math.min(1, score));
}

export function applyCommentConfidenceScoring(
  report: ReviewCommentReport,
  context: CommentScoringContext,
): ReviewCommentReport {
  const comments = report.comments.map((comment) => {
    const confidenceScore = scoreCommentConfidence(comment, context);
    return {
      ...comment,
      confidenceScore,
      confidence: confidenceLabelFromScore(confidenceScore),
    };
  });

  return { ...report, comments };
}

export interface FilterCommentsOptions {
  minConfidenceScore: number;
}

export function filterCommentsByConfidence(
  report: ReviewCommentReport,
  relevanceReport: RelevanceReport,
  options: FilterCommentsOptions,
): { report: ReviewCommentReport; filteredCount: number } {
  const retained: ReviewCommentItem[] = [];
  let filteredCount = 0;

  for (const comment of report.comments) {
    const fileEntry = relevanceReport.files.find((file) => file.file === comment.file);
    const criticalWithSymbol =
      fileEntry?.priority === "critical" && (comment.symbol !== null || comment.line !== null);

    if (comment.confidenceScore >= options.minConfidenceScore || criticalWithSymbol) {
      retained.push(comment);
    } else {
      filteredCount += 1;
    }
  }

  return {
    report: {
      ...report,
      comments: retained,
      meta: { ...report.meta, filteredCount },
    },
    filteredCount,
  };
}

export function sortCommentsByRelevance(
  comments: ReviewCommentItem[],
  relevanceReport: RelevanceReport,
): ReviewCommentItem[] {
  const rank = new Map(relevanceReport.rankedFileOrder.map((file, index) => [file, index]));

  return [...comments].sort((left, right) => {
    const leftRank = rank.get(left.file) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = rank.get(right.file) ?? Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return right.confidenceScore - left.confidenceScore;
  });
}

export function trimComments(comments: ReviewCommentItem[], maxComments: number): ReviewCommentItem[] {
  return comments.slice(0, maxComments);
}
