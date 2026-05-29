import type { RawReviewCommentItem, RawReviewCommentResponse } from "@pr-review/shared";

import { createValidator, type ValidationResult } from "./schema-validator.js";

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

function isRawReviewCommentItem(value: unknown): value is RawReviewCommentItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.file === "string" && typeof record.body === "string";
}

export function validateRawCommentResponse(value: unknown): ValidationResult<RawReviewCommentResponse> {
  if (!value || typeof value !== "object") {
    return { success: false, errors: ["Response is not a JSON object"] };
  }

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.comments)) {
    return { success: false, errors: ["Missing or invalid field: comments (array)"] };
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
    return { success: false, errors: ["No valid review comments in response"] };
  }

  return {
    success: true,
    value: { comments },
    errors: [],
  };
}

export const commentSchemaValidator = createValidator("comment", validateRawCommentResponse);
