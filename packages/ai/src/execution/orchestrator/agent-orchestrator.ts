import type { ReviewExecutionInput } from "@pr-review/shared";

import type { OrchestratorResult } from "../pipeline/types.js";
import type { ResolvedReviewExecutionOptions } from "../pipeline/defaults.js";
import type { AgentGeneratorOptions } from "../../agents/agent-defaults.js";
import type { ReviewLLMClient } from "../../providers/review-llm-client.js";

export interface ReviewAgentOrchestrator {
  run(
    input: ReviewExecutionInput,
    options: ResolvedReviewExecutionOptions,
    llmClient: ReviewLLMClient,
    agentOptions: AgentGeneratorOptions,
  ): Promise<OrchestratorResult>;
}
