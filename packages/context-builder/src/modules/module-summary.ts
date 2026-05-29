import type { ChangeGroup, SymbolChange } from "@pr-review/shared";

function keySymbols(symbols: SymbolChange[], limit = 5): string[] {
  const priority = new Set(["function", "method", "class"]);

  return symbols
    .filter((symbol) => priority.has(symbol.kind))
    .slice(0, limit)
    .map((symbol) => symbol.name);
}

/** Deterministic one-paragraph module summary (no LLM). */
export function buildModuleSummary(
  moduleName: string,
  group: ChangeGroup,
  symbols: SymbolChange[],
  internalDeps: number,
  riskHints: string[],
): string {
  const fileCount = group.files.length;
  const keys = keySymbols(symbols);
  const symbolPart =
    keys.length > 0 ? `; key symbols ${keys.join(", ")}` : "";
  const depPart =
    internalDeps > 0 ? `; ${internalDeps} internal dependency edge(s)` : "";
  const riskPart =
    riskHints.length > 0
      ? `; risks: ${riskHints.slice(0, 2).join("; ")}`
      : "";

  return `${moduleName}: ${fileCount} file(s) changed${symbolPart}${depPart}${riskPart}.`;
}
