import { RiskPromptBuilder } from "./risk-prompt-builder.js";
import type { PromptBuilder } from "./prompt-builder.js";
import { ReviewCommentPromptBuilder } from "./review-comment-prompt-builder.js";
import { SummaryPromptBuilder } from "./summary-prompt-builder.js";
import type { PromptBuildState } from "../pipeline/types.js";

export function createDefaultPromptBuilders(): PromptBuilder[] {
  return [
    new SummaryPromptBuilder(),
    new RiskPromptBuilder(),
    new ReviewCommentPromptBuilder(),
  ];
}

export function runPromptBuilders(
  state: PromptBuildState,
  builders: PromptBuilder[] = createDefaultPromptBuilders(),
): PromptBuildState {
  let current = state;
  for (const builder of builders) {
    current = builder.build(current);
  }
  return current;
}
