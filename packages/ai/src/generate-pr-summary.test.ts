import { describe, expect, it } from "vitest";

import { generatePrSummary } from "./summary/summary-generator-service.js";
import { MockProvider } from "./providers/mock-provider.js";
import { SummaryParseError } from "./utils/errors.js";
import { createSummaryGeneratorFixture } from "./test-fixtures.js";

describe("generatePrSummary", () => {
  it("exposes public API for summary generation", async () => {
    const { input } = createSummaryGeneratorFixture();

    const summary = await generatePrSummary(input, {
      provider: new MockProvider(),
    });

    expect(summary.summary).toBeTruthy();
    expect(summary.keyChanges.length).toBeGreaterThan(0);
  });

  it("propagates parse errors from invalid LLM output", async () => {
    const { input } = createSummaryGeneratorFixture();

    await expect(
      generatePrSummary(input, {
        provider: new MockProvider({ response: "not-json" }),
      }),
    ).rejects.toThrow(SummaryParseError);
  });
});
