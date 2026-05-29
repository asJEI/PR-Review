import { describe, expect, it } from "vitest";

import { initExecutionState } from "./init-execution-state.js";
import { createReviewExecutionFixture } from "../../test-fixtures.js";
import { ReviewExecutionMockProvider } from "../../providers/mock-provider.js";

describe("initExecutionState", () => {
  it("requires all three prompts", () => {
    const { input } = createReviewExecutionFixture();
    const invalid = { ...input, summaryPrompt: "  " };

    expect(() => initExecutionState(invalid)).toThrow(/summaryPrompt/);
  });

  it("creates shared ReviewLLMClient for orchestration", () => {
    const { input } = createReviewExecutionFixture();

    const state = initExecutionState(input, {
      provider: new ReviewExecutionMockProvider(),
      model: "mock-model",
    });

    expect(state.llmClient).toBeTruthy();
    expect(state.options.maxAgentRetries).toBeGreaterThanOrEqual(1);
    expect(state.input).toEqual(input);
  });
});
