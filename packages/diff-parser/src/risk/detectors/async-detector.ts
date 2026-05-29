import type { RiskDetector } from "../interfaces/risk-detector.js";
import type { RiskAnalysisInput, RiskFinding } from "../types.js";
import { truncateEvidence } from "../utils/confidence.js";
import { collectChangedLines } from "../utils/line-scan.js";

export class AsyncDetector implements RiskDetector {
  readonly id = "asyncIntroduced" as const;

  detect(input: RiskAnalysisInput): RiskFinding | null {
    const evidence: string[] = [];

    if (input.semantic.asyncChanges) {
      evidence.push("semantic.asyncChanges=true");
    }

    const asyncAdds = collectChangedLines(input.parsed).filter(
      (line) =>
        line.side === "add" &&
        (/\basync\s+function\b/.test(line.content) ||
          /\basync\s+def\b/.test(line.content) ||
          /\basync\s+\w+\s*\(/.test(line.content)),
    );

    if (asyncAdds.length > 0) {
      evidence.push(`async additions: ${asyncAdds.length}`);
    }

    if (evidence.length === 0) {
      return null;
    }

    return {
      id: this.id,
      message: `Async behavior introduced in ${input.filename}`,
      confidence: 0.9,
      evidence: evidence.map(truncateEvidence),
    };
  }
}
