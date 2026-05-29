import type { RiskReviewReport, RiskReviewGeneratorInput } from "@pr-review/shared";

import { collectKnownPaths } from "../../utils/path-grounding.js";
import { normalizeToRiskReviewReport } from "../parsers/risk-response-parser.js";
import {
  applyConfidenceScoring,
  filterRisksByConfidence,
} from "../scoring/confidence-scorer.js";
import { validateRiskGrounding } from "../validators/risk-grounding-validator.js";
import { initRiskState } from "./init-risk-state.js";
import type { RiskReviewGeneratorOptions } from "./defaults.js";

export async function runRiskPipeline(
  input: RiskReviewGeneratorInput,
  options?: RiskReviewGeneratorOptions,
): Promise<RiskReviewReport> {
  const state = initRiskState(input, options);
  const knownPaths = collectKnownPaths(
    input.compressedContext,
    input.relevanceReport,
    input.reviewContext,
  );

  const llmResult = await state.llmClient.generateRiskReview(input.riskPrompt, {
    model: state.options.model,
    temperature: state.options.temperature,
  });

  const baseMeta = {
    provider: llmResult.provider,
    model: llmResult.model,
    usage: llmResult.usage,
    latencyMs: llmResult.latencyMs,
    estimatedCostUsd: llmResult.usage.estimatedCostUsd,
    knownPaths,
  };

  let report = normalizeToRiskReviewReport(llmResult.result, baseMeta);

  const grounding = validateRiskGrounding(
    report,
    input.compressedContext,
    input.relevanceReport,
    input.reviewContext,
  );

  report = {
    ...report,
    risks: grounding.groundedRisks,
    meta: {
      ...report.meta,
      groundingWarnings: grounding.warnings,
    },
  };

  report = applyConfidenceScoring(report, {
    compressedContext: input.compressedContext,
    relevanceReport: input.relevanceReport,
    reviewContext: input.reviewContext,
    knownPaths,
    unknownFiles: grounding.unknownFiles,
  });

  const filtered = filterRisksByConfidence(report, {
    minConfidenceScore: state.options.minConfidenceScore,
    includeMediumConfidence: state.options.includeMediumConfidence,
  });

  state.report = {
    ...filtered.report,
    meta: {
      ...filtered.report.meta,
      filteredCount: filtered.filteredCount,
      groundingWarnings: [...report.meta.groundingWarnings],
    },
  };

  return state.report;
}
