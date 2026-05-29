import { describe, expect, it } from "vitest";

import { initPromptBuildState } from "../adapters/prompt-input.js";
import { runPromptBuilders } from "../builders/run-builders.js";
import { assembleAllPrompts } from "./token-aware-assembler.js";
import { createPromptBuildFixture } from "../test-fixtures.js";

describe("token-aware-assembler", () => {
  it("drops low-priority sections when budget is tight", () => {
    const { input } = createPromptBuildFixture();
    let state = initPromptBuildState(input, {
      totalTokenBudget: 200,
      summaryTokenShare: 0.34,
      riskTokenShare: 0.33,
      reviewTokenShare: 0.33,
    });
    state = runPromptBuilders(state);
    state = assembleAllPrompts(state);

    expect(state.stats.sectionsDropped.length).toBeGreaterThan(0);
    expect(state.bundle!.summaryPrompt.length).toBeGreaterThan(0);
  });
});
