import { describe, expect, it } from "vitest";

import { SummaryPromptBuilder } from "./summary-prompt-builder.js";
import { initPromptBuildState } from "../adapters/prompt-input.js";
import { createPromptBuildFixture } from "../test-fixtures.js";

describe("SummaryPromptBuilder", () => {
  it("includes module impact and architectural signals without raw hunks", () => {
    const { input } = createPromptBuildFixture();
    let state = initPromptBuildState(input);
    state = new SummaryPromptBuilder().build(state);

    const content = state.summarySections
      .map((section) => `${section.title}\n${section.content}`)
      .join("\n");

    expect(content).toContain("## Module Impact");
    expect(content).toMatch(/auth|jwt/i);
    expect(content).not.toMatch(/^@@/m);
    expect(content).not.toContain("+++ ");
  });
});
