import type {
  CommentSeverity,
  GitHubReviewCommentPayload,
  RawReviewCommentItem,
  RawReviewCommentResponse,
  ReviewCommentItem,
  ReviewCommentReport,
  ReviewContext,
} from "@pr-review/shared";

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

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
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

function isRawReviewCommentItem(value: unknown): value is RawReviewCommentItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.file === "string" && typeof record.body === "string";
}

export function parseRawCommentResponse(content: string): RawReviewCommentResponse {
  const parsed = extractCommentJson(content);

  if (!parsed || typeof parsed !== "object") {
    throw new CommentParseError("LLM response is not a JSON object", content.slice(0, 500));
  }

  const record = parsed as Record<string, unknown>;
  if (!Array.isArray(record.comments)) {
    throw new CommentParseError("LLM response missing comments array", content.slice(0, 500));
  }

  const comments: RawReviewCommentItem[] = [];
  for (const item of record.comments) {
    if (!isRawReviewCommentItem(item)) {
      continue;
    }

    const body = normalizeString(item.body);
    if (!body) {
      continue;
    }

    comments.push({
      file: normalizeString(item.file),
      symbol: item.symbol ? normalizeString(item.symbol) || null : null,
      lineHint: item.lineHint ? normalizeString(item.lineHint) || null : null,
      severity: (item.severity as RawReviewCommentItem["severity"]) ?? "minor",
      body,
      suggestions: normalizeStringArray(item.suggestions),
      confidence: item.confidence ?? "medium",
    });
  }

  if (comments.length === 0) {
    throw new CommentParseError("No valid review comments in LLM response", content.slice(0, 500));
  }

  return { comments };
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
      filteredCount: 0,
      groundingWarnings: [],
    },
  };
}

export function parseCommentResponse(
  content: string,
  options: NormalizeCommentOptions,
): ReviewCommentReport {
  const raw = parseRawCommentResponse(content);
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
