import type {
  RawRiskAgentItem,
  RawRiskAgentResponse,
  RiskConfidenceLabel,
  RiskSeverity,
} from "@pr-review/shared";

import { createValidator, type ValidationResult } from "./schema-validator.js";

const SEVERITIES: RiskSeverity[] = ["critical", "high", "medium", "low"];
const CONFIDENCE_LABELS: RiskConfidenceLabel[] = ["high", "medium", "low"];

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseSeverity(value: unknown): RiskSeverity {
  if (typeof value === "string" && SEVERITIES.includes(value as RiskSeverity)) {
    return value as RiskSeverity;
  }
  return "medium";
}

function parseConfidence(value: unknown): RiskConfidenceLabel {
  if (typeof value === "string" && CONFIDENCE_LABELS.includes(value as RiskConfidenceLabel)) {
    return value as RiskConfidenceLabel;
  }
  return "medium";
}

function isRawRiskAgentItem(value: unknown): value is RawRiskAgentItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.category === "string" &&
    typeof record.location === "string" &&
    typeof record.rationale === "string" &&
    typeof record.mitigation === "string"
  );
}

export function validateRawRiskResponse(value: unknown): ValidationResult<RawRiskAgentResponse> {
  if (!value || typeof value !== "object") {
    return { success: false, errors: ["Response is not a JSON object"] };
  }

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.risks)) {
    return { success: false, errors: ["Missing or invalid field: risks (array)"] };
  }

  const risks: RawRiskAgentItem[] = [];
  for (const item of record.risks) {
    if (!isRawRiskAgentItem(item)) {
      continue;
    }
    const rationale = normalizeString(item.rationale);
    const mitigation = normalizeString(item.mitigation);
    if (!rationale || !mitigation) {
      continue;
    }
    risks.push({
      category: normalizeString(item.category),
      location: normalizeString(item.location),
      severity: parseSeverity(item.severity),
      rationale,
      mitigation,
      confidence: parseConfidence(item.confidence),
    });
  }

  if (risks.length === 0) {
    return { success: false, errors: ["No valid risk items in response"] };
  }

  return {
    success: true,
    value: {
      risks,
      overallRiskLevel: parseSeverity(record.overallRiskLevel),
    },
    errors: [],
  };
}

export const riskSchemaValidator = createValidator("risk", validateRawRiskResponse);
