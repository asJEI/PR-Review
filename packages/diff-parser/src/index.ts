export { getChangedLines, parseUnifiedDiff } from "./parse-unified-diff.js";
export {
  analyzeRisk,
  parseAnalyzeAndAssessRisk,
} from "./risk/analyze-risk.js";
export type {
  AnalyzeRiskOptions,
  ParseAnalyzeAndAssessRiskOptions,
  ParsedFileDiffWithSemanticAndRisk,
} from "./risk/analyze-risk.js";
export {
  analyzeSemantics,
  parseAndAnalyze,
} from "./semantic/analyze-semantics.js";
export type { AnalyzeSemanticsOptions, ParsedFileDiffWithSemantic } from "./semantic/analyze-semantics.js";
export { detectLanguage } from "./semantic/detect-language.js";
export { RegexSemanticExtractor } from "./semantic/regex-semantic-extractor.js";
export { createDefaultDetectors, DEFAULT_MIN_CONFIDENCE } from "./risk/engine/run-detectors.js";
export type { SemanticExtractor } from "./semantic/interfaces/semantic-extractor.js";
export type { RiskDetector } from "./risk/interfaces/risk-detector.js";
export type {
  DiffHunk,
  DiffLine,
  DiffLineType,
  ParsedFileDiff,
} from "./types.js";
export type {
  ModuleChanges,
  SemanticAnalysis,
  SemanticChangeType,
  SemanticClass,
  SemanticFunction,
  SemanticInterface,
} from "./semantic/types.js";
export type {
  RiskAnalysisInput,
  RiskAnalysisResult,
  RiskCategory,
  RiskFinding,
} from "./risk/types.js";
export { EMPTY_RISK_ANALYSIS } from "./risk/types.js";
export { EMPTY_SEMANTIC_ANALYSIS } from "./semantic/types.js";
