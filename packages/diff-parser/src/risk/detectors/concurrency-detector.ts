import type { RiskDetector } from "../interfaces/risk-detector.js";
import type { RiskAnalysisInput, RiskFinding } from "../types.js";
import { maxConfidence, truncateEvidence } from "../utils/confidence.js";
import { CONCURRENCY_KEYWORDS } from "../utils/keywords.js";
import {
  joinChangedText,
  pathContainsAny,
  textContainsAny,
} from "../utils/line-scan.js";

export class ConcurrencyDetector implements RiskDetector {
  readonly id = "concurrencyRisk" as const;

  detect(input: RiskAnalysisInput): RiskFinding | null {
    const evidence: string[] = [];
    const scores: number[] = [];

    const pathHit = pathContainsAny(input.filename, CONCURRENCY_KEYWORDS);
    if (pathHit) {
      scores.push(0.75);
      evidence.push(`path contains "${pathHit}"`);
    }

    const changedHit = textContainsAny(
      joinChangedText(input.parsed),
      CONCURRENCY_KEYWORDS,
    );

    if (changedHit) {
      scores.push(0.8);
      evidence.push(`changed line keyword: ${changedHit}`);
    }

    if (input.semantic.asyncChanges && (pathHit || changedHit)) {
      scores.push(0.85);
      evidence.push("async change combined with concurrency keyword");
    }

    if (scores.length === 0) {
      return null;
    }

    return {
      id: this.id,
      message: `Concurrency-related risk in ${input.filename}`,
      confidence: maxConfidence(scores),
      evidence: evidence.map(truncateEvidence),
    };
  }
}
