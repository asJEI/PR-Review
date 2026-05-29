import type { LogicChangeSummary, SymbolChange } from "@pr-review/shared";

import { inferRiskCategory } from "../filters/risk-signal-filter.js";
import type { ExtractedSignal } from "../pipeline/types.js";

const WHY_TEMPLATES: Record<string, string> = {
  authLogicChanged: "Touches authentication path; review token/session handling",
  databaseOperationModified: "May affect data integrity or query behavior",
  cacheLayerTouched: "May affect cache consistency or invalidation timing",
  asyncIntroduced: "Async flow change may affect ordering and error propagation",
  errorHandlingRemoved: "Error handling removal increases failure blast radius",
  concurrencyRisk: "Concurrency change may introduce race conditions",
};

function riskSignalsForSymbol(
  symbol: SymbolChange,
  moduleRiskHints: string[],
  signals: ExtractedSignal[],
): string[] {
  const matched = moduleRiskHints.filter((hint) =>
    hint.toLowerCase().includes(symbol.name.toLowerCase()),
  );

  if (matched.length > 0) {
    return matched;
  }

  return signals
    .filter((signal) => signal.kind === "risk" || signal.kind === "semantic")
    .map((signal) => signal.label)
    .slice(0, 2);
}

function buildWhyItMatters(
  symbol: SymbolChange,
  signals: ExtractedSignal[],
  relatedFiles: string[],
): string {
  const categories = signals
    .map((signal) => signal.category)
    .filter((category): category is string => Boolean(category));

  for (const category of categories) {
    const template = WHY_TEMPLATES[category];

    if (template) {
      return template;
    }
  }

  const authPath = relatedFiles.some((file) => /auth/i.test(file));

  if (authPath || /login|auth|token|jwt/i.test(symbol.name)) {
    return WHY_TEMPLATES.authLogicChanged ?? "Review for security regressions";
  }

  return "Review behavioral impact on callers and edge cases";
}

export function buildLogicChanges(
  affectedFunctions: SymbolChange[],
  moduleRiskHints: string[],
  signals: ExtractedSignal[],
  relatedFiles: string[],
): LogicChangeSummary[] {
  return affectedFunctions.map((symbol) => ({
    symbol: symbol.name,
    kind: symbol.kind,
    changeType: symbol.changeType,
    whatChanged: `${capitalize(symbol.changeType)} ${symbol.kind} ${symbol.name}`,
    whyItMatters: buildWhyItMatters(symbol, signals, relatedFiles),
    riskSignals: riskSignalsForSymbol(symbol, moduleRiskHints, signals),
  }));
}

export function buildLogicChangesFromSymbols(
  symbols: SymbolChange[],
  moduleRiskHints: string[],
  signals: ExtractedSignal[],
  relatedFiles: string[],
): LogicChangeSummary[] {
  const functions = symbols.filter((symbol) =>
    ["function", "method"].includes(symbol.kind),
  );

  if (functions.length > 0) {
    return buildLogicChanges(functions, moduleRiskHints, signals, relatedFiles);
  }

  return symbols.slice(0, 5).map((symbol) => ({
    symbol: symbol.name,
    kind: symbol.kind,
    changeType: symbol.changeType,
    whatChanged: `${capitalize(symbol.changeType)} ${symbol.kind} ${symbol.name}`,
    whyItMatters: buildWhyItMatters(symbol, signals, relatedFiles),
    riskSignals: riskSignalsForSymbol(symbol, moduleRiskHints, signals),
  }));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function dominantRiskFromHints(hints: string[]): string | null {
  for (const hint of hints) {
    const category = inferRiskCategory(hint);

    if (category) {
      return category;
    }
  }

  return null;
}
