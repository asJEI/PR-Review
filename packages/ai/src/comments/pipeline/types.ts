import type { ReviewCommentGeneratorInput } from "@pr-review/shared";

import type { LLMCompletionResponse } from "../../providers/llm-provider.js";
import type { ResolvedCommentGeneratorOptions, ReviewCommentGeneratorOptions } from "./defaults.js";

export interface CommentPipelineState {
  input: ReviewCommentGeneratorInput;
  options: ResolvedCommentGeneratorOptions;
  provider: import("../../providers/llm-provider.js").LLMProvider;
  completion: LLMCompletionResponse | null;
  report: import("@pr-review/shared").ReviewCommentReport | null;
}
