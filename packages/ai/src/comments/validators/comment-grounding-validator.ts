import type {
  CompressedReviewContext,
  RelevanceReport,
  ReviewCommentItem,
  ReviewContext,
} from "@pr-review/shared";

import { collectKnownPaths, isKnownReference } from "../../utils/path-grounding.js";
import { resolveCommentLine } from "../utils/line-resolver.js";

const GENERIC_PRAISE = [/looks good/i, /nice work/i, /great job/i, /well done/i, /lgtm/i];
const OBVIOUS = [/consider adding comments/i, /add more tests/i];

export interface CommentGroundingResult {
  warnings: string[];
  unknownFiles: string[];
  groundedComments: ReviewCommentItem[];
}

export function validateCommentGrounding(
  comments: ReviewCommentItem[],
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  reviewContext?: ReviewContext,
): CommentGroundingResult {
  const warnings: string[] = [];
  const unknownFiles = new Set<string>();
  const known = collectKnownPaths(compressedContext, relevanceReport, reviewContext);
  const groundedComments: ReviewCommentItem[] = [];

  for (const comment of comments) {
    if (!isKnownReference(comment.file, known)) {
      unknownFiles.add(comment.file);
      warnings.push(`Unknown file reference in comment: ${comment.file}`);
      continue;
    }

    const text = `${comment.comment} ${comment.suggestion}`;
    if (GENERIC_PRAISE.some((pattern) => pattern.test(text))) {
      warnings.push(`Filtered generic praise comment on ${comment.file}`);
      continue;
    }

    if (OBVIOUS.some((pattern) => pattern.test(text))) {
      warnings.push(`Filtered obvious comment on ${comment.file}`);
      continue;
    }

    const resolvedLine = resolveCommentLine(
      comment.file,
      comment.line !== null ? String(comment.line) : null,
      comment.symbol,
      reviewContext,
    );

    if (comment.line !== null && resolvedLine === null) {
      warnings.push(`Dropped unverified line number for ${comment.file}`);
    }

    groundedComments.push({
      ...comment,
      line: resolvedLine,
    });
  }

  return {
    warnings,
    unknownFiles: [...unknownFiles],
    groundedComments,
  };
}
