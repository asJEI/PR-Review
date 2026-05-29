import { describe, expect, it } from "vitest";

import { RiskPromptBuilder } from "./risk-prompt-builder.js";
import { initPromptBuildState } from "../adapters/prompt-input.js";
import { createPromptBuildFixture } from "../test-fixtures.js";

describe("RiskPromptBuilder", () => {
  it("surfaces auth and middleware risk signals", () => {
    const { input } = createPromptBuildFixture();
    let state = initPromptBuildState(input);
    state = new RiskPromptBuilder().build(state);

    const content = state.riskSections
      .map((section) => `${section.title}\n${section.content}`)
      .join("\n");

    expect(content).toMatch(/auth|jwt|middleware/i);
    expect(content).toContain("## Risk Signals");
  });
});
