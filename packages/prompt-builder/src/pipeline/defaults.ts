import type { PromptBuildOptions } from "@pr-review/shared";

export type ResolvedPromptBuildOptions = Required<PromptBuildOptions>;

export const DEFAULT_PROMPT_BUILD_OPTIONS: ResolvedPromptBuildOptions = {
  totalTokenBudget: 12_000,
  summaryTokenShare: 0.35,
  riskTokenShare: 0.3,
  reviewTokenShare: 0.35,
  maxModulesPerPrompt: 12,
  minRelevancePriority: "low",
};

const PRIORITY_RANK: Record<string, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  ignored: 1,
};

export function resolvePromptBuildOptions(
  options?: PromptBuildOptions,
): ResolvedPromptBuildOptions {
  return {
    totalTokenBudget:
      options?.totalTokenBudget ?? DEFAULT_PROMPT_BUILD_OPTIONS.totalTokenBudget,
    summaryTokenShare:
      options?.summaryTokenShare ?? DEFAULT_PROMPT_BUILD_OPTIONS.summaryTokenShare,
    riskTokenShare: options?.riskTokenShare ?? DEFAULT_PROMPT_BUILD_OPTIONS.riskTokenShare,
    reviewTokenShare:
      options?.reviewTokenShare ?? DEFAULT_PROMPT_BUILD_OPTIONS.reviewTokenShare,
    maxModulesPerPrompt:
      options?.maxModulesPerPrompt ?? DEFAULT_PROMPT_BUILD_OPTIONS.maxModulesPerPrompt,
    minRelevancePriority:
      options?.minRelevancePriority ?? DEFAULT_PROMPT_BUILD_OPTIONS.minRelevancePriority,
  };
}

export function priorityRank(priority: string): number {
  return PRIORITY_RANK[priority] ?? 0;
}

export function meetsMinPriority(
  priority: string,
  minPriority: ResolvedPromptBuildOptions["minRelevancePriority"],
): boolean {
  return priorityRank(priority) >= priorityRank(minPriority);
}

export function agentTokenBudget(
  options: ResolvedPromptBuildOptions,
  agentId: "summary" | "risk" | "review",
): number {
  const share =
    agentId === "summary"
      ? options.summaryTokenShare
      : agentId === "risk"
        ? options.riskTokenShare
        : options.reviewTokenShare;
  return Math.floor(options.totalTokenBudget * share);
}
