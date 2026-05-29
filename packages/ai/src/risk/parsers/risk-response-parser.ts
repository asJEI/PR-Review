import type {
  RiskCategory,
  RiskReviewItem,
  RiskReviewReport,
  RiskSeverity,
  RawRiskAgentItem,
  RawRiskAgentResponse,
} from "@pr-review/shared";

import { riskSchemaValidator } from "../../providers/schema/risk-schema.js";
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

export function parseRawRiskResponse(content: string): RawRiskAgentResponse {
  const parsed = extractRiskJson(content);
  const validation = riskSchemaValidator.validate(parsed);

  if (!validation.success || !validation.value) {
    throw new RiskParseError(
      validation.errors.join("; ") || "LLM response missing risks array",
      content.slice(0, 500),
    );
  }

  return validation.value;
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
  latencyMs?: number;
  estimatedCostUsd?: number;
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
      latencyMs: options.latencyMs,
      estimatedCostUsd: options.estimatedCostUsd,
      filteredCount: 0,
      groundingWarnings: [],
    },
  };
}

export function parseRiskResponse(
  contentOrRaw: string | RawRiskAgentResponse,
  options: NormalizeRiskOptions,
): RiskReviewReport {
  const raw =
    typeof contentOrRaw === "string" ? parseRawRiskResponse(contentOrRaw) : contentOrRaw;
  const report = normalizeToRiskReviewReport(raw, options);

  if (report.risks.length === 0) {
    throw new RiskValidationError("No risks remained after normalization");
  }

  return report;
}
