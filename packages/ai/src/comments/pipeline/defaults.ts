import type { AgentGeneratorOptions, ResolvedAgentGeneratorOptions } from "../../agents/agent-defaults.js";
import { resolveAgentOptions, resolveProvider } from "../../agents/agent-defaults.js";

export interface ReviewCommentGeneratorOptions extends AgentGeneratorOptions {
  minConfidenceScore?: number;
  maxComments?: number;
  processors?: import("../processors/comment-post-processor.js").CommentPostProcessor[];
}

export type ResolvedCommentGeneratorOptions = ResolvedAgentGeneratorOptions & {
  minConfidenceScore: number;
  maxComments: number;
};

export const DEFAULT_COMMENT_GENERATOR_OPTIONS: ResolvedCommentGeneratorOptions = {
  model: "gpt-4o-mini",
  temperature: 0.2,
  maxRetries: 3,
  retryDelayMs: 500,
  minConfidenceScore: 0.5,
  maxComments: 20,
};

export function resolveCommentGeneratorOptions(
  options?: ReviewCommentGeneratorOptions,
): ResolvedCommentGeneratorOptions {
  const base = resolveAgentOptions(options, {
    temperature: DEFAULT_COMMENT_GENERATOR_OPTIONS.temperature,
  });

  return {
    ...base,
    minConfidenceScore:
      options?.minConfidenceScore ?? DEFAULT_COMMENT_GENERATOR_OPTIONS.minConfidenceScore,
    maxComments: options?.maxComments ?? DEFAULT_COMMENT_GENERATOR_OPTIONS.maxComments,
  };
}

export function resolveCommentProvider(options?: ReviewCommentGeneratorOptions) {
  return resolveProvider(
    options,
    "[@pr-review/ai] OPENAI_API_KEY not set; using MockProvider. Set OPENAI_API_KEY for live review comments.",
  );
}
