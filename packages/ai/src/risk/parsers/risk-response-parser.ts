import type {
  RiskCategory,
  RiskConfidenceLabel,
  RiskReviewItem,
  RiskReviewReport,
  RiskSeverity,
  RawRiskAgentItem,
  RawRiskAgentResponse,
} from "@pr-review/shared";

import { extractJson } from "../../utils/extract-json.js";
import { RiskParseError, RiskValidationError, SummaryParseError } from "../../utils/errors.js";
import { parseLocationPaths } from "../../utils/path-grounding.js";

function extractRiskJson(content: string): unknown {
  try {
    return extractJson(content);
  } catch (error) {
    if (error instanceof SummaryParseError) {
      throw new RiskParseError(error.message, error.rawSnippet);
    }
    throw error;
  }
}

const SEVERITIES: RiskSeverity[] = ["critical", "high", "medium", "low"];
const CONFIDENCE_LABELS: RiskConfidenceLabel[] = ["high", "medium", "low"];

export function normalizeRiskCategory(raw: string): RiskCategory {
  const lower = raw.toLowerCase();

  if (/auth|login|jwt|token|session|password|security/.test(lower)) {
    return "authentication";
  }
  if (/async|await|concurr|race|parallel|promise/.test(lower)) {
    return "async/concurrency";
  }
  if (/database|db|sql|query|migration|write|insert|update|delete/.test(lower)) {
    return "database";
  }
  if (/cache|redis|invalidation|memo/.test(lower)) {
    return "cache";
  }
  if (/error.?handling|try.?catch|exception|swallow/.test(lower)) {
    return "error-handling";
  }
  if (/permission|authorize|rbac|acl|role/.test(lower)) {
    return "permissions";
  }

  return "other";
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

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

export function parseRawRiskResponse(content: string): RawRiskAgentResponse {
  const parsed = extractRiskJson(content);

  if (!parsed || typeof parsed !== "object") {
    throw new RiskParseError("LLM response is not a JSON object", content.slice(0, 500));
  }

  const record = parsed as Record<string, unknown>;
  if (!Array.isArray(record.risks)) {
    throw new RiskParseError("LLM response missing risks array", content.slice(0, 500));
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
    throw new RiskParseError("No valid risk items in LLM response", content.slice(0, 500));
  }

  return {
    risks,
    overallRiskLevel: parseSeverity(record.overallRiskLevel),
  };
}

function severityRank(severity: RiskSeverity): number {
  return SEVERITIES.indexOf(severity);
}

function computeOverallRiskLevel(risks: RiskReviewItem[], fallback: RiskSeverity): RiskSeverity {
  if (risks.length === 0) {
    return fallback;
  }
  return risks.reduce(
    (max, risk) => (severityRank(risk.severity) < severityRank(max) ? risk.severity : max),
    risks[0]!.severity,
  );
}

function dedupeKey(item: RiskReviewItem): string {
  const primaryFile = item.affectedFiles[0] ?? "";
  const prefix = item.description.slice(0, 40);
  return `${item.category}|${primaryFile}|${prefix}`;
}

export interface NormalizeRiskOptions {
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  knownPaths: Set<string>;
}

export function rawItemToReviewItem(
  raw: RawRiskAgentItem,
  knownPaths: Set<string>,
): RiskReviewItem {
  const affectedFiles = parseLocationPaths(raw.location).filter((path) =>
    [...knownPaths].some((known) => path === known || known.includes(path) || path.startsWith(known)),
  );

  if (affectedFiles.length === 0 && raw.location.includes("/")) {
    const parsed = parseLocationPaths(raw.location);
    if (parsed.length > 0) {
      affectedFiles.push(parsed[0]!);
    }
  }

  return {
    severity: raw.severity,
    category: normalizeRiskCategory(raw.category),
    description: raw.rationale,
    affectedFiles,
    recommendation: raw.mitigation,
    confidence: raw.confidence,
    confidenceScore: 0,
    reasoning: raw.rationale,
  };
}

export function normalizeToRiskReviewReport(
  raw: RawRiskAgentResponse,
  options: NormalizeRiskOptions,
): RiskReviewReport {
  const items = raw.risks.map((item) => rawItemToReviewItem(item, options.knownPaths));

  const deduped = new Map<string, RiskReviewItem>();
  for (const item of items) {
    deduped.set(dedupeKey(item), item);
  }

  const risks = [...deduped.values()];

  return {
    risks,
    overallRiskLevel: computeOverallRiskLevel(risks, raw.overallRiskLevel),
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

export function parseRiskResponse(content: string, options: NormalizeRiskOptions): RiskReviewReport {
  const raw = parseRawRiskResponse(content);
  const report = normalizeToRiskReviewReport(raw, options);

  if (report.risks.length === 0) {
    throw new RiskValidationError("No risks remained after normalization");
  }

  return report;
}
