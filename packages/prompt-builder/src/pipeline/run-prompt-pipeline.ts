import type { PromptBuildInput, PromptBuildOptions, ReviewPromptBundle } from "@pr-review/shared";

import { initPromptBuildState } from "../adapters/prompt-input.js";
import { assembleAllPrompts } from "../assembly/token-aware-assembler.js";
import { runPromptBuilders } from "../builders/run-builders.js";
import { assertNoDiffMarkers } from "../utils/prompt-guardrails.js";

export function runPromptPipeline(
  input: PromptBuildInput,
  options?: PromptBuildOptions,
): ReviewPromptBundle {
  if (!input.compressedContext.modules) {
    throw new Error("PromptBuildInput.compressedContext.modules is required");
  }
  if (!input.relevanceReport.rankedFileOrder) {
    throw new Error("PromptBuildInput.relevanceReport.rankedFileOrder is required");
  }

  let state = initPromptBuildState(input, options);
  state = runPromptBuilders(state);
  state = assembleAllPrompts(state);

  const bundle = state.bundle;
  if (!bundle) {
    throw new Error("Prompt pipeline failed to produce ReviewPromptBundle");
  }

  assertNoDiffMarkers(bundle.summaryPrompt, "summaryPrompt");
  assertNoDiffMarkers(bundle.riskPrompt, "riskPrompt");
  assertNoDiffMarkers(bundle.reviewPrompt, "reviewPrompt");

  return bundle;
}
