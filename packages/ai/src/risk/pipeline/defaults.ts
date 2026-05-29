import type { AgentGeneratorOptions, ResolvedAgentGeneratorOptions } from "../../agents/agent-defaults.js";
import { resolveAgentOptions, resolveProvider } from "../../agents/agent-defaults.js";

export interface RiskReviewGeneratorOptions extends AgentGeneratorOptions {
  minConfidenceScore?: number;
  includeMediumConfidence?: boolean;
}

export type ResolvedRiskGeneratorOptions = ResolvedAgentGeneratorOptions & {
  minConfidenceScore: number;
  includeMediumConfidence: boolean;
};

export const DEFAULT_RISK_GENERATOR_OPTIONS: ResolvedRiskGeneratorOptions = {
  model: "gpt-4o-mini",
  temperature: 0.1,
  maxRetries: 3,
  retryDelayMs: 500,
  minConfidenceScore: 0.5,
  includeMediumConfidence: true,
};

export function resolveRiskGeneratorOptions(
  options?: RiskReviewGeneratorOptions,
): ResolvedRiskGeneratorOptions {
  const base = resolveAgentOptions(options, {
    temperature: DEFAULT_RISK_GENERATOR_OPTIONS.temperature,
  });

  return {
    ...base,
    minConfidenceScore:
      options?.minConfidenceScore ?? DEFAULT_RISK_GENERATOR_OPTIONS.minConfidenceScore,
    includeMediumConfidence:
      options?.includeMediumConfidence ?? DEFAULT_RISK_GENERATOR_OPTIONS.includeMediumConfidence,
  };
}

export function resolveRiskProvider(options?: RiskReviewGeneratorOptions) {
  return resolveProvider(
    options,
    "[@pr-review/ai] OPENAI_API_KEY not set; using MockProvider. Set OPENAI_API_KEY for live risk reviews.",
  );
}
