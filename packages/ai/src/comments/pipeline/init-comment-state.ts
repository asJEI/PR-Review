import type { ReviewCommentGeneratorInput } from "@pr-review/shared";

import { ReviewLLMClient } from "../../providers/review-llm-client.js";
import {
  resolveCommentGeneratorOptions,
  resolveCommentProvider,
  type ReviewCommentGeneratorOptions,
} from "./defaults.js";
import type { CommentPipelineState } from "./types.js";

export function initCommentState(
  input: ReviewCommentGeneratorInput,
  options?: ReviewCommentGeneratorOptions,
): CommentPipelineState {
  if (!input.reviewPrompt.trim()) {
    throw new Error("ReviewCommentGeneratorInput.reviewPrompt is required");
  }
  if (!input.compressedContext.modules) {
    throw new Error("ReviewCommentGeneratorInput.compressedContext.modules is required");
  }

  const resolvedOptions = resolveCommentGeneratorOptions(options);
  const provider = resolveCommentProvider(options);

  return {
    input,
    options: resolvedOptions,
    llmClient: new ReviewLLMClient({
      provider,
      model: resolvedOptions.model,
      temperature: resolvedOptions.temperature,
    }),
    report: null,
  };
}

export { getBaseProviderId } from "../../providers/provider-utils.js";
