import { describe, expect, it } from "vitest";

import { extractFocusedDiffs } from "@pr-review/focused-diff";

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

  it("includes focused code changes when focusedDiffReport is provided", () => {
    const { input, reviewContext, compressedContext, relevanceReport } = createPromptBuildFixture();
    const focusedDiffReport = extractFocusedDiffs({
      reviewContext,
      compressedContext,
      relevanceReport,
    });

    let state = initPromptBuildState({
      ...input,
      focusedDiffReport,
    });
    state = new ReviewCommentPromptBuilder().build(state);

    const titles = state.reviewSections.map((section) => section.title);
    const content = state.reviewSections.map((section) => section.content).join("\n");

    expect(titles.some((title) => title.includes("Focused Code Changes"))).toBe(true);
    expect(content).toMatch(/Focused|No focused diff snippets/);
  });
});
