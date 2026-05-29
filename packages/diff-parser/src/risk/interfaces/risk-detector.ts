import type { RiskCategory } from "../types.js";
import type { RiskAnalysisInput, RiskFinding } from "../types.js";

/** Pluggable risk detector (rule-based MVP; extensible later). */
export interface RiskDetector {
  readonly id: RiskCategory;
  detect(input: RiskAnalysisInput): RiskFinding | null;
}
