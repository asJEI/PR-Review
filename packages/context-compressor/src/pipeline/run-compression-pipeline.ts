import type { CompressionOptions, CompressedReviewContext, ReviewContext } from "@pr-review/shared";

import { initCompressionState } from "../adapters/review-context-input.js";
import { runProcessors } from "../processors/run-processors.js";
import { buildOutput } from "../processors/token-budget-processor.js";

export function runCompressionPipeline(
  input: ReviewContext,
  options?: CompressionOptions,
): CompressedReviewContext {
  let state = initCompressionState(input, options);
  state = runProcessors(state);

  if (state.output) {
    return state.output;
  }

  return buildOutput(state, state.compressedModules);
}
