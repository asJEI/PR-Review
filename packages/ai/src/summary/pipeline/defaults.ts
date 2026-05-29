import type { AgentGeneratorOptions, ResolvedAgentGeneratorOptions } from "../../agents/agent-defaults.js";
import { resolveAgentOptions, resolveProvider } from "../../agents/agent-defaults.js";

export type SummaryGeneratorOptions = AgentGeneratorOptions;

export type ResolvedSummaryGeneratorOptions = ResolvedAgentGeneratorOptions;

export const DEFAULT_SUMMARY_GENERATOR_OPTIONS: ResolvedSummaryGeneratorOptions = {
  model: "gpt-4o-mini",
  temperature: 0.2,
  maxRetries: 3,
  retryDelayMs: 500,
};

export function resolveSummaryGeneratorOptions(
  options?: SummaryGeneratorOptions,
): ResolvedSummaryGeneratorOptions {
  return resolveAgentOptions(options, DEFAULT_SUMMARY_GENERATOR_OPTIONS);
}

export { resolveProvider };
