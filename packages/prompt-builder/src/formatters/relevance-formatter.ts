import type {
  ContextBudgetAllocation,
  FileRelevanceScore,
  SymbolRelevanceScore,
} from "@pr-review/shared";

import { meetsMinPriority } from "../pipeline/defaults.js";
import type { ResolvedPromptBuildOptions } from "../pipeline/defaults.js";

function formatFileLine(file: FileRelevanceScore): string {
  const reasons =
    file.reasons.length > 0 ? ` — ${file.reasons.slice(0, 3).join("; ")}` : "";
  return `[${file.priority}] ${file.file} (score: ${file.relevanceScore.toFixed(2)}, tokens: ${file.suggestedContextTokens})${reasons}`;
}

function formatSymbolLine(symbol: SymbolRelevanceScore): string {
  const reasons =
    symbol.reasons.length > 0 ? ` — ${symbol.reasons.slice(0, 3).join("; ")}` : "";
  return `[${symbol.priority}] ${symbol.file}::${symbol.symbol} (${symbol.kind}, ${symbol.changeType}, score: ${symbol.relevanceScore.toFixed(2)})${reasons}`;
}

export function formatRankedFiles(
  rankedFileOrder: string[],
  fileScores: Map<string, FileRelevanceScore>,
  options: ResolvedPromptBuildOptions,
  budget?: ContextBudgetAllocation,
): string {
  const maxFiles = budget?.fileAllocations.length ?? rankedFileOrder.length;
  const lines: string[] = ["Priority file review order:"];

  let count = 0;
  for (const filePath of rankedFileOrder) {
    if (count >= maxFiles) {
      break;
    }

    const file = fileScores.get(filePath);
    if (!file) {
      continue;
    }

    if (!meetsMinPriority(file.priority, options.minRelevancePriority)) {
      continue;
    }

    lines.push(`- ${formatFileLine(file)}`);
    count += 1;
  }

  return lines.join("\n");
}

export function formatRankedSymbols(
  rankedSymbolOrder: string[],
  symbolScores: SymbolRelevanceScore[],
  options: ResolvedPromptBuildOptions,
  limit = 20,
): string {
  const symbolByKey = new Map(
    symbolScores.map((symbol) => [`${symbol.file}::${symbol.symbol}`, symbol]),
  );

  const lines: string[] = ["Priority symbol review order:"];
  let count = 0;

  for (const key of rankedSymbolOrder) {
    if (count >= limit) {
      break;
    }

    const symbol = symbolByKey.get(key);
    if (!symbol) {
      continue;
    }

    if (!meetsMinPriority(symbol.priority, options.minRelevancePriority)) {
      continue;
    }

    lines.push(`- ${formatSymbolLine(symbol)}`);
    count += 1;
  }

  return lines.join("\n");
}

export function formatFileBudgetHints(budget: ContextBudgetAllocation): string {
  if (budget.fileAllocations.length === 0) {
    return "No per-file token allocations available.";
  }

  const lines = budget.fileAllocations.slice(0, 15).map(
    (allocation) =>
      `- ${allocation.file}: ${allocation.tokens} tokens (${(allocation.share * 100).toFixed(1)}%)`,
  );

  return ["Context budget allocation:", ...lines].join("\n");
}
