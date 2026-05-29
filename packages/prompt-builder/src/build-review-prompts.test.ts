import { describe, expect, it } from "vitest";

import { buildReviewPrompts } from "./build-review-prompts.js";
import { containsDiffMarkers } from "./utils/prompt-guardrails.js";
import { createPromptBuildFixture } from "./test-fixtures.js";

describe("buildReviewPrompts", () => {
  it("returns summary, risk, and review prompts with stats", () => {
    const { input, relevanceReport } = createPromptBuildFixture();
    const bundle = buildReviewPrompts(input);

    expect(bundle.summaryPrompt).toContain("PR Summary Agent");
    expect(bundle.riskPrompt).toContain("Risk Review Agent");
    expect(bundle.reviewPrompt).toContain("Review Comment Agent");
    expect(bundle.stats.summaryTokens).toBeGreaterThan(0);
    expect(bundle.stats.riskTokens).toBeGreaterThan(0);
    expect(bundle.stats.reviewTokens).toBeGreaterThan(0);
    expect(bundle.builtAt).toBeTruthy();

    expect(bundle.summaryPrompt).toContain("Auth update");
    expect(bundle.riskPrompt).toContain("auth");
    expect(bundle.reviewPrompt).toContain(relevanceReport.rankedFileOrder[0]!);
  });

  it("prioritizes auth jwt file over vendor noise", () => {
    const { input } = createPromptBuildFixture();
    const bundle = buildReviewPrompts(input);

    const reviewFileIndex = bundle.reviewPrompt.indexOf("src/auth/jwt.ts");
    const vendorIndex = bundle.reviewPrompt.indexOf("vendor/react.js");

    expect(reviewFileIndex).toBeGreaterThan(-1);
    if (vendorIndex >= 0) {
      expect(reviewFileIndex).toBeLessThan(vendorIndex);
    }
  });

  it("does not include raw diff markers", () => {
    const { input } = createPromptBuildFixture();
    const bundle = buildReviewPrompts(input);

    expect(containsDiffMarkers(bundle.summaryPrompt)).toBe(false);
    expect(containsDiffMarkers(bundle.riskPrompt)).toBe(false);
    expect(containsDiffMarkers(bundle.reviewPrompt)).toBe(false);
  });

  it("includes Chinese language preference in all agent prompts", () => {
    const { input } = createPromptBuildFixture();
    const bundle = buildReviewPrompts(input);

    for (const prompt of [bundle.summaryPrompt, bundle.riskPrompt, bundle.reviewPrompt]) {
      expect(prompt).toContain("简体中文");
    }
  });
});
