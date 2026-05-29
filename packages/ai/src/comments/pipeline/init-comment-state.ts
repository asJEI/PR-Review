import type { ReviewCommentGeneratorInput } from "@pr-review/shared";

import { getBaseProviderId } from "../../agents/agent-defaults.js";
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

  return {
    input,
    options: resolveCommentGeneratorOptions(options),
    provider: resolveCommentProvider(options),
    completion: null,
    report: null,
  };
}

export { getBaseProviderId };
