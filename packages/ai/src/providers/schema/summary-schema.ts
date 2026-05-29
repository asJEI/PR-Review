import type { RawSummaryAgentResponse } from "@pr-review/shared";

import { createValidator, type ValidationResult } from "./schema-validator.js";

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

export function validateRawSummaryResponse(value: unknown): ValidationResult<RawSummaryAgentResponse> {
  const errors: string[] = [];

  if (!value || typeof value !== "object") {
    return { success: false, errors: ["Response is not a JSON object"] };
  }

  const record = value as Record<string, unknown>;

  if (typeof record.intent !== "string") {
    errors.push("Missing or invalid field: intent (string)");
  } else if (!record.intent.trim()) {
    errors.push("Field intent must not be empty");
  }

  if (!Array.isArray(record.coreChanges)) {
    errors.push("Missing or invalid field: coreChanges (array)");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    value: {
      intent: (record.intent as string).trim(),
      coreChanges: normalizeStringArray(record.coreChanges),
      affectedModules: normalizeStringArray(record.affectedModules),
      infrastructureImpact:
        typeof record.infrastructureImpact === "string"
          ? record.infrastructureImpact.trim() || null
          : null,
      notableRisks: normalizeStringArray(record.notableRisks),
    },
    errors: [],
  };
}

export const summarySchemaValidator = createValidator("summary", validateRawSummaryResponse);
