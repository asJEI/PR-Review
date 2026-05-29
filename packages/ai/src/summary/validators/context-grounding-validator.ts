import type {
  CompressedReviewContext,
  PrSummary,
  RelevanceReport,
  ReviewContext,
} from "@pr-review/shared";

import {
  collectKnownPaths,
  extractFileLikeTokens,
  isKnownReference,
} from "../../utils/path-grounding.js";

const GENERIC_PHRASES = [
  /this pr makes changes/i,
  /various improvements/i,
  /general updates/i,
  /minor changes/i,
  /some modifications/i,
];

export interface GroundingResult {
  warnings: string[];
}

export function validateSummaryGrounding(
  summary: PrSummary,
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  reviewContext?: ReviewContext,
): GroundingResult {
  const warnings: string[] = [];
  const known = collectKnownPaths(compressedContext, relevanceReport, reviewContext);

  const textToScan = [
    summary.summary,
    ...summary.keyChanges,
    ...summary.affectedSystems,
    summary.architecturalImpact,
  ].join("\n");

  for (const phrase of GENERIC_PHRASES) {
    if (phrase.test(textToScan)) {
      warnings.push(`Generic phrasing detected: "${phrase.source}"`);
    }
  }

  for (const token of extractFileLikeTokens(textToScan)) {
    if (!isKnownReference(token, known)) {
      warnings.push(`Unverified file reference in summary: ${token}`);
    }
  }

  for (const system of summary.affectedSystems) {
    if (!isKnownReference(system, known) && !system.includes("/")) {
      warnings.push(`Unverified affected system/module: ${system}`);
    }
  }

  return { warnings };
}
