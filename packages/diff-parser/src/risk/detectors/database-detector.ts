import type { RiskDetector } from "../interfaces/risk-detector.js";
import type { RiskAnalysisInput, RiskFinding } from "../types.js";
import { maxConfidence, truncateEvidence } from "../utils/confidence.js";
import { DATABASE_KEYWORDS, DATABASE_PATH_KEYWORDS } from "../utils/keywords.js";
import {
  importsText,
  joinChangedText,
  pathContainsAny,
  textContainsAny,
} from "../utils/line-scan.js";

export class DatabaseDetector implements RiskDetector {
  readonly id = "databaseOperationModified" as const;

  detect(input: RiskAnalysisInput): RiskFinding | null {
    const evidence: string[] = [];
    const scores: number[] = [];

    const pathHit = pathContainsAny(input.filename, DATABASE_PATH_KEYWORDS);
    if (pathHit) {
      scores.push(0.7);
      evidence.push(`path contains "${pathHit}"`);
    }

    const changedHit = textContainsAny(
      joinChangedText(input.parsed),
      DATABASE_KEYWORDS,
    );

    if (changedHit) {
      scores.push(0.8);
      evidence.push(`changed line keyword: ${changedHit}`);
    }

    const importHit = textContainsAny(importsText(input.semantic), DATABASE_KEYWORDS);
    if (importHit) {
      scores.push(0.8);
      evidence.push(`import keyword: ${importHit}`);
    }

    if (scores.length === 0) {
      return null;
    }

    return {
      id: this.id,
      message: `Database-related change detected in ${input.filename}`,
      confidence: maxConfidence(scores),
      evidence: evidence.map(truncateEvidence),
    };
  }
}
