import type {
  CompressedReviewContext,
  RelevanceReport,
  ReviewCommentItem,
  ReviewContext,
} from "@pr-review/shared";
import type { LineMappingInput } from "@pr-review/shared";

import { collectKnownPaths, isKnownReference } from "../../utils/path-grounding.js";
import { resolveCommentLine, resolveCommentMapping } from "../utils/line-resolver.js";

const GENERIC_PRAISE = [/looks good/i, /nice work/i, /great job/i, /well done/i, /lgtm/i];
const OBVIOUS = [/consider adding comments/i, /add more tests/i];

export interface CommentGroundingResult {
  warnings: string[];
  unknownFiles: string[];
  groundedComments: ReviewCommentItem[];
}

export interface CommentGroundingOptions {
  patchesByFile?: LineMappingInput["patchesByFile"];
  pathAliases?: LineMappingInput["pathAliases"];
}

export function validateCommentGrounding(
  comments: ReviewCommentItem[],
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  reviewContext?: ReviewContext,
  options?: CommentGroundingOptions,
): CommentGroundingResult {
  const warnings: string[] = [];
  const unknownFiles = new Set<string>();
  const known = collectKnownPaths(compressedContext, relevanceReport, reviewContext);
  const groundedComments: ReviewCommentItem[] = [];
  const mappingOptions = {
    patchesByFile: options?.patchesByFile,
    pathAliases: options?.pathAliases,
  };

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

    const mapping = resolveCommentMapping(
      comment.file,
      comment.line !== null ? String(comment.line) : null,
      comment.symbol,
      comment.line,
      reviewContext,
      mappingOptions,
    );

    const resolvedLine = resolveCommentLine(
      comment.file,
      comment.line !== null ? String(comment.line) : null,
      comment.symbol,
      reviewContext,
      mappingOptions,
    );

    if (comment.line !== null && resolvedLine === null) {
      warnings.push(`Dropped unverified line number for ${comment.file}`);
    }

    if (mapping?.confidence === "inferred" && comment.line !== null) {
      warnings.push(`Inferred line mapping for ${comment.file}`);
    }

    groundedComments.push({
      ...comment,
      line: resolvedLine,
      mapping: mapping ?? undefined,
    });
  }

  return {
    warnings,
    unknownFiles: [...unknownFiles],
    groundedComments,
  };
}
