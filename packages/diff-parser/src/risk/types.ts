import type { ParsedFileDiff } from "../types.js";
import type { SemanticAnalysis } from "../semantic/types.js";

export type RiskCategory =
  | "authLogicChanged"
  | "databaseOperationModified"
  | "cacheLayerTouched"
  | "asyncIntroduced"
  | "errorHandlingRemoved"
  | "concurrencyRisk";

export interface RiskFinding {
  id: RiskCategory;
  message: string;
  confidence: number;
  evidence: string[];
}

export interface RiskAnalysisInput {
  filename: string;
  language: string;
  semantic: SemanticAnalysis;
  parsed: ParsedFileDiff;
}

export interface RiskAnalysisResult {
  findings: RiskFinding[];
  riskHints: string[];
}

export const EMPTY_RISK_ANALYSIS: RiskAnalysisResult = {
  findings: [],
  riskHints: [],
};
