import type {
  CompressedReviewContext,
  PrSummary,
  RawSummaryAgentResponse,
  RelevanceReport,
} from "@pr-review/shared";

import { summarySchemaValidator } from "../../providers/schema/summary-schema.js";
import { extractJson } from "../../utils/extract-json.js";
import { SummaryParseError, SummaryValidationError } from "../../utils/errors.js";

export function parseRawSummaryResponse(content: string): RawSummaryAgentResponse {
  const parsed = extractJson(content);
  const validation = summarySchemaValidator.validate(parsed);

  if (!validation.success || !validation.value) {
    throw new SummaryParseError(
      validation.errors.join("; ") || "LLM response missing required summary fields",
      content.slice(0, 500),
    );
  }

  return validation.value;
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
  latencyMs?: number;
  estimatedCostUsd?: number;
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
      latencyMs: options.latencyMs,
      estimatedCostUsd: options.estimatedCostUsd,
      groundingWarnings: options.groundingWarnings ?? [],
    },
  };
}

export function parseSummaryResponse(
  contentOrRaw: string | RawSummaryAgentResponse,
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  options: NormalizeSummaryOptions,
): PrSummary {
  const raw =
    typeof contentOrRaw === "string" ? parseRawSummaryResponse(contentOrRaw) : contentOrRaw;
  return normalizeToPrSummary(raw, compressedContext, relevanceReport, options);
}
