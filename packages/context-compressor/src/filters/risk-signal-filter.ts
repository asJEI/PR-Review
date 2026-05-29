import type { CompressionRiskCategory } from "@pr-review/shared";

const RISK_HINT_TO_CATEGORY: Array<{
  pattern: RegExp;
  category: CompressionRiskCategory;
}> = [
  { pattern: /auth/i, category: "authLogicChanged" },
  { pattern: /database|db\b|sql/i, category: "databaseOperationModified" },
  { pattern: /cache|redis/i, category: "cacheLayerTouched" },
  { pattern: /async|await/i, category: "asyncIntroduced" },
  { pattern: /error handling|try\b|catch\b/i, category: "errorHandlingRemoved" },
  { pattern: /concurr|mutex|lock\b/i, category: "concurrencyRisk" },
];

export function inferRiskCategory(hint: string): CompressionRiskCategory | null {
  for (const entry of RISK_HINT_TO_CATEGORY) {
    if (entry.pattern.test(hint)) {
      return entry.category;
    }
  }

  return null;
}

export function isHighPriorityRisk(
  hint: string,
  preserveCategories: CompressionRiskCategory[],
): boolean {
  const category = inferRiskCategory(hint);

  if (!category) {
    return false;
  }

  return preserveCategories.includes(category);
}

export function filterPreservedRiskHints(
  hints: string[],
  preserveCategories: CompressionRiskCategory[],
): string[] {
  const preserved = hints.filter((hint) =>
    isHighPriorityRisk(hint, preserveCategories),
  );

  if (preserved.length > 0) {
    return [...new Set(preserved)];
  }

  return [...new Set(hints)];
}
