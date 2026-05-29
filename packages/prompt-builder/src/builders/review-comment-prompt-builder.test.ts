import { describe, expect, it } from "vitest";

import { ReviewCommentPromptBuilder } from "./review-comment-prompt-builder.js";
import { initPromptBuildState } from "../adapters/prompt-input.js";
import { createPromptBuildFixture } from "../test-fixtures.js";

describe("ReviewCommentPromptBuilder", () => {
  it("targets high-relevance files and modified functions", () => {
    const { input, relevanceReport } = createPromptBuildFixture();
    let state = initPromptBuildState(input);
    state = new ReviewCommentPromptBuilder().build(state);

    const content = state.reviewSections.map((section) => section.content).join("\n");

    expect(content).toContain(relevanceReport.rankedFileOrder[0]!);
    expect(content).toMatch(/verifyToken|authMiddleware/);
    expect(content).toContain("token expiry");
  });
});
