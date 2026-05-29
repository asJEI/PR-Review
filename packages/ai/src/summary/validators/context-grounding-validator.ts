import type {
  CompressedReviewContext,
  PrSummary,
  RelevanceReport,
  ReviewContext,
} from "@pr-review/shared";

const FILE_PATH_PATTERN = /(?:^|[\s(])((?:[\w.-]+\/)+[\w.-]+\.\w{1,8})(?:[\s),]|$)/g;
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

function collectKnownPaths(
  compressedContext: CompressedReviewContext,
  relevanceReport: RelevanceReport,
  reviewContext?: ReviewContext,
): Set<string> {
  const known = new Set<string>();

  for (const file of relevanceReport.rankedFileOrder) {
    known.add(file);
  }

  for (const module of compressedContext.modules) {
    known.add(module.module);
    for (const fn of module.affectedFunctions) {
      known.add(`${module.module}::${fn.name}`);
    }
    for (const dep of module.expandedDependencies) {
      known.add(dep);
    }
  }

  if (reviewContext) {
    for (const file of reviewContext.files) {
      known.add(file.filename);
    }
    for (const area of reviewContext.semanticSummary.primaryAreas) {
      known.add(area);
    }
  }

  return known;
}

function extractFileLikeTokens(text: string): string[] {
  const matches: string[] = [];
  for (const match of text.matchAll(FILE_PATH_PATTERN)) {
    const path = match[1];
    if (path) {
      matches.push(path);
    }
  }
  return matches;
}

function isKnownReference(reference: string, known: Set<string>): boolean {
  if (known.has(reference)) {
    return true;
  }

  for (const entry of known) {
    if (reference.startsWith(entry) || entry.includes(reference)) {
      return true;
    }
  }

  return false;
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
