import type {
  CommentSeverity,
  GitHubReviewCommentPayload,
  RawReviewCommentItem,
  RawReviewCommentResponse,
  ReviewCommentItem,
  ReviewCommentReport,
  ReviewContext,
} from "@pr-review/shared";

import { commentSchemaValidator } from "../../providers/schema/comment-schema.js";
import { extractJson } from "../../utils/extract-json.js";
import { CommentParseError, CommentValidationError, SummaryParseError } from "../../utils/errors.js";
import { isKnownReference } from "../../utils/path-grounding.js";
import { resolveCommentLine } from "../utils/line-resolver.js";

function extractCommentJson(content: string): unknown {
  try {
    return extractJson(content);
  } catch (error) {
    if (error instanceof SummaryParseError) {
      throw new CommentParseError(error.message, error.rawSnippet);
    }
    throw error;
  }
}

function mapSeverity(raw: RawReviewCommentItem["severity"]): CommentSeverity {
  switch (raw) {
    case "critical":
      return "critical";
    case "major":
      return "high";
    case "minor":
      return "medium";
    case "suggestion":
      return "suggestion";
    default:
      return "medium";
  }
}

export function parseRawCommentResponse(content: string): RawReviewCommentResponse {
  const parsed = extractCommentJson(content);
  const validation = commentSchemaValidator.validate(parsed);

  if (!validation.success || !validation.value) {
    throw new CommentParseError(
      validation.errors.join("; ") || "LLM response missing comments array",
      content.slice(0, 500),
    );
  }

  return validation.value;
}

function buildSuggestion(suggestions: string[]): string {
  if (suggestions.length === 0) {
    return "";
  }
  return suggestions[0] ?? suggestions.join("; ");
}

function dedupeKey(item: ReviewCommentItem): string {
  return `${item.file}|${item.symbol ?? ""}|${item.comment.slice(0, 40)}`;
}

export interface NormalizeCommentOptions {
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latencyMs?: number;
  estimatedCostUsd?: number;
  knownPaths: Set<string>;
  reviewContext?: ReviewContext;
}

export function rawItemToReviewComment(
  raw: RawReviewCommentItem,
  options: NormalizeCommentOptions,
): ReviewCommentItem | null {
  if (!raw.file || !isKnownReference(raw.file, options.knownPaths)) {
    return null;
  }

  return {
    file: raw.file,
    line: resolveCommentLine(raw.file, raw.lineHint, raw.symbol, options.reviewContext),
    symbol: raw.symbol,
    severity: mapSeverity(raw.severity),
    comment: raw.body,
    suggestion: buildSuggestion(raw.suggestions),
    confidence: raw.confidence,
    confidenceScore: 0,
    reasoning: raw.body,
  };
}

export function normalizeToReviewCommentReport(
  raw: RawReviewCommentResponse,
  options: NormalizeCommentOptions,
): ReviewCommentReport {
  const deduped = new Map<string, ReviewCommentItem>();

  for (const item of raw.comments) {
    const normalized = rawItemToReviewComment(item, options);
    if (!normalized) {
      continue;
    }
    deduped.set(dedupeKey(normalized), normalized);
  }

  const comments = [...deduped.values()];
  if (comments.length === 0) {
    throw new CommentValidationError("No grounded review comments after normalization");
  }

  return {
    comments,
    generatedAt: new Date().toISOString(),
    meta: {
      provider: options.provider,
      model: options.model,
      promptTokens: options.usage?.promptTokens,
      completionTokens: options.usage?.completionTokens,
      totalTokens: options.usage?.totalTokens,
      latencyMs: options.latencyMs,
      estimatedCostUsd: options.estimatedCostUsd,
      filteredCount: 0,
      groundingWarnings: [],
    },
  };
}

export function parseCommentResponse(
  contentOrRaw: string | RawReviewCommentResponse,
  options: NormalizeCommentOptions,
): ReviewCommentReport {
  const raw =
    typeof contentOrRaw === "string" ? parseRawCommentResponse(contentOrRaw) : contentOrRaw;
  return normalizeToReviewCommentReport(raw, options);
}

export function toGitHubReviewPayload(
  comment: ReviewCommentItem,
): GitHubReviewCommentPayload | null {
  const bodyParts = [comment.comment];
  if (comment.suggestion) {
    bodyParts.push("", `Suggestion: ${comment.suggestion}`);
  }

  const body = bodyParts.join("\n").trim();
  if (!body) {
    return null;
  }

  if (comment.line !== null) {
    return {
      path: comment.file,
      line: comment.line,
      body,
    };
  }

  return {
    path: comment.file,
    body: `[File-level review] ${body}`,
  };
}

export function toGitHubReviewPayloads(
  comments: ReviewCommentItem[],
): GitHubReviewCommentPayload[] {
  return comments
    .map((comment) => toGitHubReviewPayload(comment))
    .filter((payload): payload is GitHubReviewCommentPayload => payload !== null);
}
