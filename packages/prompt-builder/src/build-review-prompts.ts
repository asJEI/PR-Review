import type { PromptBuildInput, PromptBuildOptions, ReviewPromptBundle } from "@pr-review/shared";

import { runPromptPipeline } from "./pipeline/run-prompt-pipeline.js";

/**
 * Builds structured, token-budgeted prompts for summary, risk, and review agents.
 * Provider-agnostic — no LLM calls.
 */
export function buildReviewPrompts(
  input: PromptBuildInput,
  options?: PromptBuildOptions,
): ReviewPromptBundle {
  return runPromptPipeline(input, options);
}
