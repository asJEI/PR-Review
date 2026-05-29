import type { DiffLine } from "../../types.js";
import type { RiskDetector } from "../interfaces/risk-detector.js";
import type { RiskAnalysisInput, RiskFinding } from "../types.js";
import { truncateEvidence } from "../utils/confidence.js";
import { ERROR_HANDLING_KEYWORDS } from "../utils/keywords.js";
import { textContainsAny } from "../utils/line-scan.js";

export class ErrorHandlingDetector implements RiskDetector {
  readonly id = "errorHandlingRemoved" as const;

  detect(input: RiskAnalysisInput): RiskFinding | null {
    const evidence: string[] = [];

    for (const hunk of input.parsed.hunks) {
      const deleted = hunk.lines.filter(
        (line: DiffLine) => line.type === "delete",
      );
      const added = hunk.lines.filter((line: DiffLine) => line.type === "add");

      for (const line of deleted) {
        const keyword = textContainsAny(line.content, ERROR_HANDLING_KEYWORDS);

        if (!keyword) {
          continue;
        }

        const reAdded = added.some((addLine: DiffLine) =>
          textContainsAny(addLine.content, [keyword]),
        );

        if (!reAdded) {
          evidence.push(`removed ${keyword}: ${line.content.trim()}`);
        }
      }
    }

    if (evidence.length === 0) {
      return null;
    }

    return {
      id: this.id,
      message: `Error handling removed in ${input.filename}`,
      confidence: 0.7,
      evidence: evidence.map(truncateEvidence),
    };
  }
}
