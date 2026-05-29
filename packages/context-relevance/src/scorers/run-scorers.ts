import { ContextBudgetAllocator } from "../budget/context-budget-allocator.js";
import { FileRelevanceScorer } from "./file-relevance-scorer.js";
import { ModuleRelevanceScorer } from "./module-relevance-scorer.js";
import type { RelevanceScorer } from "./relevance-scorer.js";
import { SymbolRelevanceScorer } from "./symbol-relevance-scorer.js";
import type { RelevanceState } from "../pipeline/types.js";

export function createDefaultScorers(): RelevanceScorer[] {
  return [
    new FileRelevanceScorer(),
    new SymbolRelevanceScorer(),
    new ModuleRelevanceScorer(),
    new ContextBudgetAllocator(),
  ];
}

export function runScorers(
  state: RelevanceState,
  scorers: RelevanceScorer[] = createDefaultScorers(),
): RelevanceState {
  return scorers.reduce((current, scorer) => scorer.score(current), state);
}
