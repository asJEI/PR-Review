import type { RelevanceOptions } from "@pr-review/shared";

export const DEFAULT_RELEVANCE_OPTIONS: Required<RelevanceOptions> = {
  totalContextBudget: 6000,
  minFileTokens: 50,
  maxFileTokens: 1500,
};

export function resolveRelevanceOptions(
  options?: RelevanceOptions,
): Required<RelevanceOptions> {
  return {
    totalContextBudget:
      options?.totalContextBudget ?? DEFAULT_RELEVANCE_OPTIONS.totalContextBudget,
    minFileTokens: options?.minFileTokens ?? DEFAULT_RELEVANCE_OPTIONS.minFileTokens,
    maxFileTokens: options?.maxFileTokens ?? DEFAULT_RELEVANCE_OPTIONS.maxFileTokens,
  };
}
