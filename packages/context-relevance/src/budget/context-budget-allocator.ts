import type {
  ContextBudgetAllocation,
  FileRelevanceScore,
  RelevanceReport,
} from "@pr-review/shared";

import { compressionLevelForPriority } from "../classifiers/priority-classifier.js";
import type { RelevanceScorer } from "../scorers/relevance-scorer.js";
import type { RelevanceState } from "../pipeline/types.js";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function allocateContextBudget(
  files: FileRelevanceScore[],
  totalBudget: number,
  minFileTokens: number,
  maxFileTokens: number,
): ContextBudgetAllocation {
  const active = files.filter((file) => file.priority !== "ignored");

  if (active.length === 0) {
    return { totalBudget, fileAllocations: [] };
  }

  const scoreSum = active.reduce((sum, file) => sum + file.relevanceScore, 0) || 1;
  const allocations = active.map((file) => {
    const share = file.relevanceScore / scoreSum;
    const tokens = clamp(Math.round(share * totalBudget), minFileTokens, maxFileTokens);

    return { file: file.file, tokens, share: Math.round(share * 1000) / 1000 };
  });

  let allocated = allocations.reduce((sum, entry) => sum + entry.tokens, 0);
  let remaining = totalBudget - allocated;

  const ranked = [...allocations].sort(
    (a, b) =>
      (active.find((file) => file.file === b.file)?.relevanceScore ?? 0) -
      (active.find((file) => file.file === a.file)?.relevanceScore ?? 0),
  );

  for (const entry of ranked) {
    if (remaining <= 0) {
      break;
    }

    const current = allocations.find((item) => item.file === entry.file);

    if (!current || current.tokens >= maxFileTokens) {
      continue;
    }

    const add = Math.min(remaining, maxFileTokens - current.tokens);
    current.tokens += add;
    remaining -= add;
  }

  return { totalBudget, fileAllocations: allocations };
}

export function buildRelevanceReport(state: RelevanceState): RelevanceReport {
  const files = [...state.fileScores.values()].sort(
    (a, b) => b.relevanceScore - a.relevanceScore,
  );

  const rankedFileOrder = files
    .filter((file) => file.priority !== "ignored")
    .map((file) => file.file);

  const rankedSymbolOrder = state.symbolScores.map(
    (symbol) => `${symbol.file}::${symbol.symbol}`,
  );

  const ignoredCount = files.filter((file) => file.priority === "ignored").length;

  return {
    source: state.input.reviewContext.source,
    metadata: state.input.reviewContext.metadata,
    files,
    symbols: state.symbolScores,
    modules: state.moduleScores,
    budget: state.budget ?? { totalBudget: state.options.totalContextBudget, fileAllocations: [] },
    rankedFileOrder,
    rankedSymbolOrder,
    stats: {
      filesScored: files.length,
      symbolsScored: state.symbolScores.length,
      ignoredCount,
    },
    scoredAt: new Date().toISOString(),
  };
}

export class ContextBudgetAllocator implements RelevanceScorer {
  readonly id = "context-budget";

  score(state: RelevanceState): RelevanceState {
    const budget = allocateContextBudget(
      [...state.fileScores.values()],
      state.options.totalContextBudget,
      state.options.minFileTokens,
      state.options.maxFileTokens,
    );

    const fileScores = new Map(state.fileScores);

    for (const allocation of budget.fileAllocations) {
      const existing = fileScores.get(allocation.file);

      if (!existing) {
        continue;
      }

      fileScores.set(allocation.file, {
        ...existing,
        suggestedContextTokens: allocation.tokens,
        compressionLevel: compressionLevelForPriority(existing.priority),
      });
    }

    const nextState = { ...state, fileScores, budget };
    const report = buildRelevanceReport(nextState);

    return { ...nextState, report };
  }
}
