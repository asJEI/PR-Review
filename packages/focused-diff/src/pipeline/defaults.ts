import type { FocusedDiffOptions } from "@pr-review/shared";

export const DEFAULT_MAX_ITEMS = 40;
export const DEFAULT_MIN_RELEVANCE = 0.35;
export const DEFAULT_MAX_CONTEXT_LINES = 6;

export function resolveOptions(
  relevanceTotalBudget: number,
  options?: FocusedDiffOptions,
): Required<FocusedDiffOptions> {
  return {
    totalTokenBudget: options?.totalTokenBudget ?? relevanceTotalBudget,
    maxItems: options?.maxItems ?? DEFAULT_MAX_ITEMS,
    maxContextLinesPerSnippet:
      options?.maxContextLinesPerSnippet ?? DEFAULT_MAX_CONTEXT_LINES,
    minRelevanceScore: options?.minRelevanceScore ?? DEFAULT_MIN_RELEVANCE,
  };
}
