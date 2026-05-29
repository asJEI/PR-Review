import type {
  CompressedReviewContext,
  RelevanceReport,
  ReviewContext,
  RiskReviewItem,
  RiskReviewReport,
} from "@pr-review/shared";

import {
  collectKnownPaths,
  extractFileLikeTokens,
  filterKnownFiles,
  isKnownReference,
  parseLocationPaths,
} from "../../utils/path-grounding.js";

const STYLE_CATEGORIES = [/style/i, /lint/i, /format/i, /naming/i];

export interface RiskGroundingResult {
  warnings: string[];
  unknownFiles: string[];
  groundedRisks: RiskReviewItem[];
}

function isStyleRisk(item: RiskReviewItem): boolean {
  const text = `${item.category} ${item.description}`;
  return STYLE_CATEGORIES.some((pattern) => pattern.test(text));
}

function isGroundedByModule(item: RiskReviewItem, known: Set<string>): boolean {
  for (const system of [item.category, ...item.affectedFiles]) {
    if (isKnownReference(system, known)) {
      return true;
    }
  }
  return item.affectedFiles.length > 0;
}

export function validateRiskGrounding(
  report: RiskReviewReport,
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  reviewContext?: ReviewContext,
): RiskGroundingResult {
  const warnings: string[] = [];
  const unknownFiles = new Set<string>();
  const known = collectKnownPaths(compressedContext, relevanceReport, reviewContext);
  const groundedRisks: RiskReviewItem[] = [];

  for (const risk of report.risks) {
    if (isStyleRisk(risk)) {
      warnings.push(`Filtered style/lint risk: ${risk.description.slice(0, 60)}`);
      continue;
    }

    const textToScan = `${risk.description} ${risk.reasoning} ${risk.affectedFiles.join(" ")}`;
    for (const token of extractFileLikeTokens(textToScan)) {
      if (!isKnownReference(token, known)) {
        unknownFiles.add(token);
        warnings.push(`Unverified file reference in risk: ${token}`);
      }
    }

    const verifiedFiles = filterKnownFiles(
      risk.affectedFiles.length > 0 ? risk.affectedFiles : parseLocationPaths(risk.reasoning),
      known,
    );

    const groundedItem: RiskReviewItem = {
      ...risk,
      affectedFiles: verifiedFiles,
    };

    if (!isGroundedByModule(groundedItem, known) && verifiedFiles.length === 0) {
      warnings.push(`Ungrounded risk removed: ${risk.description.slice(0, 80)}`);
      continue;
    }

    groundedRisks.push(groundedItem);
  }

  return {
    warnings,
    unknownFiles: [...unknownFiles],
    groundedRisks,
  };
}
