import type { CompressionRiskCategory } from "@pr-review/shared";

export interface RiskBoost {
  category: CompressionRiskCategory;
  boost: number;
  reason: string;
}

const RISK_HINT_PATTERNS: Array<{
  pattern: RegExp;
  category: CompressionRiskCategory;
  boost: number;
  reason: string;
}> = [
  { pattern: /auth/i, category: "authLogicChanged", boost: 0.3, reason: "authentication logic modified" },
  { pattern: /database|db\b|sql/i, category: "databaseOperationModified", boost: 0.25, reason: "database operation modified" },
  { pattern: /error handling|try\b|catch\b/i, category: "errorHandlingRemoved", boost: 0.25, reason: "error handling changed" },
  { pattern: /async|await/i, category: "asyncIntroduced", boost: 0.2, reason: "async flow introduced" },
  { pattern: /concurr|mutex|lock\b/i, category: "concurrencyRisk", boost: 0.2, reason: "concurrency-sensitive change" },
  { pattern: /cache|redis/i, category: "cacheLayerTouched", boost: 0.15, reason: "cache layer touched" },
];

export function scoreRiskHints(hints: string[]): RiskBoost[] {
  const boosts: RiskBoost[] = [];
  const seen = new Set<CompressionRiskCategory>();

  for (const hint of hints) {
    for (const rule of RISK_HINT_PATTERNS) {
      if (rule.pattern.test(hint) && !seen.has(rule.category)) {
        seen.add(rule.category);
        boosts.push({
          category: rule.category,
          boost: rule.boost,
          reason: rule.reason,
        });
      }
    }
  }

  return boosts;
}

export function riskHintsForFile(filename: string, allHints: string[]): string[] {
  return allHints.filter((hint) => hint.includes(filename));
}

export function hasAuthAndDbRisk(boosts: RiskBoost[]): boolean {
  const categories = new Set(boosts.map((boost) => boost.category));
  return categories.has("authLogicChanged") && categories.has("databaseOperationModified");
}
