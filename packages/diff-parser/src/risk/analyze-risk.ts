import { parseUnifiedDiff } from "../parse-unified-diff.js";
import type { ParsedFileDiff } from "../types.js";
import { analyzeSemantics } from "../semantic/analyze-semantics.js";
import type { AnalyzeSemanticsOptions } from "../semantic/analyze-semantics.js";
import { detectLanguage } from "../semantic/detect-language.js";
import {
  DEFAULT_MIN_CONFIDENCE,
  runRiskDetectors,
} from "./engine/run-detectors.js";
import type { RiskDetector } from "./interfaces/risk-detector.js";
import {
  EMPTY_RISK_ANALYSIS,
  type RiskAnalysisInput,
  type RiskAnalysisResult,
} from "./types.js";

export interface AnalyzeRiskOptions {
  minConfidence?: number;
  detectors?: RiskDetector[];
}

export function analyzeRisk(
  input: RiskAnalysisInput,
  options: AnalyzeRiskOptions = {},
): RiskAnalysisResult {
  if (input.parsed.isEmpty) {
    return { ...EMPTY_RISK_ANALYSIS };
  }

  return runRiskDetectors(input, {
    minConfidence: options.minConfidence ?? DEFAULT_MIN_CONFIDENCE,
    detectors: options.detectors,
  });
}

export interface ParseAnalyzeAndAssessRiskOptions extends AnalyzeSemanticsOptions {
  minConfidence?: number;
  detectors?: RiskDetector[];
}

export interface ParsedFileDiffWithSemanticAndRisk extends ParsedFileDiff {
  semantic: ReturnType<typeof analyzeSemantics>;
  risk: RiskAnalysisResult;
}

/** Parses patch, runs semantic + risk analysis in one step. */
export function parseAnalyzeAndAssessRisk(
  filename: string,
  patch: string | null,
  options: ParseAnalyzeAndAssessRiskOptions = {},
): ParsedFileDiffWithSemanticAndRisk {
  const language = options.language ?? detectLanguage(filename);
  const parsed = parseUnifiedDiff(filename, patch);
  const semantic = analyzeSemantics(parsed, { ...options, language });

  const risk = analyzeRisk(
    { filename, language, semantic, parsed },
    {
      minConfidence: options.minConfidence,
      detectors: options.detectors,
    },
  );

  return { ...parsed, semantic, risk };
}
