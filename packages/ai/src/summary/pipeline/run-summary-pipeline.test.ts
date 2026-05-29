import { describe, expect, it } from "vitest";

import { MockProvider } from "../../providers/mock-provider.js";
import { runSummaryPipeline } from "./run-summary-pipeline.js";
import { createSummaryGeneratorFixture } from "../../test-fixtures.js";

describe("runSummaryPipeline", () => {
  it("generates structured PrSummary end-to-end", async () => {
    const { input } = createSummaryGeneratorFixture();

    const summary = await runSummaryPipeline(input, {
      provider: new MockProvider(),
      model: "mock-model",
    });

    expect(summary.title).toBe("Auth update");
    expect(summary.summary).toMatch(/JWT|auth/i);
    expect(summary.keyChanges.length).toBeGreaterThan(0);
    expect(summary.affectedSystems).toContain("src/auth");
    expect(summary.architecturalImpact.length).toBeGreaterThan(0);
    expect(summary.meta.provider).toBe("mock");
  });
});
