import type { ReviewCommentGeneratorInput, ReviewCommentReport } from "@pr-review/shared";

import type { ReviewLLMClient } from "../../providers/review-llm-client.js";
import type { ResolvedCommentGeneratorOptions } from "./defaults.js";

export interface CommentPipelineState {
  input: ReviewCommentGeneratorInput;
  options: ResolvedCommentGeneratorOptions;
  llmClient: ReviewLLMClient;
  report: ReviewCommentReport | null;
}
