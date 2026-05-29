import type {
  CompressedReviewContext,
  PrSummary,
  RawSummaryAgentResponse,
  RelevanceReport,
} from "@pr-review/shared";

import { extractJson } from "../../utils/extract-json.js";
import { SummaryParseError, SummaryValidationError } from "../../utils/errors.js";

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

function isRawSummaryAgentResponse(value: unknown): value is RawSummaryAgentResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.intent === "string" && Array.isArray(record.coreChanges);
}

export function parseRawSummaryResponse(content: string): RawSummaryAgentResponse {
  const parsed = extractJson(content);

  if (!isRawSummaryAgentResponse(parsed)) {
    throw new SummaryParseError(
      "LLM response missing required fields: intent, coreChanges",
      content.slice(0, 500),
    );
  }

  const intent = parsed.intent.trim();
  if (!intent) {
    throw new SummaryValidationError("Summary intent is empty after parsing");
  }

  return {
    intent,
    coreChanges: normalizeStringArray(parsed.coreChanges),
    affectedModules: normalizeStringArray(parsed.affectedModules),
    infrastructureImpact:
      typeof parsed.infrastructureImpact === "string"
        ? parsed.infrastructureImpact.trim() || null
        : null,
    notableRisks: normalizeStringArray(parsed.notableRisks),
  };
}

function reorderAffectedModules(
  modules: string[],
  relevanceReport: RelevanceReport,
): string[] {
  const scoreByModule = new Map(
    relevanceReport.modules.map((entry) => [entry.module, entry.relevanceScore]),
  );

  return [...modules].sort((left, right) => {
    const leftScore = scoreByModule.get(left) ?? 0;
    const rightScore = scoreByModule.get(right) ?? 0;
    return rightScore - leftScore;
  });
}

function buildArchitecturalImpact(
  raw: RawSummaryAgentResponse,
  compressedContext: CompressedReviewContext,
): string {
  const parts: string[] = [];

  if (raw.infrastructureImpact) {
    parts.push(raw.infrastructureImpact);
  }

  for (const module of compressedContext.modules) {
    for (const impact of module.architecturalImpact.slice(0, 2)) {
      parts.push(`[${module.module}] ${impact}`);
    }
  }

  const unique = [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
  return unique.join("; ") || "No explicit architectural impact identified.";
}

export interface NormalizeSummaryOptions {
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  groundingWarnings?: string[];
}

export function normalizeToPrSummary(
  raw: RawSummaryAgentResponse,
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  options: NormalizeSummaryOptions,
): PrSummary {
  const keyChanges = raw.coreChanges;
  if (keyChanges.length === 0) {
    throw new SummaryValidationError("Summary has no key changes after parsing");
  }

  return {
    title: compressedContext.metadata.title,
    summary: raw.intent,
    keyChanges,
    affectedSystems: reorderAffectedModules(raw.affectedModules, relevanceReport),
    architecturalImpact: buildArchitecturalImpact(raw, compressedContext),
    generatedAt: new Date().toISOString(),
    meta: {
      provider: options.provider,
      model: options.model,
      promptTokens: options.usage?.promptTokens,
      completionTokens: options.usage?.completionTokens,
      totalTokens: options.usage?.totalTokens,
      groundingWarnings: options.groundingWarnings ?? [],
    },
  };
}

export function parseSummaryResponse(
  content: string,
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  options: NormalizeSummaryOptions,
): PrSummary {
  const raw = parseRawSummaryResponse(content);
  return normalizeToPrSummary(raw, compressedContext, relevanceReport, options);
}
