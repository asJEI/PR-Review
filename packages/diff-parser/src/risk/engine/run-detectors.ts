import { AsyncDetector } from "../detectors/async-detector.js";
import { AuthLogicDetector } from "../detectors/auth-logic-detector.js";
import { CacheDetector } from "../detectors/cache-detector.js";
import { ConcurrencyDetector } from "../detectors/concurrency-detector.js";
import { DatabaseDetector } from "../detectors/database-detector.js";
import { ErrorHandlingDetector } from "../detectors/error-handling-detector.js";
import type { RiskDetector } from "../interfaces/risk-detector.js";
import type {
  RiskAnalysisInput,
  RiskAnalysisResult,
  RiskFinding,
} from "../types.js";
import { clampConfidence } from "../utils/confidence.js";

export const DEFAULT_MIN_CONFIDENCE = 0.6;

export function createDefaultDetectors(): RiskDetector[] {
  return [
    new AuthLogicDetector(),
    new DatabaseDetector(),
    new CacheDetector(),
    new AsyncDetector(),
    new ErrorHandlingDetector(),
    new ConcurrencyDetector(),
  ];
}

export interface RunRiskDetectorsOptions {
  minConfidence?: number;
  detectors?: RiskDetector[];
}

function dedupeFindings(findings: RiskFinding[]): RiskFinding[] {
  const byId = new Map<string, RiskFinding>();

  for (const finding of findings) {
    const existing = byId.get(finding.id);

    if (!existing || finding.confidence > existing.confidence) {
      byId.set(finding.id, finding);
    }
  }

  return [...byId.values()].sort((a, b) => b.confidence - a.confidence);
}

export function runRiskDetectors(
  input: RiskAnalysisInput,
  options: RunRiskDetectorsOptions = {},
): RiskAnalysisResult {
  const minConfidence = clampConfidence(
    options.minConfidence ?? DEFAULT_MIN_CONFIDENCE,
  );
  const detectors = options.detectors ?? createDefaultDetectors();

  const findings = dedupeFindings(
    detectors
      .map((detector) => detector.detect(input))
      .filter((finding): finding is RiskFinding => finding !== null),
  );

  const riskHints = findings
    .filter((finding) => finding.confidence >= minConfidence)
    .map((finding) => finding.message);

  return {
    findings,
    riskHints: [...new Set(riskHints)],
  };
}
