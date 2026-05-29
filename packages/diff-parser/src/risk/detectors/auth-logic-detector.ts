import type { RiskDetector } from "../interfaces/risk-detector.js";
import type { RiskAnalysisInput, RiskFinding } from "../types.js";
import { maxConfidence, truncateEvidence } from "../utils/confidence.js";
import {
  AUTH_IMPORT_KEYWORDS,
  AUTH_PATH_KEYWORDS,
  AUTH_SYMBOL_KEYWORDS,
} from "../utils/keywords.js";
import {
  importsText,
  pathContainsAny,
  symbolNames,
  textContainsAny,
} from "../utils/line-scan.js";

export class AuthLogicDetector implements RiskDetector {
  readonly id = "authLogicChanged" as const;

  detect(input: RiskAnalysisInput): RiskFinding | null {
    const evidence: string[] = [];
    const scores: number[] = [];

    const pathHit = pathContainsAny(input.filename, AUTH_PATH_KEYWORDS);
    if (pathHit) {
      scores.push(0.65);
      evidence.push(`path contains "${pathHit}"`);
    }

    const symbols = symbolNames(input.semantic).filter((name) =>
      AUTH_SYMBOL_KEYWORDS.some((keyword) =>
        name.toLowerCase().includes(keyword),
      ),
    );

    if (symbols.length > 0) {
      scores.push(0.75);
      evidence.push(`symbols: ${symbols.join(", ")}`);
    }

    const importHit = textContainsAny(
      importsText(input.semantic),
      AUTH_IMPORT_KEYWORDS,
    );

    if (importHit) {
      scores.push(0.85);
      evidence.push(`import: ${importHit}`);
    }

    if (scores.length === 0) {
      return null;
    }

    const matchedSymbols = symbols.length > 0 ? symbols.join(", ") : "n/a";

    return {
      id: this.id,
      message: `Auth-related logic changed in ${input.filename} (symbols: ${matchedSymbols})`,
      confidence: maxConfidence(scores),
      evidence: evidence.map(truncateEvidence),
    };
  }
}
