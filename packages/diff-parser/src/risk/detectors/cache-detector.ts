import type { RiskDetector } from "../interfaces/risk-detector.js";
import type { RiskAnalysisInput, RiskFinding } from "../types.js";
import { maxConfidence, truncateEvidence } from "../utils/confidence.js";
import { CACHE_KEYWORDS } from "../utils/keywords.js";
import {
  importsText,
  joinChangedText,
  pathContainsAny,
  textContainsAny,
} from "../utils/line-scan.js";

export class CacheDetector implements RiskDetector {
  readonly id = "cacheLayerTouched" as const;

  detect(input: RiskAnalysisInput): RiskFinding | null {
    const evidence: string[] = [];
    const scores: number[] = [];

    const pathHit = pathContainsAny(input.filename, CACHE_KEYWORDS);
    if (pathHit) {
      scores.push(0.75);
      evidence.push(`path contains "${pathHit}"`);
    }

    const changedHit = textContainsAny(joinChangedText(input.parsed), CACHE_KEYWORDS);
    if (changedHit) {
      scores.push(0.75);
      evidence.push(`changed line keyword: ${changedHit}`);
    }

    const importHit = textContainsAny(importsText(input.semantic), CACHE_KEYWORDS);
    if (importHit) {
      scores.push(0.75);
      evidence.push(`import keyword: ${importHit}`);
    }

    if (scores.length === 0) {
      return null;
    }

    return {
      id: this.id,
      message: `Cache layer touched in ${input.filename}`,
      confidence: maxConfidence(scores),
      evidence: evidence.map(truncateEvidence),
    };
  }
}
