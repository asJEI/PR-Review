import { describe, expect, it } from "vitest";

import { ReviewExecutionMockProvider } from "../../providers/mock-provider.js";
import { createDefaultOrchestrator } from "./review-agent-orchestrator.js";
import { createReviewExecutionFixture } from "../../test-fixtures.js";
import { resolveReviewExecutionOptions } from "../pipeline/defaults.js";
import { ReviewLLMClient } from "../../providers/review-llm-client.js";

describe("review-agent-orchestrator", () => {
  it("runs summary and risk in parallel then comments sequentially", async () => {
    const { input } = createReviewExecutionFixture();
    const orchestrator = createDefaultOrchestrator();
    const options = resolveReviewExecutionOptions({ model: "mock-model" });
    const llmClient = new ReviewLLMClient({
      provider: new ReviewExecutionMockProvider(),
      model: "mock-model",
    });

    const result = await orchestrator.run(input, options, llmClient, {});

    expect(result.summary.title).toBeTruthy();
    expect(result.risks.risks.length).toBeGreaterThan(0);
    expect(result.comments.comments.length).toBeGreaterThan(0);
    expect(result.metrics.summary.attempts).toBeGreaterThanOrEqual(1);
    expect(result.metrics.risk.attempts).toBeGreaterThanOrEqual(1);
    expect(result.metrics.comments.attempts).toBeGreaterThanOrEqual(1);
  });
});
