import type { SummaryGeneratorInput } from "@pr-review/shared";

import type { LLMProvider } from "../../providers/llm-provider.js";
import type { ResolvedSummaryGeneratorOptions } from "./defaults.js";
import type { PrSummary } from "@pr-review/shared";
import type { LLMCompletionResponse } from "../../providers/llm-provider.js";

export interface SummaryPipelineState {
  input: SummaryGeneratorInput;
  options: ResolvedSummaryGeneratorOptions;
  provider: LLMProvider;
  completion: LLMCompletionResponse | null;
  summary: PrSummary | null;
}
