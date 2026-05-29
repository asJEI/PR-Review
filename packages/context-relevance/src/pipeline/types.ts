import type {
  ContextBudgetAllocation,
  FileRelevanceScore,
  ModuleRelevanceScore,
  RelevanceInput,
  RelevanceOptions,
  RelevanceReport,
  SymbolRelevanceScore,
} from "@pr-review/shared";

export interface RelevanceState {
  input: RelevanceInput;
  options: Required<RelevanceOptions>;
  fileScores: Map<string, FileRelevanceScore>;
  symbolScores: SymbolRelevanceScore[];
  moduleScores: ModuleRelevanceScore[];
  budget: ContextBudgetAllocation | null;
  report: RelevanceReport | null;
}
