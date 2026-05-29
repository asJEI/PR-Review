import type { SymbolChange } from "@pr-review/shared";

export interface SymbolHeuristicMatch {
  boost: number;
  reason: string;
}

const HANDLER_PATTERN =
  /\b(handle|middleware|route|login|auth|permission|verify)\b|^handle/i;
const DB_WRITE_PATTERN = /\b(insert|update|delete|query|write|save)\b/i;
const ASYNC_PATTERN = /\b(async|await|lock|mutex)\b/i;

export function scoreSymbolHeuristics(symbol: SymbolChange): SymbolHeuristicMatch[] {
  const matches: SymbolHeuristicMatch[] = [];

  if (symbol.kind === "function" || symbol.kind === "method") {
    matches.push({ boost: 0.1, reason: "function or method changed" });
  }

  if (HANDLER_PATTERN.test(symbol.name)) {
    matches.push({ boost: 0.15, reason: "handler or auth-related symbol" });
  }

  if (DB_WRITE_PATTERN.test(symbol.name)) {
    matches.push({ boost: 0.15, reason: "database write or query symbol" });
  }

  if (ASYNC_PATTERN.test(symbol.name)) {
    matches.push({ boost: 0.1, reason: "async or concurrency-related symbol" });
  }

  if (!symbol.name.startsWith("_") && !symbol.name.startsWith("test")) {
    matches.push({ boost: 0.05, reason: "likely exported symbol" });
  }

  if (symbol.changeType === "added") {
    matches.push({ boost: 0.05, reason: "newly added symbol" });
  }

  return matches;
}

export function sumSymbolBoost(symbol: SymbolChange): { boost: number; reasons: string[] } {
  const matches = scoreSymbolHeuristics(symbol);

  return {
    boost: matches.reduce((sum, match) => sum + match.boost, 0),
    reasons: matches.map((match) => match.reason),
  };
}
