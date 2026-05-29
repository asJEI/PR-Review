import type { SymbolChange } from "@pr-review/shared";

import type { ExtractedSignal } from "../pipeline/types.js";

const AUTH_SYMBOLS = /\b(login|logout|auth|token|jwt|session|permission|password)\b/i;
const CACHE_SYMBOLS = /\b(cache|redis|invalidate|memo)\b/i;
const DB_SYMBOLS = /\b(db|database|query|sql|write|insert|update|delete)\b/i;

export function extractSemanticSignals(
  symbols: SymbolChange[],
): ExtractedSignal[] {
  const signals: ExtractedSignal[] = [];

  for (const symbol of symbols) {
    const name = symbol.name;

    if (AUTH_SYMBOLS.test(name)) {
      signals.push({
        kind: "semantic",
        label: `Auth-related symbol: ${name}`,
        weight: 15,
        category: "authLogicChanged",
      });
    }

    if (CACHE_SYMBOLS.test(name)) {
      signals.push({
        kind: "semantic",
        label: `Cache-related symbol: ${name}`,
        weight: 12,
        category: "cacheLayerTouched",
      });
    }

    if (DB_SYMBOLS.test(name)) {
      signals.push({
        kind: "semantic",
        label: `Database-related symbol: ${name}`,
        weight: 12,
        category: "databaseOperationModified",
      });
    }
  }

  return signals;
}
